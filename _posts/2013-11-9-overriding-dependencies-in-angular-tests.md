---
published: true
layout: post
title: Overriding Dependencies in Angular Tests
tags: [AngluarJS, Testing]
---

One of the great things about Angular is how it encourages compositional design with baked in DI. And one of the benefits of compositional design is ease of testing as dependencies can be swapped out. But how do you override dependencies when testing Angular code? Let's see...

### Getting Started ###

Angular ships with some tools to make testing Angular code easier. These tools are included in [ngMock module](http://docs.angularjs.org/api/ngMock) which must be referenced by your test runner. This library mocks a few common services (e.g. `$httpBackend`, `$exceptionHandler`, `$exceptionHandlerProvider`, `$log`, `$interval` and `$timeout`) so that you can test your services in isolation. It also provides two functions, `module()` and `inject()` which load modules and inject dependencies. Currently `ngMock` only works with [Jasmine](http://pivotal.github.io/jasmine/) or [Mocha](http://visionmedia.github.io/mocha/) and the syntax used below is the same for both. You'll also see a little [expect.js](https://github.com/LearnBoost/expect.js/) sprinkled in.

We need to load the modules we want available to our tests. This requires two things, first, we need to reference the actual js file that contains the module, in our test runner so it can be loaded (This will vary so I'm not going to get into that). Second we need to call `module()` before each test to load it:

```js
describe('whatever', function() {
    beforeEach(module('myModule'));
});
```

You can also specify multiple modules and perform some configuration on load:

```js
describe('whatever', function() {
    beforeEach(module('myModule', 'anotherModule', function($provide) {
        // Do some provider configuration here
    }));

    beforeEach(module('andYetAnotherModule');

    beforeEach(module(function($provide) {
        // Do some more provider configuration here
    }));
});
```

`module()` also be called as many times as you want as show above.

The other function provided by angular-mocks is `$inject`. This method injects services registered with the Angular IoC container. Here is a common way of using `inject()` in tests:

```js
describe('whatever', function() {
    beforeEach(module('myModule');

    beforeEach(inject(function(myService) {
        // Do some configuration here
    }));

    it('should...', inject(function(myService) {
        expect(myService.doSomething()).to.be(...);
    }));
});
```

So the second `beforeEach()` and test function are wrapped by inject so that it can resolve the dependencies specified in the parameters. One important thing to be aware of is that `module()` cannot be called after `inject()`. The configuration performed in the context of `module()` is for providers using the `$provide` service. Configuration in the context of inject would be working with services. If you want to scope provider configuration to a particular test you can use this approach:

```js
describe('whatever', function() {
    it('should...', function() {
        module(function($provide) {
            // Do some provider config here
        });
        inject(function(myService) {
            expect(myService.doSomething()).to.be(...);
        });
    });
});
``` 

### Overriding Dependencies ###

Now on to how we can override dependencies. I'm not going to cover the built in overrides that angular-mocks provide but you can read more about them [here](http://docs.angularjs.org/api/ngMock). The following examples can either be done in a `beforeEach()` or the test itself.

One way you can override a dependency is just completely replacing it:

```js
beforeEach(module(function($provide) {
    $provide.value('serviceIWantToReplace', { 
        function doSomething() { ... }
    });
}));
```

Or you can modify it:

```js
beforeEach(inject(function(serviceIWantToModify) {
    serviceIWantToModify.doSomething = function() { ... };
}));
```

Or you can use a mocking library like [sinon](http://sinonjs.org/):

```js
it('should...', inject(function(myService, myServiceDependency) {
    myServiceDependency.getSomething = sinon.stub().returns(...);
    expect(myService.doSomething()).to.be(...);
}));
```

Controllers are a little different in that you can pass in dependencies directly if you'd like:

```js
it('should...', inject(function($controller, $rootScope) {
    var scope = $rootScope.$new();
    var mockService = { ... };
    var myCtrl = $controller('MyCtrl', { $scope: scope, someService: mockService });
    ...
}));
```

Now if you want to package this up for reuse you can create a module that contains your mocking functionality and include it in your tests:

```js
angular.module('myMocks', ['myModule']).
    config(function($provide) {
        
        // Augment a service
        $provide.decorator('someService', function($delegate) { 
            $delegate.doSomething = function() { ... };
            return $delegate;
        });
        
        // Replace a service
        $provide.value('anotherService', { ... });
    });

beforeEach(module('myModule', 'myMocks');
```

Completely replacing the service is the same as before but augmenting it can be done through a decorator in this context.

### Conclusion ###

There are a number of ways to override dependencies in Angular. Hopefully these examples make it clear how this can be done.