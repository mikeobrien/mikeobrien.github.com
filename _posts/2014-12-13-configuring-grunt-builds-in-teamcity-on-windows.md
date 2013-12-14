---
published: true
layout: post
title: Configuring Grunt Builds in TeamCity on Windows
tags: [Grunt, NPM, Node.js, Build/Deploy]
---

Configuring TeamCity to run Grunt builds is pretty easy. I will outline the steps below. First lets assume you are working with a project structure that looks something like the following:

```
/
  /src
  /...
  package.json
  gruntfile.js
  ...
```

Make sure you have a minimal `package.json` at the project root with grunt defined:

```json
{
  "name": "MyApp",
  "version": "0.0.0",
  "devDependencies": {
    "grunt": "~0.4.2"
  }
}
```

1. [Download](http://nodejs.org/download/) and install Node.js.
2. Install `grunt-cli` ([Not grunt!](https://github.com/gruntjs/grunt-cli#grunt-cli-)): `npm install grunt-cli -g -prefix="C:\Program Files\nodejs"`. You will need to set the prefix to be a path TeamCity can access. I simply put it in the node install directory along side NPM. By default this folder is added to the PATH by the Node.js installer. Note that depending on your UAC settings you may need to run that command in an elevated command prompt as `Program Files` can be locked down. Also the 32 bit version will be installed to `Program Files (x86)` by default.
3. Restart the TeamCity build agent so it picks up the Node.js path.
4. Create a `Command Line` build step in TeamCity, set `Run` to `Custom script` and enter the following as the `Custom script` (You can optionally specify a build task e.g. `call grunt build`):

```bash
call npm install
call grunt
```

NOTE: If your TeamCity agent directory is not on the system drive you will hit [a bug in NPM](https://github.com/isaacs/npm/issues/4313) (As of the date of this post anyways). To get around it just add `call npm config set cache d:\temp\npm-cache` before `call npm install` above. You want the cache path to be on the same drive as the TeamCity agent directory, in this example its on `D:`.

Thats all there is to it!