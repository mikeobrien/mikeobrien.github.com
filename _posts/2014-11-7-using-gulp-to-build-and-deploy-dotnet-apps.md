---
published: false
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

At the root of your project will be a [`package.json`](https://npmjs.org/doc/json.html) that specifies your [NPM](https://npmjs.org/) dependencies. Also a [`gulpfile.js`](https://github.com/gulpjs/gulp/#sample-gulpfilejs) which is your build script.

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
- Install `gulp` *locally* (No `-g`) and save the dependency to your `package.json` (`--save`): `npm install gulp --save`
- Run `gulp` to make sure all is working, should display something along these lines:

```bash
[14:48:30] Using gulpfile /.../gulpfile.js
[14:48:30] Starting 'default'...
[14:48:30] Finished 'default' after 32 μs
```

### Assembly Info ###

First thing you will want to do is set the version number in the project assembly info files (And any other info you'd like). I personally let TeamCity manage the version and then grab it from an environment variable, but you can do whatever works best for you. To do this we'll use the [gulp-dotnet-assembly-info](https://github.com/mikeobrien/gulp-dotnet-assembly-info) gulp plugin (`npm install gulp-dotnet-assembly-info --save`).

```js
var gulp = require('gulp'),
    assemblyInfo = require('gulp-dotnet-assembly-info');

gulp.task('ci', ['assemblyInfo']);

gulp.task('assemblyInfo', function() {
    return gulp.src('**/AssemblyInfo.cs')
        .pipe(assemblyInfo({
            version: process.env.BUILD_NUMBER,
            fileVersion: process.env.BUILD_NUMBER,
            company: 'Planet Express',
            copyright: function(value) { 
                return value.replace('{year}', new Date().getFullYear()); 
            },
            ...
        }))
        .pipe(gulp.dest('.'));
});
```

So we pipe in all `AssemblyInfo.cs` files, modify them and then save them back out. You can specify a value or a function that returns the value. See [here](https://github.com/mikeobrien/gulp-dotnet-assembly-info) for more info.

### Building ###

Now for building. To do that we will use the [gulp-msbuild](https://github.com/hoffi/gulp-msbuild) plugin (`npm install gulp-msbuild --save`). Configure it as follows:

```js
var gulp = require('gulp'),
    ...
    assemblyInfo = require('gulp-msbuild');

gulp.task('build', ['assemblyInfo'], function() {
    return gulp.src('**/*.sln')
        .pipe(msbuild({
            targets: ['Clean', 'Build'],
            stdout: true
        });
});
```

The task supports more options than shown here, see [here](https://github.com/hoffi/gulp-msbuild) for more info.

On a side note, you may run into the following when building web applications on your build server:

```
The imported project "C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\
v11.0\WebApplications\Microsoft.WebApplication.targets" was not found.
```

A solution can be found [here](http://stackoverflow.com/a/19351747/126068).

### Running Tests ###

Next you will want to run your tests. If you are using NUnit, you're in luck as there is a Grunt task for that. We will use the [grunt-nunit-runner](https://github.com/mikeobrien/grunt-nunit-runner) task (`npm install grunt-nunit-runner --save`). In your `gruntfile.js`, load the task and configure it as follows:

```js
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-dotnet-assembly-info');
    grunt.loadNpmTasks('grunt-msbuild');
    grunt.loadNpmTasks('grunt-nunit-runner');
    ...
    grunt.registerTask('ci', ['assemblyinfo', 'msbuild', 'nunit']);

    grunt.initConfig({
        ...
        nunit: {
            options: {
                files: ['src/MyApp.sln'],
                teamcity: true
            }
        }
    });
}
```

The `teamcity` option integrates the test results with TeamCity. The task supports many more options than shown here, see [here](https://github.com/mikeobrien/grunt-nunit-runner) for more info.

### Deploying ###

There are a couple of ways to deploy files. Out of the box, gulp's innate ability to work with files will get you a long way:

```js
gulp.task('deploy', ['nunit'], function() {
    gulp.src(‘./src/MyApp.Web/**/*.{config,html,htm,js,dll,pdb,png,jpg,jpeg,gif,css}’)
        .pipe(gulp.dest(‘D:/Websites/www.myapp.com/wwwroot’));
});
```

If for some reason you need more advanced file copy capabilities you can use [Robocopy](http://technet.microsoft.com/en-us/library/cc733145.aspx) (n&eacute;e xcopy). We can use the [robocopy](https://github.com/mikeobrien/node-robocopy) node module to run it (`npm install robocopy --save`).

```js
var gulp = require('gulp'),
    ...
    robocopy = require('robocopy');

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

You'll notice that we're passing the task callback into the robocopy task. This will tell gulp when the copy is complete as it will run asynchronously.

The Robocopy options above are pretty self explanatory. The `mirror` option allows you to synchronize your destination with your source folder, removing any deleted files. The `retry` options allow you to retry the copy after so many seconds if it failed. Both these options in particular have been useful when deploying websites. The task fully supports all the robocopy options, see [here](https://github.com/mikeobrien/node-robocopy) for more info.

### Nuget ###

If you are publishing a library instead of deploying an app there is a package for that too. We can use the [grunt-nuget](https://github.com/spatools/grunt-nuget) task by [@somaticIT](https://twitter.com/somaticIT) (`npm install grunt-nuget --save`). In your `gruntfile.js`, load the task and configure it as follows:

```js
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

The `grunt-nuget` package ships with nuget so there is no need to install it on your build server. As demonstrated above you can dynamically set the version number and pass in your nuget API key. One thing to note is that even though you are passing in the version, the version element must exist in the nuspec file and have a value, otherwise `nuget pack` will fail. The options you specify are passed directly to nuget so all [nuget CLI parameters](http://docs.nuget.org/docs/reference/command-line-reference#wiki-Pack_Command) are supported.

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
