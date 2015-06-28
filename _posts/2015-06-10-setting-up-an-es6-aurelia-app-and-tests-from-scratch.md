---
draft: true
layout: post
title: Setting Up An ES6 Aurelia App And Tests From Scratch
tags: [Aurelia,ES6]
---

The [getting started guide on the Aurelia site](http://aurelia.io/get-started.html) is a nice way to get up and running quickly. This post will dig a little deeper and set up an ES6 Aurelia app with tests from scratch. The following post assumes that you are using [gulp](http://gulpjs.com/). If not, start [here](https://travismaynard.com/writing/getting-started-with-gulp).

### Setting up Transpilation

First we need to set up [transpilation](http://en.wikipedia.org/wiki/Source-to-source_compiler) to convert our ES6 code into something current browsers can understand. There are [many transpilers out there](https://github.com/addyosmani/es6-tools#transpilers) but we will be using [Babel](https://github.com/babel/babel) (Formerly 6to5) in this example. Transpilation can be done dynamically in the browser or statically. The former is not appropriate for production so we will do the latter and setup a watcher for dev. 

Install the following node modules:

```bash
npm install gulp-babel --save
npm install gulp-sourcemaps --save
npm install gulp-rename --save
```

Then add the following task to your `gulpfile.js`:

```js
var sourcemaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var rename = require('gulp-rename');

gulp.task('babel', function () {
    return gulp.src('**/*.es6', { base: '.' })
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(rename({ extname: '.js' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('.'));
});
```

Here we are transpiling ES6 files (with a `.es6` extension) to ES5. The default module format is [CommonJS](http://www.commonjs.org/). We are transpiling to this module format as it can be understood on the browser by [SystemJS](https://github.com/systemjs/systemjs) (Which we'll cover in a bit) and natively by Node.js for our tests. We are also generating [source map](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) files so that transpiled code can be mapped to the original ES6 code when debugging. Finally the output is renamed to `*.js`. Since we don't want to commit generated `.js` files to our repository we can selectively exclude with `.gitignore`'s:

```
*.js
# Any exclusions
!gulpfile.js
```
We'll set up the watcher below when we setup the tests.

### Setting up the Test Runner

We will use the [Mocha](http://mochajs.org/) test framework and [Chai](http://chaijs.com/) assertion library. We make our `test` task depend on the `babel` task to transpile *before* running the tests. And since [Node.js doesn't natively support source maps](https://github.com/joyent/node/issues/3712), we'll need to use the `source-map-support` module. We also need to reference the [core-js](https://github.com/zloirock/core-js) ES* pollyfill to get ES6 API support in Node.

Install the following node modules:

```bash
npm install gulp-mocha --save
npm install chai --save
npm install source-map-support --save
npm install core-js --save
```

Then add the following task to your `gulpfile.js`:

```js
var mocha = require('gulp-mocha');
var process = require('child_process');
require('source-map-support').install();
require('core-js');

gulp.task('watch', function () {
    var spawnTests = function() {
        process.spawn('gulp', ['test'], { stdio: 'inherit' });
    }
    spawnTests();
    gulp.watch('**/*.es6', spawnTests);
});

gulp.task('test', ['babel'], function () {
    return gulp.src(['tests/**/*.js'])
        .pipe(mocha({ reporter: 'spec', ui: 'bdd' }));
});
```

Here we add the watcher that transpiles our ES6 code then fires off the test runner. Spawning the test runner prevents certain failures from stopping the watch loop. Also, since the watch is fired only on changes, we run it right off the bat so we don't have to wait for changes to see results.

Now we'll create a fixture called `app.es6` with a dummy test to make sure everything is working:

```js
import { expect } from 'chai';
 
describe('Test', () =>
    it('should work.', () => 
        expect(1).to.equal(1)
    )
);
```

And run the tests:

```bash
gulp watch
```

### Setting up SystemJS & jspm

Aurelia fully embraces ES6 and is made up of many composable modules. This allows you to pick and choose what pieces you want to use. As such, [there isn't one single file you can reference](https://github.com/aurelia/framework/issues/40) like you would with jQuery or Angular 1.x. This presents a number of challenges. First, how do we easily get a hold of all the modules we want? And second, in an ES5 world, how do we wire up and load all these modules? Both of these problems are solved by the [SystemJS](https://github.com/systemjs/systemjs) module loader and its corresponding package manager [jspm](http://jspm.io/). SystemJS supports many different module standards (ES6, AMD, CommonJS) and jspm enables us to easily get a hold of modules and their dependencies (Just like NPM). jspm also automatically wires up modules in the SystemJS loader so we don't have to. We will install SystemJS (And later Aurelia) with jspm. First lets install jspm:

```bash
# Install jspm globally
npm install jspm -g

# Lock down the local version
npm install jspm --save

# At the root of your web app.
jspm init
```

`jspm init` will prompt you for a few pieces of information. You can probably accept the defaults, see [here](https://github.com/jspm/jspm-cli/wiki/Getting-Started#2-create-a-project) for more info on them.

```bash
Would you like jspm to prefix the jspm package.json properties under jspm? [yes]:
Enter server baseURL (public folder path) [./]:
Enter jspm packages folder [./jspm_packages]:
Enter config file path [./config.js]:
Configuration file config.js doesn't exist, create it? [yes]:
Enter client baseURL (public folder URL) [/]:
Which ES6 transpiler would you like to use, Traceur or Babel? [babel]:
ok   Verified package.json at package.json
     Verified config file at config.js
     Looking up loader files...
       es6-module-loader.js
       es6-module-loader.js.map
       es6-module-loader.src.js
       system.js
       system.src.js
       system.js.map
     
     Using loader versions:
       es6-module-loader@0.16.6
       systemjs@0.16.11
     Looking up npm:babel-core
     Looking up npm:babel-runtime
     Looking up npm:core-js
     Updating registry cache...
ok   Installed babel as npm:babel-core@^5.1.13 (5.2.17)
ok   Installed babel-runtime as npm:babel-runtime@^5.1.13 (5.2.17)
     Looking up github:jspm/nodelibs-process
ok   Installed github:jspm/nodelibs-process@^0.1.0 (0.1.1)
     Looking up npm:process
ok   Installed npm:process@^0.10.0 (0.10.1)
ok   Installed core-js as npm:core-js@^0.9.4 (0.9.7)
ok   Loader files downloaded successfully
```

This command does a few things. First it adds a section to your `package.json` for configuration and dependencies:

```js
{
  "name": "SetecAstronomy",
  "version": "0.0.0",
  ...
  "jspm": {
    "directories": {
      "baseURL": "src/Website"
    },
    "devDependencies": {
      "babel": "npm:babel-core@^5.1.13",
      "babel-runtime": "npm:babel-runtime@^5.1.13",
      "core-js": "npm:core-js@^0.9.4"
    }
  }
}
```

Next it creates a `config.js` where SystemJS modules are wired up:

```js
System.config({
  "baseURL": "/",
  "transpiler": "babel",
  "babelOptions": {
    "optional": [
      "runtime"
    ]
  },
  "paths": {
    "*": "*.js",
    "github:*": "jspm_packages/github/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});

System.config({
  "map": {
    "babel": "npm:babel-core@5.5.4",
    "babel-runtime": "npm:babel-runtime@5.5.4",
    "core-js": "npm:core-js@0.9.14",
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "npm:babel-runtime@5.5.4": {
      "process": "github:jspm/nodelibs-process@0.1.1"
    },
    "npm:core-js@0.9.14": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    }
  }
});
```

When you install packages, jspm automatically wires up all modules and their dependencies here so you don't have to do it manually. You can see above that the [core-js](https://github.com/zloirock/core-js) ES* pollyfill is automatically loaded, so we are ES6 ready. All dependencies are stored in the `jspm_packages` folder (Analogous to `node_modules`).

Once we have jspm installed we can then wire up SystemJS and its configuration in our main page:

```html
<script src="jspm_packages/system.js"></script>
<script src="config.js"></script>
```

### Setting up Aurelia

This is pretty simple:

```bash
jspm install aurelia-bootstrapper aurelia-http-client
```

The bootstrapper is a top level module that fires up Aurelia. The [http client](http://aurelia.io/docs.html#http-client) is a an optional module that provides http functionality (Although you can omit this and choose your own adventure).

In our main page we'll flag the `body` tag as the base element of the app with the `aurelia-app` attribute. Then we make the call to fire up Aurelia by importing the bootstrapper module:

```html
<html>
  ...
  <body aurelia-app>
    ...
    <script src="jspm_packages/system.js"></script>
    <script src="config.js"></script>
    <script>
      System.import('aurelia-bootstrapper');
    </script>
  </body>
</html>
```

Next we need to setup the view and view-model pair. These are conventionally tied together by their name, a la `name.html` & `name.js`. Conventionally the default pair is called `app`, so `app.html` and `app.js`. This can be overridden by setting the `aurelia-app` attribute in the main page to your a name:

```html
<html>
  ...
  <body aurelia-app="my-custom-name">
    ...
  </body>
</html>
```

By default these are loaded from the root. If they are located in a sub folder you will need to adjust the SystemJS path accordingly in the `config.js`. In the example below, our files are located in the `app` folder.

```js
System.config({
  ...
  "paths": {
    "*": "app/*.js", // <-- Default path here
    "github:*": "jspm_packages/github/*.js",
    "npm:*": "jspm_packages/npm/*.js"
  }
});
...
```

Next we'll create a simple ES6 view model called `app.es6`:

```js
export default class App {
    constructor() {
        this.message = 'Oh hai';
    }

    exclaim() {
        this.message += '!';
    }
}
```

Then a simple view called `app.html`:

```html
<template>
    <p>${message}</p>
    <button click.delegate="exclaim()">Exclaim!</button>
</template>
```

And of course a test. We've already stubbed out the test above so we can modify it to test our new view model:

```js
import { expect } from 'chai';
import App from '../app'
 
describe('App', () => {
    it('should exclaim!', () => {
        let app = new App();
        app.exclaim();
        app.exclaim();
        expect(app.message).to.equal('Oh hai!!');
    });
});
```

The test fixture references the app view model (Assuming it's one level up). Because we specified that the view model was the default export we can use the simpler import syntax in the test. 

### Bundling

As it stands, loading a bunch of little files can be a significant performance hit. [This will change with HTTP/2](http://en.wikipedia.org/wiki/HTTP/2#Differences_from_HTTP_1.1) but in the meantime we need to bundle these files. 




