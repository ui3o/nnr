#!/usr/bin/env node

const fs = require('fs');
const prompts = require('prompts');
const { spawn } = require('child_process');
const yargs = require("yargs");


const COMMENT = 'comment:'

// cli setup
const options = yargs
    .usage(`Name: Node based Npm Run, Easy replacement for npm run.\n\nUsage: nnr [OPTION...] scripts.key`)
    //.option("n", { alias: "name", describe: "Your name", type: "string", demandOption: true })
    .option("j", { alias: "packagejsonpath", describe: "Path to package.json file", type: "string" })
    .option("p", { alias: "parallel", describe: "Run a group of tasks in parallel", type: "boolean" })
    .option("s", { alias: "sequential", describe: "Run a group of tasks sequentially", type: "string" })
    .alias('v', 'version')
    .alias('h', 'help')
    .epilog('copyright@2020')
    .argv;

console.log(JSON.stringify(options));
const currentScriptId = options._[0];
const packagejson = options.j ? options.j : 'package.json';
const scripts = JSON.parse(fs.readFileSync(packagejson)).scripts;
const choices = [];

if(currentScriptId) {

} else {
    Object.keys(scripts).forEach(key => {
        if (!key.startsWith(COMMENT)) {
            const mitem = { title: key, value: key };
            // find comment
            Object.keys(scripts).forEach(comment => {
                if (comment.startsWith(COMMENT)) {
                    const commentKey = comment.replace(COMMENT, '');
                    if (commentKey === key) {
                        mitem.description = scripts[comment];
                    }
                }
            });
            choices.push(mitem);
        }
    });
}


(async function () {
    response = await prompts({
        type: 'select',
        name: 'value',
        message: 'Select environment',
        choices
    });
    if (response.value) {
        await runcmd(scripts[response.value]);
    }
})();

async function runcmd(script, options) {
    options = !options ? {} : options;
    options.cwd = !options.cwd ? null : options.cwd;

    const cmd = spawn('bash', ['-c', script.replace('/\\/g', '\\\\')], { cwd: options.cwd });
    const onClose = new Promise((resolve) => {
        cmd.on('close', (code) => resolve(code));
    });
    for await (const data of cmd.stderr) {
        console.log(data.toString());
    }
    for await (const data of cmd.stdout) {
        console.log(data.toString());
    }
    return onClose;
}
