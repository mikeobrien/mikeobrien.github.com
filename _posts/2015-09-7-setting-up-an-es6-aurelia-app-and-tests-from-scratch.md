---
layout: post
title: Setting Up An ES6 Aurelia App And Tests From Scratch
tags: [Aurelia,ES6]
---

The [getting started guide on the Aurelia site](http://aurelia.io/get-started.html) is a nice way to get up and running quickly. This post will dig a little deeper and set up an ES6 Aurelia app, with tests, from scratch. The following post assumes that you are using [gulp](http://gulpjs.com/). If not, start [here](https://travismaynard.com/writing/getting-started-with-gulp).

NOTE: [ES6 and ES7 are now officially called ES 2015 and ES 2016 respectively](https://esdiscuss.org/topic/javascript-2015).

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

Here we are transpiling ES6 files (with a `.es6` extension) to ES5. The default module format is [CommonJS](http://www.commonjs.org/). We are transpiling to this module format as it can be understood on the browser by [SystemJS](https://github.com/systemjs/systemjs) (Which we'll cover in a bit) and natively by Node.js for our tests. We are also generating [source map](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) files so that transpiled code can be mapped to the original ES6 code when debugging. Finally the output is renamed to `*.js`. Since we don't want to commit generated `.js` files to our repository we can selectively exclude with a `.gitignore`:

```
*.js
# Any exclusions
!gulpfile.js
```

We'll set up the watcher below when we setup the tests.

NOTE: As of September 2015 Babel does not enable [ES7 decorators](https://github.com/wycats/javascript-decorators) by default as they are considered experimental. Aurelia makes use of these so you'll either have to enable [experimental features](https://babeljs.io/docs/usage/experimental/) in Babel a la:

```js
    .pipe(babel({ stage: 1 }))

    // Or

    .pipe(babel({ optional: ["es7.decorators"] }))
```

Or you can create a static property called `decorators` on your class and set it's value using the `Decorators` DSL a la:

```js
import { HttpClient } from 'aurelia-http-client';
import { Decorators } from 'aurelia-framework';

export class SomeNiftyClass {...}

SomeNiftyClass.decorators = Decorators.transient().inject(HttpClient);
```
 
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
var childProcess = require('child_process');
require('source-map-support').install();
require('core-js');

gulp.task('watch', function () {
    var spawnTests = function() {
        childProcess.spawn('gulp', ['test'], { stdio: 'inherit' });
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

Aurelia fully embraces ES6 and is made up of many composable modules. This allows you to pick and choose what pieces you want to use. As such, [there isn't one single file you can reference](https://github.com/aurelia/framework/issues/40) like you would with jQuery or Angular 1.x. This presents a number of challenges. First, how do we easily get a hold of all the modules we want? And second, how do we wire up and load all these modules? Both of these problems are solved by the [SystemJS](https://github.com/systemjs/systemjs) module loader and its corresponding package manager [jspm](http://jspm.io/). SystemJS supports many different module standards (ES6, AMD, CommonJS) and jspm enables us to easily get a hold of modules and their dependencies (Just like NPM). jspm also automatically wires up modules in the SystemJS loader so we don't have to. We will install SystemJS (And later Aurelia) with jspm. First lets install jspm:

```bash
# Install jspm globally
npm install jspm -g

# Lock down the local version
npm install jspm --save

# At the root of your web app
jspm init
```

NOTE: If you have one project, one `package.json` and multiple web apps, you can run `jspm init .` in the root of each web app. This will initialize it separately for each app.

`jspm init` will prompt you for a few pieces of information. You can probably accept the defaults, see [here](https://github.com/jspm/jspm-cli/wiki/Getting-Started#2-create-a-project) for more info on them. You will want to respond `no` when prompted to use an ES6 transpiler (As we've already handled that).

```bash
Would you like jspm to prefix the jspm package.json properties under jspm? [yes]:
Enter server baseURL (public folder path) [./]:
Enter jspm packages folder [./jspm_packages]:
Enter config file path [./config.js]:
Configuration file config.js doesn't exist, create it? [yes]:
Enter client baseURL (public folder URL) [/]:
Do you wish to use an ES6 transpiler? [yes]:no
ok   Verified package.json at package.json
     Verified config file at config.js
     Looking up loader files...
       system.js
       system.js.map
       system-csp-production.js
       system-polyfills.js
       system.src.js
       system-csp-production.src.js
       system-polyfills.js.map
       system-polyfills.src.js
       system-csp-production.js.map
     
     Using loader versions:
       systemjs@0.18.17
ok   Loader files downloaded successfully
```

The `jspm init` command does a few things. First it adds a section to your `package.json` for configuration and dependencies:

```js
{
  "name": "SetecAstronomy",
  "version": "0.0.0",
  ...
  "jspm": {
    "directories": {},
    "dependencies": {
      "core-js": "npm:core-js@^1.1.3"
    }
  }
}
```

Next it creates a `config.js` where SystemJS modules are wired up:

```js
System.config({
  baseURL: "/",
  defaultJSExtensions: true,
  transpiler: "none",
  paths: {
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  },

  map: {
    "core-js": "npm:core-js@1.1.3",
    "github:jspm/nodelibs-process@0.1.1": {
      "process": "npm:process@0.10.1"
    },
    "npm:core-js@1.1.3": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    }
  }
});
```

When you install packages, jspm automatically wires up all modules and their dependencies here so you don't have to do it manually. All dependencies are stored in the `jspm_packages` folder (Analogous to `node_modules`).

One thing to note about installing jspm modules is that an alias mapping is created for modules you install directly but not for their dependencies. So for example if you install a module `some-module` with a dependency of `some-dependency` the `config.js` will look something along the lines of this:

```js
System.config({
  ...
  map: {
    "some-module": "github:some-repo/some-module@0.1.2",
    "github:some-repo/some-module@0.1.2": {
      "some-dependency": "github:some-repo/some-dependency@0.2.2"
    },
    "github:some-repo/some-dependency@0.2.2": {
      ...
    },
    ...
  }
});
```

The very first mapping maps an alias to the actual module, in this case on GitHub. Even though `some-dependency` has been downloaded and referenced, there is no alias mapping. So you can reference `some-module` in your code but not `some-dependency`. If you try to reference `some-dependency` you will get a file not found error. If you jspm install `some-dependency` it will create the alias mapping for you and you can then reference this in your modules:

```js
System.config({
  ...
  map: {
    "some-module": "github:some-repo/some-module@0.1.2",
    "some-dependency": "github:some-repo/some-module@0.2.2",
    "github:some-repo/some-module@0.1.2": {
      "some-dependency": "github:some-repo/some-dependency@0.2.2"
    },
    "github:some-repo/some-dependency@0.2.2": {
      ...
    },
    ...
  }
});
```

You can see there is now an alias mapping for `some-dependency`.

Once we have jspm installed we can then wire up SystemJS and its configuration in our main page:

```html
<script src="jspm_packages/system.js"></script>
<script src="config.js"></script>
```

### Setting up Aurelia

This is pretty simple:

```bash
jspm install aurelia-bootstrapper aurelia-router aurelia-http-client
```

The bootstrapper is a top level module that fires up Aurelia. The [router](https://github.com/aurelia/router) and [http client](http://aurelia.io/docs.html#http-client) are optional, so you can omit these and choose your own adventure if you want.

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

By default these are loaded from the root. If they are located in a sub folder you will need to adjust the default module path accordingly in the `config.js`. In the example below, our files are located in the `app` folder.

```js
System.config({
  ...
  "paths": {
    "*": "app/*", // <-- Default path here
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  }
});
...
```

Although it may look like it at first glance, the above paths are not globs but simple path mappings. The above configuration would map modules as follows:

| Module | Path |
| ------------- | ------------- |
| `somemodule` | `app/somemodule` |
| `github:somemodule` | `jspm_packages/github/somemodule` |
| `npm:somemodule` | `jspm_packages/npm/somemodule` |


NOTE: Previously the paths included the `.js` extension (a la `"app/*.js"`) but this has changed and adding the extension will now cause errors when bundling.

Next we'll create a simple view model called `app.es6`:

```js
export class App {
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
import { App } from '../app';
 
describe('App', () => {
    it('should exclaim!', () => {
        let app = new App();
        app.exclaim();
        app.exclaim();
        expect(app.message).to.equal('Oh hai!!');
    });
});
```

The test fixture references the app view model (Assuming it's one level up). 

### Bundling

As it stands, loading a bunch of little files can be a significant performance hit. [This will change with HTTP/2](http://en.wikipedia.org/wiki/HTTP/2#Differences_from_HTTP_1.1) but in the meantime we need to bundle these files. First install the Aurelia bundler and the text plugin (For bundling html and css files):

```bash
npm install aurelia-bundler --save
jspm install text
```

Next, setup the bundle configuration in your `gulpfile`. In the example below we are creating two bundles, one for the app and one for Aurelia:

```js
var bundler = require('aurelia-bundler');

...

gulp.task('bundle', function() {
    return bundler.bundle({
        force: true,
        packagePath: '.',
        bundles: {
            "app/app-bundle": {
                includes: [
                    '**/*',
                    '*.html!text'
                ],
                options: {
                    inject: true,
                    minify: true
                }
            },
            "app/aurelia-bundle": {
                includes: [
                    'aurelia-bootstrapper',
                    'aurelia-http-client',
                    'aurelia-router',
                    'github:aurelia/templating-binding',
                    'github:aurelia/templating-resources',
                    'github:aurelia/templating-router',
                    'github:aurelia/loader-default',
                    'github:aurelia/history-browser',
                    'github:aurelia/logging-console'
                ],
                options: {
                    inject: true,
                    minify: true
                }
            }
        }
    });
});
```

Few things to note:

- The `force` flag will overwrite existing bundles.
- The `packagePath` points to the folder that contains the `package.json` at the root of the app.
- The `bundles` object, as the name implies, contains configuration for all your bundles. The field names indicate the path of the resulting bundle file (sans the `.js` extension) and the value contains the bundle configuration. 
	- The `includes` array contains all the resources you want bundled.
		- App bundle:
			- The first include specifies the files we want to include. In this case we want to recursively include every file. The `.js` file extension can be omitted as this is assumed. This path is relative to the default path we setup in the `config.js`. So if we specified `"*": "app/*"` in the `config.js` and `**/*` for the bundle path, the bundle would include `app/**/*`. You can get pretty crazy with these paths using the SystemJS bundler "arithmetic expressions". These expressions support advanced filtering, see [here](https://github.com/systemjs/builder#bundle-arithmetic) for more info. 
			- The second include indicates that we want to include text files. The syntax is the glob followed by an `!` and the plugin name, in this case `text`. You can also include css files. 
		- Aurelia bundle:
			- The includes here point to the top level Aurelia modules you want to bundle. The ones listed above should be sufficient at first but as you make use of more Aurelia features you will need to include those modules in the bundle otherwise they will be loaded individually. You will want to include the following modules:
				- Modules that you install via jspm. In the config above these would be the first 3 `aurelia-*` modules.
				- Any dynamically loaded dependencies that cannot be determined by static analysis. These will show up in the network traffic on page load and look like `some-module@0.0.0.js`. Look at the response and you'll see the module name along the lines of `github:organization/repository`. In the config above these would be the last 6 `github:aurelia/*` modules.
	- The `inject` flags tells the bundler to update the `config.js` with the bundle information. Once this is set, the bundle will be downloaded instead of the individual modules.