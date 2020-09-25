
const prompts = require('prompts');
const FuzzySearch = require('fuzzy-search');

module.exports = async function fmenu(choices, message) {
  
  const searcher = new FuzzySearch(choices, ["title", "description"], {
    caseSensitive: false,
  });
  const response = await prompts({
    choices,
    message: message,
    name: "value",
    suggest: (input) => searcher.search(input),
    type: "autocomplete",
  });
  return response.value;
}