---
published: true
layout: post
title: Client Side Exception Logging and Notification in an Angular Application
tags: [AngularJS]
---

Logging exceptions on the client side is just as important as logging them on the server side. Also important is letting the user know something failed and what they should do next. I'll cover some strategies to enable this. I'm not going to cover the server side but will assume you have an endpoint setup where json error messages can be POSTed.

### Outside of Angular ###

Exceptions can occur both inside and outside of Angular. In order to catch all unhandled errors that occur outside of Angular, you can setup a [global error handler](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers.onerror):

```js
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
        window.onload = function() {
            if (document.getElementById('page-error')) return; // The error is already displayed
            var errorMessage = document.createElement('div');
            errorMessage.setAttribute('id', 'page-error');
            errorMessage.innerHTML = 'An error has occured and the details have been logged. ' +
                                     'Please contact customer support for assistance.';
            document.body.appendChild(errorMessage);
        }
    }
};
```

This hander is placed before all script tags. It is also *very* lo-fi so it should run in any browser and not depend on a 3rd party library. I adapted the XHR factory from [Angular](https://github.com/angular/angular.js/blob/61943276f026e632dccae6405a05f79d486ed898/src/ng/httpBackend.js#L3) and [quirksmode.org](http://www.quirksmode.org/js/xmlhttp.html). After logging the exception on the server you will want to notify the user that something broke and what they should do next (Like contact support). Again, lo-fi, so that it works no matter what.

### In Angular ###

Now that we are logging unhandled exception outside of Angular we want to handle ones that happen *inside* of Angular. There are two places where we will see errors, first with http calls and second in our code. 

#### Http Errors ####

Communication with the server can fail in a number of ways. Connectivity could be broken, server errors and server side validation could return error statuses. In all these situations you'll want to notify the user that something went wrong and why. I've found that Angular events are a nice way to signal that there was an error. This keeps the error handling and display of the error loosely coupled and easier to test. Below is an example of an [http interceptor](http://docs.angularjs.org/api/ng.$http#description_interceptors) that broadcasts http errors. It [broadcasts](http://docs.angularjs.org/api/ng.$rootScope.Scope#methods_$broadcast) the error from the [`$rootScope`](http://docs.angularjs.org/api/ng.$rootScope.Scope) so that all child scopes can subscribe to the event.

```js
angular.module('errorHandling', []). 
    constant('HTTP_DEFAULT_ERROR_MSG', 'An error has occured. Please contact customer support for assistance.').
    constant('HTTP_NETWORK_ERROR_MSG', 'Unable to communicate with the server. Make sure you are connected to the internet and try again.').
    config(function($httpProvider) {
        $httpProvider.interceptors.push(function($q, $rootScope, HTTP_DEFAULT_ERROR_MSG, HTTP_NETWORK_ERROR_MSG) {
            return { 
                responseError: function(response) {
                    var message = response.headers('status-text') || HTTP_DEFAULT_ERROR_MSG;
                    if (response.status == 0) message = HTTP_NETWORK_ERROR_MSG;
                    $rootScope.$broadcast('error', message);
                    return $q.reject(response);
                }
        }});
```

We declare the standard messages as constants so that we can test that the right message is shown (As we'll see later). Angular will return an http status of zero if there is no connectivity so we can display a message that specifically addresses that. Sometimes it makes sense for the server to send a user friendly message back to the client. For example, server side validation could return a 400 and a message explaining why validation failed (e.g. "Account status cannot be changed because..."). There are a few ways to do this and I personally like using the [status text](http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html#sec6.1.1). Unfortunately [the status text is not included in the response object as of Angular 1.2.0 but will hopefully be added soon](https://github.com/angular/angular.js/issues/2335). Headers are available though, so you can pass along messages that way as shown above. Or you can just return the message in the response body. After broadcasting the error we reject the response.

We can test the above interceptor using the [mock `$httpBackend`](http://docs.angularjs.org/api/ngMock.$httpBackend) as demonstrated below:

```js
describe('Http error notification', function() {
    beforeEach(module('errorHandling'));

    var makeRequest;

    beforeEach(inject(function($rootScope, $httpBackend, $http) {
        makeRequest = function(status, headers) {
            var scope = $rootScope.$new();
            var errors = [];
            scope.$on('error', function(e, message) { errors.push(message); });
            $httpBackend.whenGET('/').respond(status, '', headers || { });
            $http.get('/');
            $httpBackend.flush();
            return errors;
        };
    }));

    it('should broadcast error when network error occurs', inject(function(HTTP_NETWORK_ERROR_MSG) {
        var errors = makeRequest(0);
        expect(errors.length).to.be(1);
        expect(errors[0]).to.eql(HTTP_NETWORK_ERROR_MSG);
    }));

    it('should broadcast error when http status is 300 or higher', inject(function(HTTP_DEFAULT_ERROR_MSG) {
        var errors = makeRequest(300);
        expect(errors.length).to.be(1);
        expect(errors[0]).to.eql(HTTP_DEFAULT_ERROR_MSG);
    }));

    it('should broadcast error with message as http status description', function() {
        var statusText = "Username cannot be blank.";
        var errors = makeRequest(400, { "status-text": statusText });
        expect(errors.length).to.be(1);
        expect(errors[0]).to.eql(statusText);
    });
});
``` 

#### Unhandled Exceptions ####

Angular ships with a service called [`$exceptionHandler`](http://docs.angularjs.org/api/ng.$exceptionHandler). The stock version simply logs the exception to the `$log` service. [Decorating](http://docs.angularjs.org/api/AUTO.$provide#methods_decorator) the `$exceptionHandler` service allows us to shoehorn in logging and notification as shown here:

```js
angular.module('errorHandling', []). 
    constant('SCRIPT_ERROR_MSG', 'An error has occured and the details have been logged. Please contact customer support for assistance.').
    constant('LOGGING_URL', '/errors/javascript').
    config(function($provide) {
        $provide.decorator('$exceptionHandler', function($delegate, $injector, $window, SCRIPT_ERROR_MSG, LOGGING_URL) {
            return function(exception, cause) {
                // Using injector to get around cyclic dependencies
                $injector.get('$rootScope').$broadcast('error', SCRIPT_ERROR_MSG);
                // Bypassing angular's http abstraction to avoid infinite exception loops
                $injector.get('$httpBackend')('POST', LOGGING_URL, angular.toJson({
                        message: exception.stack || exception.message || exception || '',
                        source: cause || '',
                        url: $window.location.href
                }), angular.noop, { 'content-type': 'application/json' });
                $delegate(exception, cause);
            };
        });
    });
```

Again, making messages constants so that notifications can be tested. In order to use `$rootScope` and `$httpBackend` in the `$exceptionHandler` we need to manually inject the services. There is a cyclic dependency and Angular will fail if it tries to inject the dependencies automatically (As it should, normally you don't want to do that). You'll also note that we're using the `$httpBackend` directly here. Normally you would use `$http` but in this case we can end up in an infinite loop of exceptions if we use `$http`, particularly in tests (Remember the cyclic dependency). Dropping down to `$httpBackend` avoids calls back to `$exceptionHandler` thus avoiding the loop. The exception you get may not be a [Error object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error), it may be a string or it may be missing the stack trace. So when setting the message we first check for a stack trace property and then a message property before treating it as a string. After that we call the underlying `$exceptionHandler`.

Again, we can test the above decorator using the [mock `$httpBackend`](http://docs.angularjs.org/api/ngMock.$httpBackend) as shown below:

```js
describe('Script error logging', function() {

    beforeEach(module('errorHandling', function($exceptionHandlerProvider) {
        $exceptionHandlerProvider.mode('log');
    }));

    var errors;

    beforeEach(inject(function($rootScope) {
        var scope = $rootScope.$new();
        errors = [];
        scope.$on('error', function(e, message) { errors.push(message); });
    }));

    afterEach(inject(function($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    }));

    it('should broadcast script errors and log them to the server', inject(function($exceptionHandler, $httpBackend, $window, LOGGING_URL, SCRIPT_ERROR_MSG) {
        $httpBackend.expectPOST(LOGGING_URL, 
            { message: 'oh hai', source: '', url: $window.location.href }, 
            { 'content-type': 'application/json'}).respond(200);
        $exceptionHandler('oh hai');
        $httpBackend.flush();
        expect(errors.length).to.be(1);
        expect(errors[0]).to.eql(SCRIPT_ERROR_MSG);
    }));

    it('should broadcast script errors even when server call fails', inject(function($exceptionHandler, $httpBackend, LOGGING_URL, SCRIPT_ERROR_MSG) {
        $httpBackend.whenPOST(LOGGING_URL).respond(500);
        $exceptionHandler('oh hai');
        $httpBackend.flush();
        expect(errors.length).to.be(1);
        expect(errors[0]).to.eql(SCRIPT_ERROR_MSG);
    }));
});
```

### Conclusion ###

So logging all unhanlded exceptions in an Angular app means monitoring exceptions both inside and outside of Angular. Inside of Angular you have two points of failure, http calls and your code. You can hook into all these exceptions by using the global error handler, http interceptors and `$exceptionHandler`'s. From there you can log them to the server and notify your users.