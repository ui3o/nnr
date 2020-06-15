#!/usr/bin/env node

const fs = require('fs');
const prompts = require('prompts');
const { spawn } = require('child_process');
const yargs = require("yargs");
const yaml = require('js-yaml');

const DESC = 'desc:'

// cli setup
const options = yargs
    .usage(`Name: Node based Npm Run, Easy replacement for npm run.\n\nUsage: nnr [OPTION...] scripts.key`)
    //.option("n", { alias: "name", describe: "Your name", type: "string", demandOption: true })
    .option("c", { alias: "cw", describe: "Current working directory", type: "string" })
    .option("j", { alias: "packagejsonpath", describe: "Path to package.json file", type: "string" })
    .option("y", { alias: "yamlpath", describe: "Path to *.yml file", type: "string" })
    .option("k", { alias: "keep", describe: "Keep the current directory for working directory", type: "boolean" })
    .option("p", { alias: "parallel", describe: "Run a group of tasks in parallel", type: "boolean" })
    .option("s", { alias: "sequential", describe: "Run a group of tasks sequentially", type: "string" })
    .option("d", { alias: "debug", describe: "Turn on debug log", type: "boolean" })
    .alias('v', 'version')
    .alias('h', 'help')
    .epilog('copyright@2020')
    .argv;

const log = options.d ? console.log : () => { };
log(JSON.stringify(options));

var regex = '.*';
const currentScriptId = options._[0];
const packagejson = options.j ? options.j : 'package.json';
const path = options.k ? '' :
    options.c ? options.c :
        options.y ? options.y.replace(/[\w]*\.yml/, '') :
            packagejson.replace(/[\w]*\.json/, '');
const choices = [];
var scripts;

if (options.y) {
    scripts = yaml.safeLoad(fs.readFileSync(options.y, 'utf8')).scripts;
} else {
    scripts = JSON.parse(fs.readFileSync(packagejson)).scripts;
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
    log(`currentScriptId: ${currentScriptId}`)
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
    log('key', key)
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
        choices.push(mitem);
    }
});


log(JSON.stringify(choices));
(async function () {
    if (choices.length > 1) {
        response = await prompts({
            type: 'select',
            name: 'value',
            message: 'Select environment',
            choices
        });
        if (response.value) {
            log('response.value', response.value)
            await runcmd(scripts[response.value]);
        }
    } else if (choices.length === 1) {
        let script = scripts[choices[0].value];
        // run single command
        log('script', script)
        await runcmd(script);
    }
})();

async function runcmd(script) {
    log('script=', script)
    const cmd = spawn('bash', ['-c', script.replace('/\\/g', '\\\\')], { stdio: 'inherit' });
    const onClose = new Promise((resolve) => {
        cmd.on('close', (code) => resolve(code));
    });
    return onClose;
}
