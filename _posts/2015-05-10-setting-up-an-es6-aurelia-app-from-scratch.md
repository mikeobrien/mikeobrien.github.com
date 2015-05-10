---
draft: true
layout: post
title: Setting Up An ES6 Aurelia App From Scratch
tags: []
---

The [getting started guide on the Aurelia site](http://aurelia.io/get-started.html) is a nice way to get up and running quickly. The  

### JSPM

Aurelia is currently distributed via two package managers, [Bower](http://bower.io/) and [JSPM](http://jspm.io/).

```bash
npm install jspm --save

jspm init
```

```
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

```bash
jspm install aurelia-bootstrapper aurelia-http-client
```

```bash
Configuration file config.js doesn't exist, create it? [yes]:
```