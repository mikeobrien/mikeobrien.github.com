---
layout: post
title: Developing and Testing ES6 on ES5
tags: [ES6,JavaScript]
---

[ES6 is right around the corner](http://www.2ality.com/2014/06/es6-schedule.html). But thanks to a few of libraries and tools, developing and testing ES6 apps *today* on ES5 is trivial. Lets see how we can do it.

The code for this post can be found [here](https://github.com/mikeobrien/ES6MochaBoilerplate).

### Overview

Developing ES6 apps on ES5 requires three things:

1. **Polyfill** ES6 polyfills add new functionality to ES5 browsers and Node.js.
2. **Module Loader** Module loaders do just what their name implies, load modules. 
3. **Transpiler** Converts ES6 code to ES5 code so it can be run by ES5 browsers and Node.js.

### Layout

In this post we'll be working with the following layout:

```bash
index.html
app.es6
module.es6
gulpfile.js
tests
    module-tests.es6
```

I've gone the route of naming ES6 files with the `.es6` extension (which will be transpiled to `.js` ES5 files). Linguist, the library GitHub uses for syntax highlighting, [recognizes the `.es6` extension](https://github.com/github/linguist/blob/6bd86ad46bde906ec0c65b4f5c0bd24bd185349c/lib/linguist/languages.yml#L1542), so they will be properly highlighted in GitHub.

### Polyfill

Polyfills add new ES6 functionality to ES5 browsers and Node.js. Polyfills can only do so much though, for example they cannot add support for new language constructs (But we can work around this with transpilation). There are [a number of polyfill libraries out there](https://github.com/addyosmani/es6-tools#polyfills) but we'll use [core-js](https://github.com/zloirock/core-js) in this example. 

You will need to add core-js to your html file. It's available through [Bower](http://bower.io/) (`bower install core.js`) or directly [here](https://github.com/zloirock/core-js/tree/master/client).

```html
<script src="core.min.js"></script>
```

Next install the core-js package (`npm install core-js --save`) and require it in your `gulpfile.js`. 

```js
require('core-js');
```

### Module Loader

Since ES5 browsers do not have the ability load modules we will need to use a module loader. There are [many module loaders out there](https://github.com/addyosmani/es6-tools#module-loaders) but we will be using [SystemJS](https://github.com/systemjs/systemjs) in this example. SystemJS has the ability to load a number of different module formats. In this example we will be transpiling to [CommonJS](http://www.commonjs.org/) modules as these can be handled by SystemJS in the browser and natively by Node.js.

You will need to add SystemJS and the [ES6 module loader polyfill](https://github.com/ModuleLoader/es6-module-loader) (Which SystemJS depends on)  to your html file. It's available through Bower (`bower install system.js`) or directly [here](https://github.com/systemjs/systemjs/tree/master/dist) and [here](https://github.com/ModuleLoader/es6-module-loader/tree/master/dist) respectively.

```html
<script src="es6-module-loader.js"></script>
<script src="system.js"></script>
```

NOTE: you do not need to include a transpiler as noted [here](https://github.com/ModuleLoader/es6-module-loader#getting-started) as we will *not* be transpiling on the fly in the browser.

### Transpiliation

As mentioned earlier, ES6 support cannot be achieved with polyfills alone as there are new language constructs. The way we deal this is through [transpilation](http://en.wikipedia.org/wiki/Source-to-source_compiler), where ES6 is converted to ES5. There are [many transpilers out there](https://github.com/addyosmani/es6-tools#transpilers) but we will be using [Babel](https://github.com/babel/babel) (Formerly 6to5) in this example. Transpilation can be done on the fly or as part of a build. The former is not appropriate for production so we will do the latter. 

Install the following node modules:

```bash
 npm install gulp-babel --save
 npm install gulp-sourcemaps --save
 npm install gulp-rename --save
```
... and add the following task to your `gulpfile.js`:

```js
gulp.task('babel', function () {
    return gulp.src(['**/*.es6'])
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(rename({ extname: '.js' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('.'));
});
```

Here we are transpiling ES6 to ES5. The default module format is [CommonJS](http://www.commonjs.org/). We are transpiling to this module format as it can be understood on the browser by SystemJS and natively by Node.js for our tests. We are also generating [source map](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) files so that transpiled code can be mapped to the original ES6 code when debugging. Finally the output is renamed to `*.js`. Since we don't want to commit generated files to our repository we can selectively exclude them in our `.gitignore`:

```
*.js
!gulpfile.js
```

### Bootstrapping

Bootstrapping our app in the browser is done via the module loader:

```html
<script>
    System.import('app').then(function(app) { app.run(); });
</script>
```

### Testing

In this example we are using the [Mocha](http://mochajs.org/) test framework and [Chai](http://chaijs.com/) assertion library. There is not really anything special we have to do on the Node side except make our `test` task depend on the `babel` task to transpile *before* running the tests:

```js
gulp.task('test', ['babel'], function () {
    return gulp.src(['tests/**/*.js'])
        .pipe(mocha({ reporter: 'spec', ui: 'bdd' }));
});
```

We can then write our tests in ES6 referencing our app modules:

```js
import { expect } from 'chai';
import * as module from '../module';
 
describe('Module', () =>
    it('Should return content.', () => 
        expect(module.getContent())
            .to.equal('Oh hai' + '!'.repeat(10))
    )
);
```

### Conclusion

So writing ES6 apps today is a pretty easy task.  With the finalization of the spec so close it seems like a no-brainer at this point to do all new development on ES6. So long ES5, and thanks for all the fish!