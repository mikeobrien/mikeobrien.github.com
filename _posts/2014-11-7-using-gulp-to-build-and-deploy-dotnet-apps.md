---
draft: true
layout: post
title: Using Gulp to Build and Deploy .NET Apps
tags: [Gulp,.NET,Build/Deploy]
---

I've been using [Grunt](http://gruntjs.com/) to build and deploy .NET apps for about a year now. Its a huge improvement over Rake and the crusty XML build tools but I've been hearing a lot of good things about [gulp](http://gulpjs.com/) so I thought it was time to check it out.

### Project Layout ###

The project layout will be along the lines of this:

```
/MyApp
    /src
        MyApp.sln
        ...
    /...
    gulpfile.js
    package.json
    ...
```

At the root of your project will be a [`package.json`](https://npmjs.org/doc/json.html) that specifies your [dependencies](https://www.npmjs.org/doc/files/package.json.html#dependencies). Also a [`gulpfile.js`](https://github.com/gulpjs/gulp/#sample-gulpfilejs) which is your build script.

### Initial Setup ###

- [Download](http://nodejs.org/download/) and install Node.js.
- Create a minimal `package.json` at the project root or use [`npm init`](https://npmjs.org/doc/init.html) to generate it for you:

```json
{
    "name": "MyApp",
    "version": "0.0.0"
}
```

- Create a bare bones `gulpfile.js` at the project root:

```js
var gulp = require('gulp');

gulp.task('default', []);

gulp.task('ci', []);
```

Above we have a special `default` task alias that gets run when you type `gulp` with no arguments. You can decide what you want that to do; I have it setup to run [Karma](http://karma-runner.github.io/0.10/index.html) in watch mode. The second task alias, `ci`, will be what is run by the build server (And you can call this whatever you want so long as the build server knows about it, as we'll see later).

- Install `gulp` *globally* (`-g`): `npm install gulp -g`
- Install `gulp` *locally* (No `-g`) and save the dependency to your `package.json`: `npm install gulp --save`
- Run `gulp` to make sure all is working, should display something along these lines:

```bash
[14:48:30] Using gulpfile /.../gulpfile.js
[14:48:30] Starting 'default'...
[14:48:30] Finished 'default' after 32 μs
```
### Task Sequence ###

Gulp will try to run every task in parallel. Obviously you will need to run certain tasks in a particular order in your build. The current version of gulp allows you to do this a few ways. First you will need to specify a dependency and then some way to indicate the dependency has completed. [According to the gulp docs](https://github.com/gulpjs/gulp/blob/master/docs/API.md#async-task-support), gulp can only know when a dependency has completed by either returning a stream, returning a promise or taking in a callback and calling it when done. The following demonstrates the stream and callback approaches:

```js
// Return a stream so gulp can determine completion
gulp.task('clean', function() {
    return gulp
        .src('app/tmp/*.js', { read: false })
        .pipe(clean());
});

// OR

// Take in the gulp callback and call it when done
gulp.task('clean', function(callback) {
    gulp.src('app/tmp/*.js', { read: false })
        .pipe(clean());
    callback();
});

// Specify the dependencies in the second parameter
gulp.task('build', ['clean'], function() {
    // Build...
});
```

So if you run the build task in this example, the clean task will run and complete first, then the build task will run. I will favor returning the stream throughout this post unless the callback approach is needed as is the case in async tasks.

Seem awkward and/or confusing? [You're not alone](https://github.com/orchestrator/orchestrator/issues/26). The upcoming gulp 4 release will [revamp how this is handled](https://github.com/gulpjs/gulp/issues/355). When that is released I will update this post to reflect those changes.

### Assembly Info ###

First thing you will want to do is set the version number in the project assembly info files (And any other info you'd like). I personally let TeamCity manage the version and then grab it from an environment variable, but you can do whatever works best for you. To do this we'll use the [gulp-dotnet-assembly-info](https://github.com/mikeobrien/gulp-dotnet-assembly-info) gulp plugin (`npm install gulp-dotnet-assembly-info --save`). Configure the plugin as follows:

```js
var assemblyInfo = require('gulp-dotnet-assembly-info');

gulp.task('assemblyInfo', function() {
    return gulp
        .src('**/AssemblyInfo.cs')
        .pipe(assemblyInfo({
            version: process.env.BUILD_NUMBER,
            fileVersion: process.env.BUILD_NUMBER,
            company: 'Planet Express',
            copyright: function(value) { 
                return value + '-' + new Date().getFullYear(); 
            },
            ...
        }))
        .pipe(gulp.dest('.'));
});
```

So we pipe in all `AssemblyInfo.cs` files, modify them and then save them back out. You can specify a value or a function that returns the value. See [here](https://github.com/mikeobrien/gulp-dotnet-assembly-info) for more info.

### Building ###

Now for building. To do that we will use the [gulp-msbuild](https://github.com/hoffi/gulp-msbuild) plugin (`npm install gulp-msbuild --save`). Configure the plugin as follows:

```js
var msbuild = require('gulp-msbuild');

gulp.task('build', ['assemblyInfo'], function() {
    return gulp
        .src('**/*.sln')
        .pipe(msbuild({
            toolsVersion: 12.0,
            targets: ['Clean', 'Build'],
            errorOnFail: true,
            stdout: true
        }));
});
```

The plugin looks for msbuild in the `PATH`. You can also specify the version you want to target with the `toolsVersion` option. This plugin supports more options than shown here, see [here](https://github.com/hoffi/gulp-msbuild) for more info.

On a side note, you may run into the following when building web applications on your build server:

```
The imported project "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\
v11.0\WebApplications\Microsoft.WebApplication.targets" was not found.
```

A solution can be found [here](http://stackoverflow.com/a/19351747/126068).

### Running Tests ###

Next you will want to run your tests. If you are using NUnit, you're in luck as there is a gulp plugin for that. We will use the [gulp-nunit-runner](https://github.com/keithmorris/gulp-nunit-runner) plugin (`npm install gulp-nunit-runner --save`). Configure the plugin as follows:

```js
var nunit = require('gulp-nunit-runner');

gulp.task('test', ['build'], function () {
    return gulp
        .src(['**/bin/**/*Tests.dll'], { read: false })
        .pipe(nunit({
            teamcity: true
        }));
});
```

The plugin looks for NUnit in the `PATH` and by default runs the `anycpu` version of NUnit (The x32 version can be specified with the `platform` option). You can also explicitly pass the nunit runner path if you like. You'll notice we're passing `read: false` into the source; this indicates that only filenames, and not content, are to be included in the stream. Also, the `teamcity` option integrates the test results with TeamCity. The plugin supports many more options than shown here, see [here](https://github.com/keithmorris/gulp-nunit-runner) for more info.

### Deploying ###

There are a couple of ways to deploy files. Out of the box, gulp's innate ability to work with files will get you a long way:

```js
gulp.task('deploy', ['nunit'], function() {
    return gulp
        .src('./src/MyApp.Web/**/*.{config,html,htm,js,dll,pdb,png,jpg,jpeg,gif,css}')
        .pipe(gulp.dest('D:/Websites/www.myapp.com/wwwroot'));
});
```

If for some reason you need more advanced file copy capabilities you can use [Robocopy](http://technet.microsoft.com/en-us/library/cc733145.aspx) (n&eacute;e xcopy). We can use the [robocopy](https://github.com/mikeobrien/node-robocopy) node module to run it (`npm install robocopy --save`). Configure the plugin as follows:

```js
var robocopy = require('robocopy');

gulp.task('deploy', ['nunit'], function(callback) {
    robocopy({
        source: 'src/MyApp.Web',
        destination: 'D:/Websites/www.myapp.com/wwwroot',
        files: ['*.config', '*.html', '*.htm', '*.js', '*.dll', '*.pdb',
                '*.png', '*.jpg', '*.jpeg', '*.gif', '*.css'],
        copy: {
            mirror: true
        },
        file: {
            excludeFiles: ['packages.config'],
            excludeDirs: ['obj', 'fubu-content', 'Properties'],
        },
        retry: {
            count: 2,
            wait: 3
        }
    }, callback);
});
```

You'll notice that we're passing the task callback into the robocopy task. This will tell gulp when the copy is complete as it runs asynchronously. You'll also notice that robocopy is not a gulp plugin and this is ok. Unlike Grunt where everything is a plugin, gulp plugins are really only useful if they operate on a stream of files. So many times you will just invoke a module in a gulp task like we do above, no plugin involved at all. [@ozcinc](https://twitter.com/ozcinc) has a nice writeup on this [here](http://blog.overzealous.com/post/74121048393/why-you-shouldnt-create-a-gulp-plugin-or-how-to-stop).

The Robocopy options above are pretty self explanatory. The `mirror` option allows you to synchronize your destination with your source folder, removing any deleted files. The `retry` options allow you to retry the copy after so many seconds if it failed. Both these options in particular have been useful when deploying websites. The task fully supports all the robocopy options, see [here](https://github.com/mikeobrien/node-robocopy) for more info.

### Nuget ###

If you are publishing a library instead of deploying an app there is a plugin for that too. We can use the [gulp-nuget](https://github.com/spatools/grunt-nuget) plugin (`npm install grunt-nuget --save`). You will need to create a [nuspec file](http://docs.nuget.org/docs/reference/nuspec-reference) as described [here](http://docs.nuget.org/docs/creating-packages/creating-and-publishing-a-package#Creating_a_Package). Configure the plugin as follows:

```js
var nuget = require('gulp-nuget');

gulp.task('publish', ['nunit'], function() {
    gulp.src(['src/MyLibrary/bin/Release/MyLibrary.*'])
        .pipe(nuget.pack({ 
            nuspec: 'MyLibrary.nuspec', 
            nuget: 'nuget.exe', 
            version: process.env.BUILD_NUMBER }))
        .pipe(gulp.dest('MyLibrary.nupkg'));
});

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-dotnet-assembly-info');
    grunt.loadNpmTasks('grunt-msbuild');
    grunt.loadNpmTasks('grunt-nunit-runner');
    grunt.loadNpmTasks('grunt-nuget');
    ...
    grunt.registerTask('deploy', ['assemblyinfo', 'msbuild', 'nunit', 'nugetpack', 'nugetpush']);

    grunt.initConfig({
        ...,
        nugetpack: {
            myApp: {
                src: 'MyLib.nuspec',
                dest: './'
            },
            options: {
                version: process.env.BUILD_NUMBER
            }
        },
        nugetpush: {
            myApp: {
                src: '*.nupkg'
            },
            options: {
                apiKey: process.env.NUGET_API_KEY
            }
        }
    });
}
```

As demonstrated above you can dynamically set the version number and pass in your nuget API key. One thing to note is that even though you are passing in the version, the version element must exist in the nuspec file and have a value, otherwise `nuget pack` will fail. The options you specify are passed directly to nuget so all [nuget CLI parameters](http://docs.nuget.org/docs/reference/command-line-reference#wiki-Pack_Command) are supported.

### Build Server ###

The last step is to setup your build server to run gulp. I'm going to assume you're using [TeamCity](http://www.jetbrains.com/teamcity/) for your builds. Follow the steps below on your build server:

- [Download](http://nodejs.org/download/) and install Node.js.
- Install `gulp`: `npm install gulp -g -prefix="C:\Program Files\nodejs"`. You will need to set the prefix to be a path TeamCity can access. I simply put it in the node install directory along side NPM. By default this folder is added to the PATH by the Node.js installer. Note that depending on your UAC settings you may need to run that command in an elevated command prompt as `Program Files` can be locked down. Also the 32 bit version will be installed to `Program Files (x86)` by default.
- Restart the TeamCity build agent so it picks up the Node.js path.
- Create a `Command Line` build step in TeamCity, set `Run` to `Custom script` and enter the following as the `Custom script`:

```bash
call npm install
call gulp ci
```

![TeamCity gulp task](/blog/images/TeamCityGulp.png)

### Conclusion ###

Hopefully this demonstrates how easy it is to setup a .NET build/deploy with gulp. If you are doing client side development, this will be even more of a win as your tools (Like Karma, JSHint, etc) will be run by the same build tool.
