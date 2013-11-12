---
published: true
layout: post
title: Angular Constants, Values, Factories, Services, Providers and Decorators, Oh My!
tags: [AngularJS]
---

Constants, values, factories, services, providers and decorators; pretty confusing when you first start working with Angluar. [@mhevery](https://twitter.com/mhevery) wrote up a nice comparison [here](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/b8hdPskxZXsJ) that really helped me make sense of most of these concepts (Values, factories, services and providers at least). [@liormessinger](https://twitter.com/liormessinger) also wrote up a fantastic SO answer summarizing [@mhevery](https://twitter.com/mhevery)'s comparison [here](http://stackoverflow.com/a/15666049/126068). The following is yet another overview that also includes constants and decorators (Based on Angular 1.2.0). All these combined make up the [$provide service](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide). The name soup is pretty confusing and IMO makes things harder to grok than they should be so hopefully this discussion will help clear it up.

### Providers ###

Conceptually, Angular has an IoC container that only supports a singleton lifecycle. IoC containers typically allow you to register either instances, factories that create instances or a type to instantiate. All that should sound familiar if you come from .NET or Java and use an IoC container. Internally Angular's IoC container only allows you register a *provider* (in Angular parlance). A provider is just a *factory* that can create an instance:

```js
{
    $get: function(...) {   // Dependencies
        return ...;         // Return the instance
    }
}
```

That's it! An object with a `$get` function that returns an instance. Only one instance of the provider itself and the object it produces are maintained. You can also pass in dependencies. These dependencies can either be constants (Which we'll cover in a bit) or instances created by other providers (But not the providers themselves, more on that later). 

A [convenience function](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide#methods_provider) on `Module` allows you to register providers, first specifying the name of the provider and then the provider itself:

```js
module('myModule', []).
    provider('theProviderName', {
        $get: function(...) {
            return ...;
        }
    });
```

You can also define providers in the module `config` function if you need more flexibility:

```js
module('myModule', []).
    config(function($provide) {
        // Do some crazy config stuff here...
        $provide.provider('theProviderName', {
            $get: function(...) {
                return ...;
            }
        });
    };
``` 

Dependencies are resolved by mapping the function parameter names to provider names, for example:

```js
module('myModule', []).
    provider('user', {
        $get: function() {
            return 'Richard Feynman'; 
        }
    }).
    provider('greeting', {
        $get: function(user) { // 'Richard Feynman' will be passed into the user parameter
            return 'Hi ' + user;
        }
    }).
    controller('GreetCtrl', function(greeting) { ... }); // 'Hi Richard Feynman' will be passed into the greeting parameter
```

Notice how the `greeting` and `GreetCtrl` are taking in the dependencies `user` and `greeting` respectively. NB: minimization can mangle the parameter names killing Angular's DI. You can find more info on how to handle this [here](http://docs.angularjs.org/tutorial/step_05#controller_a-note-on-minification).

Now the `provider` function doesn't just take providers, you can also pass in [constructor functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects#Using_a_constructor_function) and functions that return a provider (or provider factories):


```js
module('myModule', []).
    // Constructor function 
    provider('name', function(...) {  // Dependencies (Providers or constants)
        this.$get = function(...) {  // Dependencies (Instances or constants)
            return ...;               // Return the instance
        };
    }).

    // Function that returns a provider
    provider('name', function(...) {  // Dependencies (Providers or constants)
        return {
            $get: function(...) {     // Dependencies (Instances or constants)
                return ...;           // Return the instance
            }
        };
    });
```

According to [petebd](petebd), [constructor functions were supported mainly because CoffeeScript classes use them](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/kWGd1jo5_5cJ). So don't feel compelled to use them unless you're using CoffeeScript or you like the constructor invocation pattern. You may find it simpler to just pass in an object literal as shown earlier. As you can see, provider factories can also take dependencies and this can be an advantage. But they are not the same dependencies that are injected into the provider `$get` function. This can be a little confusing at first. The only dependencies that a constructor function or provider factory can take are other providers (Not the instances they produce) and constants (You'll see why in a bit). So for example:


```js
module('myModule', []).
    constant('pi', 3.14159).
    provider('math', function(pi) {               // Takes in a constant
        return {
            $get: function(...) { ... }
        };
    }).
    provider('math2', function(mathProvider) {    // Takes in another provider
        return {
            $get: function(...) { ... }
        };
    });
```

So the first provider takes in a constant and the second provider takes in the math provider. Notice how "Provider" is appended to the provider name. Thats the convention Angular uses for naming providers.

### Service, Factories and Values ###

Up until now I haven't said anything about services, factories or values. Why? Because those concepts don't exist in Angular as distinct constructs, there are only providers and the instances they produce. The `service()`, `factory()` and `value()` functions on `Module` and `$provide` are just *convenience functions* (Poorly named IMO) that accept functions or instances and turn them into providers, they don't represent any special Angular constructs by those names. To make this clearer, here are the convenience functions (I expanded them out for demonstrative purposes as they were DRY, see the actual ones [here](https://github.com/angular/angular.js/blob/v1.2.0/src/auto/injector.js#L632)):

```js
function factory(name, factoryFn) { 
    return provider(name, { 
        $get: factoryFn 
    }); 
}

function service(name, constructor) {
    return provider(name, { 
        $get: function($injector) {
            return $injector.instantiate(constructor);
        } 
    });
}

function value(name, val) { 
    return provider(name, { 
        $get: function() { return val; } 
    }); 
}
```

So `factory()` is just a convenience function for creating a provider from a function that returns the instance. `service()` is just a convenience function for creating a provider from a function constructor that is instantiated as the instance (If you're using CoffeeScript of like that pattern). And `value()` is just a convenience function for creating a provider that returns an instance. In the beginning we talked about how IoC containers typically allow you to register either instances, factories that create instances or a type to instantiate. That's exactly the functionality these convenience functions enable. But as you can see, its providers all the way down and the convenience functions just make it easier to do what you will want to do 99% of the time. 

At this point Zoidberg would say "then why with all the Angular services??" "service" is just the colloquial name Angular folks have given to anything in Angular's IoC container. So in angular parlance, *providers* create *services* and *services* can then be taken as dependencies in other services, controllers, filters and directives. `service()`, `factory()` and `value()` are all shortcuts for registering *providers* that create *services* (Despite the Starbucks drink size naming).

Finally, you're probably not going to work with providers directly as I've been showing up till this point, you will probably be using the `service()`, `factory()` and `value()` convenience functions. But hopefully you will now understand what they actually do and the underlying construct they are creating.

### Fitting it all together ###

So now that we understand providers (and their convenience functions), how is all this tied together? The following illustrates this:

![Angular provider flow](/blog/images/angular-provider-flow.png)

So when you register a provider either directly or via one of the convenience functions (`service()`, `factory()` or `value()`) the provider injector creates an instance of the provider. If you registered a provider factory or constructor function with dependencies, dependencies are injected from the *provider cache*. This explains why you can only take in providers or constants as dependencies in provider factory or constructor functions (And remember we're not talking about dependencies injected into the `$get` function, that's different). It then puts the provider in the provider cache.

When a controller, directive or filter is created, the instance injector tries to inject dependencies from the *instance cache*. If it can't find a dependency there, it then looks to see if there is a provider for the dependency in the *provider cache*. If there is, it calls the `$get` function on the provider to get the instance. It resolves the dependencies of the `$get` function the same way it does for controllers, directives and filters; first checking the *instance cache* and if it can't find it there, tries to find a provider, and so on. The instance returned by the provider `$get` function is then cached in the instance cache for future use.

I put constants and decorators last as it will probably be easier to see how they fit in after this point.

### Constants ###

Now as you can probably see from the image above, constants are [not like the others](http://www.youtube.com/watch?v=ueZ6tvqhk8U). They are oddball in that they get put directly into both the provider and instance cache. You can see this clearly in the source:

```js
function constant(name, value) {
    providerCache[name] = value;
    instanceCache[name] = value;
}
```

They are also not providers even though they get put into the provider cache. This allows provider factories and constructor functions can take them as a dependency. And of course the provider `$get` function, controllers, directives and filters can also take them as dependencies. Constants can be an object or primitive (Just in case the name makes you think primitives only). Since they are not providers and skip the provider workflow, they cannot be altered by decorators, so in that way they are "constant".

### Decorators ###

The last piece of the puzzle are decorators. Decorators allow you to override or augment an instance right after the provider creates it. One example of this is how Angular mocks override functionality. Check out how it overrides `$http` [here](https://github.com/angular/angular.js/blob/v1.2.0/src/ngMock/angular-mocks.js#L1748). 

Decorators are simply functions that take in an instance and dependencies and then return an instance. The dependencies are injected from the instance cache, so services or constants. A special dependency called `$delegate` is a reference to the instance you are overriding.

```js
function($delegate, ...) { // Dependencies
    return ...;            // Return an instance
});
```

You have a couple of options here, you can either replace the instance or augment/wrap the instance. If you want to do the former it's much simpler to just use `service()`, `factory()` or `value()`. But if you want to do the latter this is the right place.

You can apply decorators using the `decorator()` function:

```js
angular.module('myModule', []).
    config(function($provide) {
        $provide.decorator('providerName', function($delegate, ...) {
            return ...;
        });
    });
```

The first parameter of the `decorator()` function is the name of the provider you want to decorate, followed by the decorator. [Under the hood](https://github.com/angular/angular.js/blob/v1.2.0/src/auto/injector.js#L648) the provider `$get` function is being wrapped by the decorator. So decorators can be applied multiple times and you end up with a chain of calls that operate on the instance.

The following example is taken right out of the angular docs but it nicely demonstrates a real life usage of decorators:

```js
angular.module('myModule', []).
    config(function($provide) {
        $provider.decorator('$log', function($delegate) {
              $delegate.warn = $delegate.error;
              return $delegate;
        });
    });
```

Here you can configure the `$log` service right after it is created.

### Conclusion ###

Hopefully all these concepts are a little clearer now. Main things to remember are:

* Providers are simply factories that create instances in the Angular IoC container.
* The `service()`, `factory()` and `value()` functions are just shortcuts for creating providers, despite what their name might imply.
* Everything in the Angular IoC container is *colloquially* known as a "service". And they are just vanilla objects and functions, they are not special Angular constructs.
* Constants are just objects added directly to the Angular IoC container.
* Decorators augment or configure providers.
































