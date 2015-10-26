---
published: true
layout: post
title: Client Side Exception Logging in an Aurelia Application
tags: [Aurelia]
---

Logging exceptions on the client side is just as important as logging them on the server side. Also important is letting the user know something failed and what they should do next. I'll cover some strategies to enable this. I'm not going to cover the server side but will assume you have an endpoint setup where json error messages can be POSTed.

### Outside of Aurelia ###

Exceptions can occur both inside and outside of Aurelia. In order to catch all unhandled errors that occur outside of Aurelia, you can setup a [global error handler](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers.onerror) in your main page to handle these:

```js
<script>
	var escape = function(x) {
	    return x.replace('\\', '\\\\').replace('\"', '\\"')
	        .replace('\/', '\/\/').replace('\b', '\\b')
	        .replace('\f', '\\f').replace('\n', '\\n')
	        .replace('\r', '\\r').replace('\t', '\\t');
	};
	var XHR = window.XMLHttpRequest || function() {
	    try { return new ActiveXObject("Msxml3.XMLHTTP"); } catch (e0) {}
	    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e1) {}
	    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e2) {}
	    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e3) {}
	    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e4) {}
	};
	window.onerror = function(message, source, line, column, error) {
		try {
		    var xhr = new XHR();
		    xhr.open('POST', '/errors', true);
		    xhr.setRequestHeader('Content-type', 'application/json');
		    xhr.send('{ ' +
		        '"message": "' + escape(message || '') + '",' +
		        '"stackTrace": "' + escape(error ? error.stack || '' : '') + '",' +
		        '"source": "' + escape(source || '') + '",' +
		        '"url": "' + escape(window.location.href) + '",' +
		        '"line": "' + (line || 0) + '",' +
		        '"column": "' + (column || 0) + '"' +
		    '}');
	    }
	    finally {
	        // Display a friendly message to the user.
	    }
	};
</script>
```

This hander is placed in the main page (Not in a separate file) and before all script tags. It is also *very* lo-fi so it should run in any browser and not depend on a 3rd party library. I adapted the XHR factory from [Angular](https://github.com/angular/angular.js/blob/61943276f026e632dccae6405a05f79d486ed898/src/ng/httpBackend.js#L3) and [quirksmode.org](http://www.quirksmode.org/js/xmlhttp.html). After logging the exception on the server you will want to notify the user that something broke and what they should do next (Like contact support). Again, lo-fi, so that it works no matter what.

### In Aurelia ###

Now that we are logging unhandled exceptions outside of Aurelia we want to handle ones that happen *inside* of Aurelia. We can do this by creating a log appender that sends errors back to the server. First, lets install the necessary modules (You can omit the `tsd` call if not using TypeScript):

```bash
jspm install aurelia-http-client lodash
tsd install lodash --save
```

NOTE: The following code is TypeScript but you can easily adapt it to ES5/ES6.

```js
import { HttpClient } from 'aurelia-http-client';
import { Logger } from 'aurelia-logging';
import * as _ from 'lodash';

export class LogAppender {

    http: HttpClient;

    constructor(http: HttpClient) {
        this.http = http;
    }

    debug(logger: Logger, ...rest: any[]): void {}
    info(logger: Logger, ...rest: any[]): void {}
    warn(logger: Logger, ...rest: any[]): void {}

    error(logger: Logger, ...rest : any[]): void {
        var error = _.find(rest, x => x instanceof Error);
        this.http.post('errors', {
            url: window.location.href,
            source: (<any>logger).id,
            message: rest.join('\r\n'),
            stackTrace: error ? error.stack || '' : ''
        }).then();
        // Display a friendly message to the user.
    }
}
```
We are only implementing the `error` method above as that's all we're interested in logging but you could obviously log much more information by implementing the other levels. We are also looking for an `Error` object. If it was passed in, we can potentially extract the stack trace ([if it has it of course](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack)). 

Now that we've created the appender, we need to register it. This is done in your `main.js`. If you haven't already created one, see [here](http://aurelia.io/docs.html#startup-and-configuration) for more info.

```js

import { Aurelia, LogManager } from 'aurelia-framework';
import { ConsoleAppender } from 'aurelia-logging-console';
import { HttpClient } from 'aurelia-http-client';
import { LogAppender } from './log-appender';

LogManager.addAppender(new ConsoleAppender());
LogManager.addAppender(new LogAppender(new HttpClient()));
LogManager.setLevel(LogManager.logLevel.debug);

export function configure(aurelia: Aurelia) {
    ...
}
```
In the example above we import our appender, create it and pass in an `HttpClient`. You can have multiple appnders and also set the logging level for all appenders.

NOTE: ~~At this time, view errors are not handled by the Aurelia logging infrastructure. Also ATM [you can't reliably catch promise rejection errors with the global error handler](http://stackoverflow.com/questions/31472439/catch-all-unhandled-javascript-promise-rejections). If a view fails to load you will get something along the lines of this:~~

[This has been fixed as of 10/25/2015](https://github.com/aurelia/templating-router/commit/ac8dc0fb9ff03978f6dbe63b39b379505bd7050c) and should be released soon.

```bash
Unhandled promise rejection Error: A route with name 'add' could not be found. Check that `name: 'add'` was specified in the route's config.
    at AppRouter.generate (http://localhost/jspm_packages/github/aurelia/router@0.13.0/aurelia-router.js:1228:15)
    at http://localhost/jspm_packages/github/aurelia/templating-router@0.17.0/route-href.js:33:33
    at run (http://localhost/jspm_packages/npm/core-js@0.9.18/modules/es6.promise.js:91:43)
    at http://localhost/jspm_packages/npm/core-js@0.9.18/modules/es6.promise.js:105:11
    at module.exports (http://localhost/jspm_packages/npm/core-js@0.9.18/modules/$.invoke.js:6:25)
    at queue.(anonymous function) (http://localhost/jspm_packages/npm/core-js@0.9.18/modules/$.task.js:40:9)
    at Number.run (http://localhost/jspm_packages/npm/core-js@0.9.18/modules/$.task.js:27:7)
    at listner (http://localhost/jspm_packages/npm/core-js@0.9.18/modules/$.task.js:31:9)
```

There is an issue tracking this [here](https://github.com/aurelia/router/issues/227).