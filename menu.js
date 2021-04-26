
const prompts = require('prompts');
const ansi = require('sisteransi');
const pointerSmall = '›';
async function _prompt(choices, message, autoselect) {

  function search(input) {
    const keys = ["title"];
    const findings = [];
    choices.forEach(element => {
      const line = [];
      keys.forEach(key => {
        line.push(element[key]);
      })
      if (line.join(' - ').toLocaleLowerCase().includes(input.trim().toLocaleLowerCase())) {
        findings.push(element);
      }
    });
    return findings;
  }

  let exitFired = false;
  let select = false;
  let done = false;
  const response = await prompts({
    choices,
    message: message,
    name: "value",
    clearFirst: true,
    fallback: {
      title: `Wrong selection, please select correct option!`
    },
    suggest: (input) => search(input),
    type: "autocomplete",
    onState: (state) => {
      exitFired = state.exited ? true : false;
    },
    onRender: function () {
      select = this.select;
      if ((autoselect && this.suggestions.length === 1 && !done)
        || (this.input.endsWith(' ') && !done)) {
        const prompt = this;
        done = true;
        setTimeout(function () {
          prompt.submit();
        }, 0);
      }
    }
  });

  if (exitFired) {
    return { index: select, result: null };
  }

  const index = choices.findIndex(element => element.title === response.value)
  if (index < 0) {
    process.exit(1);
  }

  return { index: index, result: choices[index] };
}

module.exports = {
  cmdFinder: function _cmdFinder(key) {
    return key !== 'desc' && key !== 'sub' && key !== 'title' && key !== '_parent_';
  },
  fmenu: async function _fmenu(choices, message) {
    const fullValue = [];
    const fullCmdList = [choices];
    const fullCmdListTitles = [];
    let completed = false;

    while (!completed) {
      var response = await _prompt(fullCmdList[fullCmdList.length - 1], fullCmdListTitles.join(` ${pointerSmall} `));
      if (response.result === null) {
        fullCmdList.pop();
        fullCmdListTitles.pop();
        fullValue.pop();
        if (!fullCmdList.length) {
          process.exit(-1);
        }
      } else {
        const cmd = Object.keys(response.result).find(v => module.exports.cmdFinder(v));
        fullValue.push(response.result[cmd]);
        if (response.result.sub) {
          fullCmdListTitles.push(fullCmdList[fullCmdList.length - 1][response.index].title);
          fullCmdList.push(response.result.sub.map(v => {
            v.title = Object.keys(v).find(vv => module.exports.cmdFinder(vv));
            v.description = v.desc;
            delete v["desc"];
            return v;
          }));
        } else {
          completed = true;
        }
      }
      if (!completed) {
        const lastTitleLen = Math.floor(
          (fullCmdListTitles.join(` ${pointerSmall} `).length
            + 2
            + 2)
          / process.stdout.columns);
        process.stdout.write(ansi.erase.lines(lastTitleLen + 2));
      }
    }

    return fullValue.join(' ');
  }
}
