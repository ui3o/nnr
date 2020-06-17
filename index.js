#!/usr/bin/env node

const fs = require('fs');
const prompts = require('prompts');
const { spawn } = require('child_process');
const yargs = require("yargs");
const yaml = require('js-yaml');
var pathLib = require("path");


module.exports = async function nnr(sequential, currentFile) {
    const DESC = 'desc:'

    // cli setup
    const options = yargs
        .usage(`Name: Node based Npm Run. Easy replacement for npm run.\n\nUsage: nnr [OPTION...] [path/to/.json | path/to/.yml] [scripts.key]`)
        //.option("n", { alias: "name", describe: "Your name", type: "string", demandOption: true })
        .option("c", { alias: "cw", describe: "Current working directory", type: "string" })
        .option("k", { alias: "keep", describe: "Keep the current directory for working directory", type: "boolean" })
        .option("s", { alias: "sequential", describe: "Run a group of tasks sequentially", type: "boolean" })
        .option("p", { alias: "parallel", describe: "Run a group of tasks in parallel", type: "boolean" })
        .option("d", { alias: "debug", describe: "Turn on debug log", type: "boolean" })
        .alias('v', 'version')
        .alias('h', 'help')
        .epilog('copyright@2020')
        .argv;
    const log = options.d ? console.log : () => { };

    if (options._.length > 2) {
        console.log('[ERROR] Too many argument was set!')
        process.exit(-1);
    }

    const env = process.env;
    // add original path
    if (!env.NNR_ORIGINALPATH) {
        env['NNR_ORIGINALPATH'] = env.PWD;
    }
    // detect local json
    const localPackageJson = `${env.PWD}/package.json`
    log('localPackageJson', localPackageJson);
    if (fs.existsSync(localPackageJson)) {
        // add node modules bin to path
        env.PATH = env.PWD + '/node_modules/.bin:' + env.PATH;
        // get all npm env variable
        await getenv();
    }
    // log('newEnv', process.env)


    let currentScriptId = '';
    options.j = 'package.json'
    options._.forEach(param => {
        if (param.endsWith('.json') || param.endsWith('.yml')) {
            filePath = param;
            options.y = param.endsWith('.yml') ? param : undefined;
            options.j = param.endsWith('.json') ? param : undefined;
        } else {
            currentScriptId = param;
        }
    });

    if (currentFile) {
        options.y = currentFile.endsWith('.yml') ? currentFile : undefined;
        options.j = currentFile.endsWith('.json') ? currentFile : undefined;
    } else {
        env.NNR_ORIGINALFILE = options.y ? pathLib.resolve(options.y) : pathLib.resolve(options.j);
    }

    if (sequential !== undefined && sequential) {
        log('set sequential')
        options.s = true;
    } else if (sequential !== undefined && sequential === false) {
        log('set parallel')
        options.p = true;
    }

    log(JSON.stringify(options));

    var regex = '.*';
    const path = options.k ? '' :
        options.c ? options.c :
            options.y ? options.y.replace(/[\w]*\.yml/, '') :
                options.j.replace(/[\w]*\.json/, '');
    const choices = [];
    var scripts;

    if (options.y) {
        scripts = yaml.safeLoad(fs.readFileSync(options.y, 'utf8'));
    } else {
        scripts = JSON.parse(fs.readFileSync(options.j)).scripts;
    }


    log(`Current directory: ${process.cwd()}`);

    if (path.length > 0) {
        log('path', path)
        log(`Starting directory: ${process.cwd()}`);
        try {
            process.chdir(path);
            log(`New directory: ${process.cwd()}`);
        } catch (err) {
            error(`chdir: ${err}`);
        }
    }

    if (currentScriptId) {
        log(`currentScriptId: ${currentScriptId}`);
        if (currentScriptId.endsWith('**')) {
            regex = currentScriptId.replace('**', '.*');
        } else if (currentScriptId.endsWith('*')) {
            regex = currentScriptId.replace('*', '[\\w-#@$%&*+=]*$');
        } else {
            regex = `${currentScriptId}$`;
        }
    }

    log('regex=', regex);
    Object.keys(scripts).forEach(key => {
        log('key', key);
        if (!key.startsWith(DESC) && key.match(regex)) {
            const mitem = { title: key, value: key };
            // find comment
            Object.keys(scripts).forEach(comment => {
                if (comment.startsWith(DESC)) {
                    const commentKey = comment.replace(DESC, '');
                    if (commentKey === key) {
                        mitem.description = scripts[comment];
                    }
                }
            });
            // pass key value if description not present
            if (!mitem.description) {
                mitem.description = scripts[key];
            }
            choices.push(mitem);
        }
    });


    log(JSON.stringify(choices));
    if (choices.length > 1) {
        let scripts2run = [];
        if (!options.s) {
            response = await prompts({
                type: 'select',
                name: 'value',
                message: 'Select environment',
                choices
            });
            if (response.value) {
                log('response.value', response.value);
                scripts2run.push(response.value);
            }
        } else {
            log(choices.map(choice => choice.value));
            scripts2run = choices.map(choice => choice.value);
        }
        for (const key of scripts2run) {
            await runcmd(scripts[key]);
        }
    } else if (choices.length === 1) {
        let script = scripts[choices[0].value];
        // run single command
        log('script', script);
        await runcmd(script);
    }

    async function runcmd(script) {
        log('script=', script);
        const cmd = spawn('bash', ['-c', script.replace('/\\/g', '\\\\')], { stdio: 'inherit' });
        return new Promise((resolve) => {
            cmd.on('close', (code) => resolve(code));
        });
    }

    async function getenv() {
        const cmd = spawn('npm', ['run', 'env']);
        cmd.stdout.on('data', (data) => {
            const allEnv = data.toString('utf8').replace('\r').split('\n');
            allEnv.forEach(e => {
                if (e.startsWith('npm_')) {
                    const ce = e.split('=');
                    // log('npm env:', ce[0], '=', ce[1])
                    env[ce[0]] = ce[1];
                }
            });
        });
        cmd.stderr.on('data', (data) => {
            console.error(data);
        });
        return new Promise((resolve) => {
            cmd.on('close', (code) => resolve(code));
        });
    }

}
