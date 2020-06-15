# nnr

**N**ode based **N**pm **R**un

Easy replacement for `npm run`. Just run `nrr script:name` instead of ~~npm run script:name~~

# Install 
* ```npm i -g nnr```
* Install [Cygwin](https://www.cygwin.com/) on Windows! see [here](#Dependencies)

# Motivation
* cross platform (windows and linux) script in npm-script
* resolves
    * environment variable, possible to use only $ENV_VAR, no longer need on %ENV_VAR% on window
    * possible to use same command on windows and linux with [Cygwin](https://www.cygwin.com/)


# Features

* `desc:` description tag for all script
* run multiple npm-scripts in parallel or sequential like *[npm-run-all](https://github.com/mysticatea/npm-run-all)*
* all script runs inside a *bash* shell

# Examples

Examples are located in [test/package.json](test/package.json) file.

# Dependencies

* Install [Cygwin](https://www.cygwin.com/)
* **IMPORTANT!! Add** Cygwin **path** to **Environment** variables to **top** level, which replace the default windows commands like find and etc.

![Alt text](/docs/windows_settings.png?raw=true)

# Usage

| command        | description|
| ------------- |:-------------|
| *nrr* | without parameters it gives a nice *choices* menu |
| *nrr --help* | gives a standard help manual which is generated with [yargs](https://www.npmjs.com/package/yargs)|


# Status

* [x] support menu for select a script
* [x] support sequential run
* [ ] support parallel run
* [x] support package.json file
* [x] support *.yml file

# Alternatives

* [npm-run-all](https://github.com/mysticatea/npm-run-all)