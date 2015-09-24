---
layout: post
title: Setting Up A TypeScript Aurelia App And Tests From Scratch
tags: [Aurelia,TypeScript]
---

The [getting started guide on the Aurelia site](http://aurelia.io/get-started.html) is a nice way to get up and running quickly. This post will dig a little deeper and set up a TypeScript Aurelia app, with tests, from scratch. The following post assumes that you are using [gulp](http://gulpjs.com/) and familiar with [TypeScript](http://www.typescriptlang.org/). If not, start [here](https://travismaynard.com/writing/getting-started-with-gulp) and [here](https://channel9.msdn.com/Events/Build/2015/3-644).

Before you continue, you may want to enable TypeScript support in your editor. A list of editors and plugins can be found [here](https://en.wikipedia.org/wiki/TypeScript#IDE_and_editor_support).

NOTE: [ES6 and ES7 are now officially called ES 2015 and ES 2016 respectively](https://esdiscuss.org/topic/javascript-2015) but I just refer to them as the former here.

### Setting up Compilation

First we need to set up the TypeScript compiler.

Install the following node modules:

```bash
npm install gulp-typescript --save
npm install gulp-sourcemaps --save
```

Then add the following task to your `gulpfile.js`:

```js
var tsc = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");

gulp.task('tsc', function () {
    return gulp.src('**/*.ts', { base: '.' })
        .pipe(sourcemaps.init())
        .pipe(tsc({
            target: 'ES5',
            module: 'commonjs',
            noEmitOnError: true,
            noImplicitAny: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('.'));
});
```

Here we are compiling TypeScript files (with a `.ts` extension) to ES5. We are compiling to [CommonJS](http://www.commonjs.org/) modules as they can be understood on the browser by [SystemJS](https://github.com/systemjs/systemjs) (Which we'll cover in a bit) and natively by Node.js for our tests. Next we are saying that we don't want to generate and files when there are errors and we [don't want to allow implicit use of `any`](http://blogs.msdn.com/b/typescript/archive/2013/08/06/announcing-0-9-1.aspx). For a full list of options see [here](https://github.com/ivogabe/gulp-typescript#options). We are also generating [source map](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) files so that compiled code can be mapped to the original TypeScript code when debugging. Since we don't want to commit generated `.js` files to our repository we can selectively exclude with a `.gitignore`:


```
*.js
# Any exclusions
!gulpfile.js
```

We'll set up the watcher below when we setup the tests.

### Setting up Type Definitions

In order for the TypeScript compiler to understand vanilla JavaScript libraries it needs some sort of meta data that describes them. This meta data is the TypeScript definition file, with an extension of `.d.ts`, as described [here](http://www.typescriptlang.org/Handbook#writing-dts-files). Fortunately a growing number of definition files for popular libraries have been contributed to the [definitelytyped.org](http://definitelytyped.org/) repository (~1,200 as of 9/2015). These definitions can easily be downloaded with the [TypeScript Definition Manager](http://definitelytyped.org/tsd/).

So first, lets setup the TypeScript Definition Manager:

```js
npm install tsd -g
```

The syntax for `tsd` is similar to `npm` (see [here](https://github.com/DefinitelyTyped/tsd#install-to-project) for all the options):

```js
tsd install [name] --save
```

This command will download the type definitions to a folder called `typings` that contains all your type definitions. It also creates a file called `tds.json` (If it doesn't already exist) that contains reference to all the saved definitions (Analogous to `package.json`). We'll install the type definitions as we go.

### Setting up the Test Runner

We will use the [Mocha](http://mochajs.org/) test framework and [Chai](http://chaijs.com/) assertion library. We make our `test` task depend on the `tsc` task to compile *before* running the tests. And since [Node.js doesn't natively support source maps](https://github.com/joyent/node/issues/3712), we'll need to use the `source-map-support` module. We also need to reference the [core-js](https://github.com/zloirock/core-js) ES* pollyfill to get ES6 API support in Node.

Install the following node modules:

```bash
npm install gulp-mocha --save
tsd install mocha --save
npm install chai --save
tsd install chai --save
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
    gulp.watch('**/*.ts', spawnTests);
});

gulp.task('test', ['tsc'], function () {
    return gulp.src(['tests/**/*.js'])
        .pipe(mocha({ reporter: 'spec', ui: 'bdd' }));
});
```

Here we add the watcher that compiles our TypeScript code, then fires off the test runner. Spawning the test runner prevents certain failures from stopping the watch loop. Also, since the watch is fired only on changes, we run it right off the bat so we don't have to wait for changes to see results.

Now we'll create a fixture called `app.ts` with a dummy test to make sure everything is working:

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

Next we'll install the [core-js](https://github.com/zloirock/core-js) ES* pollyfill so we are ES6 ready:

```bash
jspm install core-js
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

Once we have jspm installed we can then wire up SystemJS and its configuration in our main page:

```html
<script src="jspm_packages/system.js"></script>
<script src="config.js"></script>
```

### Setting up Aurelia

This is pretty simple:

```bash
jspm install aurelia-bootstrapper aurelia-http-client
tsd install core-js --save
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

Next we'll create a simple view model called `app.ts`:

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

<div class="alert alert-danger" style="padding-top: 0;">
<p>NOTE: As of September 8th 2015 there are a couple <a href="https://github.com/aurelia/loader-default/issues/23">typos</a> and a <a href="https://github.com/aurelia/loader-default/issues/15">missing reference</a> in the <code>aurelia-loader-default</code> type definition. These are fixed and will be in the next release so in the meantime you can just manually edit them (<code>jspm_packages/github/aurelia/loader-default@0.9.5/aurelia-loader-default.d.ts</code>):</p>
<div class="highlight"><pre><code class="language-js" data-lang="js"><span class="nx">declare</span> <span class="nx">module</span> <span class="s1">'aurelia-loader-default'</span> <span class="p">{</span>
  <span class="kr">import</span> <span class="p">{</span> <span class="nx">Origin</span> <span class="p">}</span>  <span class="nx">from</span> <span class="s1">'aurelia-metadata'</span><span class="p">;</span>
  <span class="kr">import</span> <span class="p">{</span> <span class="nx">Loader</span><span class="p">,</span> <span class="nx">TemplateRegistryEntry</span> <span class="p">}</span>  <span class="nx">from</span> <span class="s1">'aurelia-loader'</span><span class="p">;</span>
  <span class="kr">export</span> <span class="kr">class</span> <span class="nx">DefaultLoader</span> <span class="kr">extends</span> <span class="nx">Loader</span> <span class="p">{</span>
    <span class="nx">constructor</span><span class="p">();</span>
    <span class="nx">loadModule</span><span class="p">(</span><span class="nx">id</span><span class="o">:</span> <span class="nx">string</span><span class="p">)</span><span class="o">:</span> <span class="nx">Promise</span><span class="o">&lt;</span><span class="nx">any</span><span class="o">&gt;</span><span class="p">;</span>
    <span class="nx">loadAllModules</span><span class="p">(</span><span class="nx">ids</span><span class="o">:</span> <span class="nx">string</span><span class="p">[])</span><span class="o">:</span> <span class="nx">Promise</span><span class="o">&lt;</span><span class="nx">any</span><span class="p">[]</span><span class="o">&gt;</span><span class="p">;</span>
    <span class="nx">loadTemplate</span><span class="p">(</span><span class="nx">url</span><span class="o">:</span> <span class="nx">string</span><span class="p">)</span><span class="o">:</span> <span class="nx">Promise</span><span class="o">&lt;</span><span class="nx">TemplateRegistryEntry</span><span class="o">&gt;</span><span class="p">;</span>
    <span class="nx">loadText</span><span class="p">(</span><span class="nx">url</span><span class="o">:</span> <span class="nx">string</span><span class="p">)</span><span class="o">:</span> <span class="nx">Promise</span><span class="o">&lt;</span><span class="nx">string</span><span class="o">&gt;</span><span class="p">;</span>
  <span class="p">}</span>
<span class="p">}</span>
</code></pre></div>
</div>

### Bundling

As it stands, loading a bunch of little files can be a significant performance hit. [This will change with HTTP/2](http://en.wikipedia.org/wiki/HTTP/2#Differences_from_HTTP_1.1) but in the meantime we need to bundle these files. Aurelia apps can be bundled with the [Aurelia Bundler](https://github.com/aurelia/bundler) as described [here](http://blog.durandal.io/2015/09/11/bundling-aurelia-apps/).