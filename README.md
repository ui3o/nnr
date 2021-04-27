# nnr

**N**ode based **N**pm **R**un

Easy replacement for `npm run`. Just run `nnr script:name` instead of ~~npm run script:name~~

# Install 
* ```npm i -g nnr```
* Install [Cygwin](https://www.cygwin.com/) on Windows! see [here](#Dependencies)

# Motivation
* cross platform (windows and linux) script in npm-script
* resolves
    * environment variable, possible to use only $ENV_VAR, no longer need on %ENV_VAR% on window
    * possible to use same command on windows and linux with [Cygwin](https://www.cygwin.com/)


# Features

* possible to run script from located .json or .yml
* default nnr.yml detection in the current folder
* in .yml file possible to use import array with relative and absolute path
* in .yml file possible to use `eval:` for evaluate a javascript command
* like finder search in the scripts (if string includes)
* prompt base submenu system, please read [nnr.yml#1](nnr.yml#1)
* inherit npm variables
* it provides extra **NNR_ORIGINALPATH** environment variable to know the original call path
* possible to **debug sequential** run with **-a** option or **NNR_ASKTOCONTINUE=true** environment variable. Any key to continue or CTRL+C to terminate all process
* possible to create custom environment variable with **-g** option, or use `nnrg` for direct call e.g: [test/test.yml](test/test.yml#23). It use `os.tmp/.nnrenv` temporary file for this operation. If `-n` option is set the file history will not be cleared after restart
* `desc:` description tag for all script
* run multiple npm-scripts in parallel or sequential like *[npm-run-all](https://github.com/mysticatea/npm-run-all)*
* all **script runs** inside a *bash* shell
* menu control keys:
  * **select**: space, enter
  * **one level up**: esc
  * **on top level**: esc equals exit
  * **terminate**: ctrl+c
# Examples

Examples are located in [test/package.json](test/package.json) file or [test/test.yml](test/test.yml) or [nnr.yml](nnr.yml).

# Dependencies

* Install [Cygwin](https://www.cygwin.com/)
* **IMPORTANT!! Add** Cygwin **path** to **Environment** variables to **top** level, which replace the default windows commands like find and etc.

![Alt text](/docs/windows_settings.png?raw=true)

# Usage

| command        | description|
| ------------- |:-------------|
| *nnr* | without parameters it gives a nice *choices* menu |
| *nnr --help* | gives a standard help manual which is generated with [yargs](https://www.npmjs.com/package/yargs)|


# Status

* [x] support menu for select a script
* [x] support sequential run
* [ ] support parallel run
* [x] support package.json file
* [x] support *.yml file

# Alternatives

* [npm-run-all](https://github.com/mysticatea/npm-run-all)