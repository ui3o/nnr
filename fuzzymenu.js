
const prompts = require('prompts');
const FuzzySearch = require('fuzzy-search');

async function _prompt(choices, message) {
  const searcher = new FuzzySearch(choices, ["title", "description"], {
    caseSensitive: false,
  });

  const respone = await prompts({
    choices,
    message: message,
    name: "title",
    suggest: (input) => searcher.search(input),
    type: "autocomplete",
  });
  const index = choices.findIndex(element => element.title === respone.title)
  return choices[index];
}

function _cmdFinder(key) {
  return key !== 'desc' && key !== 'sub' && key !== 'title';
}

module.exports = async function fmenu(choices, message) {
  const fullValue = [];

  var response = await _prompt(choices, message);
  const cmd = Object.keys(response).find(v => _cmdFinder(v));
  fullValue.push(response[cmd]);
  while (response.sub) {
    response = await _prompt(response.sub.map(v => {
      v.title = Object.keys(v).find(vv => _cmdFinder(vv));
      v.description = v.desc;
      delete v["desc"];
      return v;
    }), message);
    const cmd = Object.keys(response).find(v => _cmdFinder(v));
    fullValue.push(response[cmd]);
  }
  return fullValue.join(' ');
}