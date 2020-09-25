#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const prompts = require('prompts');
const { spawn } = require('child_process');
const yargs = require("yargs");
const yaml = require('js-yaml');
const pathLib = require("path");
const isWin = process.platform === "win32";
const menu = require('./fuzzymenu.js');

module.exports = async function nnr(sequential, currentFile, setglobal) {
    const DESC = 'desc:';
    // replace fix windows issue
    const ENVFILE = os.tmpdir().replace(/\\/g, '/') + '/.nnrenv';

    // cli setup
    const options = yargs
        .usage(`Name: Node based Npm Run. Easy replacement for npm run.\n\nUsage: nnr [OPTION...] [path/to/.json | path/to/.yml] [scripts.key]`)
        //.option("n", { alias: "name", describe: "Your name", type: "string", demandOption: true })
        .option("c", { alias: "cw", describe: "Current working directory", type: "string" })
        .option("k", { alias: "keep", describe: "Keep the current directory for working directory", type: "boolean" })
        .option("s", { alias: "sequential", describe: "Run a group of tasks sequentially", type: "boolean" })
        .option("a", { alias: "ask", describe: "Ask to continue. Press any key to continue or CTRL+C stop the process. Only with -s", type: "boolean" })
        .option("g", { alias: "setglobalenvmode", describe: "Set environment variable into $SYSTEM_TMP/.nnrenv. Usage: nnrg ENV_NAME value, where value [true|false|number|string]", type: "boolean" })
        .option("n", { alias: "dontremoveglobalenv", describe: "Do not remove $SYSTEM_TMP/.nnrenv file", type: "boolean" })
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
        env['NNR_ORIGINALPATH'] = process.cwd();
        if (!options.n) {
            // remove tmp .nnrenv var
            await runcmd(`rm -rf ${ENVFILE}`);
        }
        // create tmp .nnrenv var
        await runcmd(`touch -m ${ENVFILE}`);
    }

    // mode: only set environment variable into $NNR_ORIGINALPATH/.nnrenv
    if (options.g || setglobal) {
        const envName = options._[0];
        let envValue = options._[1];
        log('set only environment variable', envName, envValue);
        if (envValue === undefined) {
            console.log('[ERROR] Value of environment variable was set!');
            process.exit(-1);
        }
        envValue = !isNaN(envValue) ? envValue : envValue === 'true' ? true : envValue === 'false' ? false : `${envValue}`;
        await runcmd(`echo ${envName}=${envValue} >> ${ENVFILE}`);
        process.exit(0);
    }

    // detect local json
    const localPackageJson = `${process.cwd()}/package.json`
    log('localPackageJson', localPackageJson);
    if (fs.existsSync(localPackageJson)) {
        // add node modules bin to path
        if (isWin) {
            env.Path = process.cwd() + '\\node_modules\\.bin;' + env.Path;
        } else {
            env.PATH = process.cwd() + '/node_modules/.bin:' + env.PATH;
        }
        // get all npm env variable
        await getenv();
    }
    // log('newEnv', process.env)

    // detect local json
    const localnnrYml = `${process.cwd()}/nnr.yml`
    log('localnnr.yml', localnnrYml);
    if (fs.existsSync(localnnrYml)) {
        options.y = localnnrYml;
    }

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
            var mitem = { title: key, cmd: scripts[key]};
            if (typeof scripts[key] !== "string") {
                mitem = scripts[key];
                mitem.title = key;
            }
            // find comment
            Object.keys(scripts).forEach(comment => {
                if (comment.startsWith(DESC)) {
                    const commentKey = comment.replace(DESC, '');
                    if (commentKey === key) {
                        mitem.description = scripts[comment];
                    }
                }
            });
            // pass key cmd if description not present
            if (!mitem.description) {
                mitem.description = scripts[key].desc ? scripts[key].desc : JSON.stringify(scripts[key]);
            }
            delete mitem["desc"];
            choices.push(mitem);
        }
    });


    log(JSON.stringify(choices));
    if (choices.length > 1) {
        let scripts2run = [];
        if (!options.s) {
            response = await menu.fmenu(choices, 'Select script');
            if (response) {
                log('response', response);
                scripts2run.push(response);
            }
        } else {
            log(choices.map(choice => choice.cmd));
            scripts2run = choices.map(choice => choice.cmd);
        }
        for (const src of scripts2run) {
            // append to process env
            appendEnv(fs.readFileSync(ENVFILE, 'utf8'), true);
            if (await runcmd(src) !== 0) {
                process.exit(1);
            }
        }
    } else if (choices.length === 1) {
        const cmd = Object.keys(choices[0]).find(v => menu.cmdFinder(v));
        let script = choices[0][cmd];
        // run single command
        log('script', script);
        // append to process env
        appendEnv(fs.readFileSync(ENVFILE, 'utf8'), true);
        await runcmd(script);
    }

    async function runcmd(script) {
        log('script=', script);
        if (typeof script !== "string") {
            console.log('Your script file is invalid!')
            process.exit(1);
        }
        const scrpt = script.replace('/\\/g', '\\\\');
        if (options.s && (options.a || env.NNR_ASKTOCONTINUE)) {
            // prompt for keypress to continue
            process.stdout.write(`[run] >> ${scrpt}`);
            await ask().then(() => { console.log() });
        }
        const cmd = spawn('bash', ['-c', scrpt], { stdio: 'inherit' });
        return new Promise((resolve) => {
            cmd.on('close', (code) => resolve(code));
        });
    }

    async function getenv() {
        const cmd = spawn('npm', ['run', 'env'], { shell: true });
        cmd.stdout.on('data', (data) => {
            appendEnv(data.toString('utf8'));
        });
        cmd.stderr.on('data', (data) => {
            console.error(data);
        });
        return new Promise((resolve) => {
            cmd.on('close', (code) => resolve(code));
        });
    }

    function appendEnv(allEnv, all) {
        log('appendEnv', JSON.stringify(allEnv));
        allEnv = allEnv.replace('\r', '').split('\n');
        allEnv.forEach(e => {
            if (e.startsWith('npm_') || all) {
                const ce = e.split('=');
                // log('npm env:', ce[0], '=', ce[1])
                env[ce[0]] = ce[1] === undefined ? '' : ce[1].replace('\r', '').replace('\n', '');
            }
        });
    }


    async function ask() {
        return new Promise((resolve) => {
            const handler = buffer => {
                process.stdin.removeListener("data", handler);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                const bytes = Array.from(buffer);
                if (bytes.length && bytes[0] === 3) {
                    process.exit(1);
                }
                process.nextTick(resolve);
            };

            process.stdin.resume();
            process.stdin.setRawMode(true);
            process.stdin.once("data", handler);
        });
    }

}
