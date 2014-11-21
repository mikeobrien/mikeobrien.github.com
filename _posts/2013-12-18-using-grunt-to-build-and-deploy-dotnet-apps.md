---
published: true
layout: post
title: Using Grunt to Build and Deploy .NET Apps
tags: [Grunt,.NET,Build/Deploy]
---

**UPDATE: I've since moved to gulp as my build tool of choice and highly recommend using that over Grunt. I've rewritten this post for gulp [here](http://www.mikeobrien.net/blog/using-gulp-to-build-and-deploy-dotnet-apps-on-windows/).**

I've been using [Rake](http://rake.rubyforge.org) and [Albacore](http://albacorebuild.net/) to build and deploy .NET apps for a while now. Its a huge improvement over the XML based build tools but the rise of Node.js got me interested in moving to [Grunt](http://gruntjs.com/). I was also shelling out to Grunt from Rake for all client side tasks (like testing, linting, ect) so it only made sense to consolidate these into the same build tool. Turns out its pretty easy to do.

If you're not familiar with NPM or Grunt take a look [here](http://nodejs.org/about/) and [here](http://gruntjs.com/getting-started) for an introduction.

### Project Layout ###

The project layout will be along the lines of this:

```
/
    /src
        MyApp.sln
        ...
    /...
    gruntfile.js
    package.json
    ...
```

At the root of your project will be a [`package.json`](https://npmjs.org/doc/json.html) that specifies your [NPM](https://npmjs.org/) dependencies. Also a [`gruntfile.js`](http://gruntjs.com/getting-started#the-gruntfile) which is your build script. 

### Initial Setup ###

- [Download](http://nodejs.org/download/) and install Node.js.
- Create a minimal `package.json` at the project root (You can also use [`npm init`](https://npmjs.org/doc/init.html)):

```json
{
    "name": "MyApp",
    "version": "0.0.0"
}
```

- Create a bare bones `gruntfile.js` at the project root:

```js
module.exports = function(grunt) {
    grunt.registerTask('default', []);
    grunt.registerTask('ci', []);

    grunt.initConfig({

    });
}
```

Above we have a special `default` task alias that gets run when you type `grunt` with no arguments. You can decide what you want that to do; I have it setup to run [Karma](http://karma-runner.github.io/0.10/index.html) in watch mode. The second task alias, `ci`, will be what is run by the build server (And you can call this whatever you want so long as the build server knows about it).

- Install `grunt-cli` *globally* (`-g`): `npm install grunt-cli -g`
- Install `grunt` *locally* (No `-g`) and save the dependency to your `package.json` (`--save`): `npm install grunt --save`
- Run `grunt` to make sure all is working, should display `Done, without errors.`

### Assembly Info ###

First thing you will want to do is set the version number in the project assembly info files (And any other info you'd like). I personally let TeamCity manage the version and then grab it from an environment variable, but you can do whatever works best for you. To do this we'll use the [grunt-dotnet-assembly-info](https://github.com/mikeobrien/grunt-dotnet-assembly-info) task (`npm install grunt-dotnet-assembly-info --save`). In your `gruntfile.js`, load the task and configure it as follows:

```js
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-dotnet-assembly-info');
    ...
    grunt.registerTask('ci', ['assemblyinfo']);

    grunt.initConfig({
        assemblyinfo: {
            options: {
                files: ['src/MyApp.sln'],
                info: {
                    version: process.env.BUILD_NUMBER, 
                    fileVersion: process.env.BUILD_NUMBER,
                    company: 'Planet Express',
                    copyright: 'Copyright 3002 (c) Planet Express',
                    ...
                }
            }
        }
    });
}
```

The task supports all the standard assembly attributes, see [here](https://github.com/mikeobrien/grunt-dotnet-assembly-info) for more info.

### Building ###

Now the most important step, building. To do that we will use the [grunt-msbuild](https://github.com/stevewillcock/grunt-msbuild) task by [@stevewillcock](https://twitter.com/stevewillcock) (`npm install grunt-msbuild --save`). In your `gruntfile.js`, load the task and configure it as follows:

```js
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-dotnet-assembly-info');
    grunt.loadNpmTasks('grunt-msbuild');
    ...
    grunt.registerTask('ci', ['assemblyinfo', 'msbuild']);

    grunt.initConfig({
        ...
        msbuild: {
            src: ['src/MyApp.sln'],
            options: {
                projectConfiguration: 'Release',
                targets: ['Clean', 'Rebuild'],
                stdout: true
            }
        }
    });
}
```

The task supports more options than shown here, see [here](https://github.com/stevewillcock/grunt-msbuild) for more info.

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

I'm a big fan of using [Robocopy](http://technet.microsoft.com/en-us/library/cc733145.aspx) (n&eacute;e xcopy) to deploy web apps. We can use the [grunt-robocopy](https://github.com/mikeobrien/grunt-robocopy) task to run it (`npm install grunt-robocopy --save`). In your `gruntfile.js`, load the task and configure it as follows:

```js
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-dotnet-assembly-info');
    grunt.loadNpmTasks('grunt-msbuild');
    grunt.loadNpmTasks('grunt-nunit-runner');
    grunt.loadNpmTasks('grunt-robocopy');
    ...
    grunt.registerTask('ci', ['assemblyinfo', 'msbuild', 'nunit', 'robocopy']);

    grunt.initConfig({
        ...
        robocopy: {
            options: { 
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
                },
            }
        }
    });
}
```

The options above are pretty self explanatory. The `mirror` option allows you to synchronize your destination with your source folder, removing any deleted files. The `retry` options allow you to retry the copy after so many seconds if it failed. Both these options in particular have been useful when deploying websites. The task fully supports all the robocopy options, see [here](https://github.com/mikeobrien/grunt-robocopy) for more info.

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

The last step is to setup your build server to run Grunt. I'm going to assume you're using [TeamCity](http://www.jetbrains.com/teamcity/) for your builds. Follow the steps below on your build server:

- [Download](http://nodejs.org/download/) and install Node.js.
- Install `grunt-cli`: `npm install grunt-cli -g -prefix="C:\Program Files\nodejs"`. You will need to set the prefix to be a path TeamCity can access. I simply put it in the node install directory along side NPM. By default this folder is added to the PATH by the Node.js installer. Note that depending on your UAC settings you may need to run that command in an elevated command prompt as `Program Files` can be locked down. Also the 32 bit version will be installed to `Program Files (x86)` by default.
- Restart the TeamCity build agent so it picks up the Node.js path.
- Create a `Command Line` build step in TeamCity, set `Run` to `Custom script` and enter the following as the `Custom script`:

```bash
call npm install
call grunt ci
```

NOTE: If your TeamCity agent directory is not on the system drive you will hit [a bug in NPM](https://github.com/isaacs/npm/issues/4313) (As of the date of this post anyways). To get around it just add `call npm config set cache d:\temp\npm-cache` before `call npm install` above. You want the cache path to be on the same drive as the TeamCity agent directory, in this example its on `D:`.

### Conclusion ###

Hopefully this demonstrates how easy it is to setup a .NET build/deploy with Grunt. If you are doing client side development, this will be even more of a win as your tools (Like Karma, JSHint, etc) will be run by the same build tool.