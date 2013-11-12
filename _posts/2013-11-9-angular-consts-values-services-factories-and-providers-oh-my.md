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

That's it! An object with a `$get` method that returns an instance. Only one instance of the provider itself and the object it produces are maintained. You can also pass in dependencies. These dependencies can either be constants (Which we'll cover in a bit) or instances created by other providers (But not the providers themselves, more on that later). 

A [convenience method](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide#methods_provider) on `Module` allows you to register providers, first specifying the name of the provider and then the provider itself:

```js
module('myModule', []).
    provider('theProviderName', {
        $get: function(...) {
            return ...;
        }
    });
```

You can also define providers in the module `config` method if you need more flexibility:

```js
module('myModule', []).
    config(function($provide) {
        // Do some crazy stuff here...
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

According to [petebd](petebd), [constructor functions were supported mainly because CoffeeScript classes use them](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/kWGd1jo5_5cJ). So don't feel compelled to use them unless you're using CoffeeScript or you like the constructor invocation pattern. You may find it simpler to just pass a function that returns a provider. As you can see, provider factories can take also dependencies and this can be an advantage. But they are not the same dependencies that are injected into the provider `$get` function. This can be a little confusing at first. The only dependencies that a provider factory can take are other providers (Not the instances they produce) and constants (You'll see why in a bit). So for example:


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

So the first provider takes in a constant and the second provider takes in the math provider. Notice how `Provider` is appended to the provider name. Thats the convention Angular uses for naming providers.

### Service, Factories and Values ###

Up until now I haven't said anything about services, factories or values. Why? Because those concepts don't actually exist in Angular, there are only providers and the instances they produce, period. The `service`, `factory` and `value` methods on `Module` and `$provide` are just *convenience methods* that accept functions or instances and turn them into providers, they don't represent any special Angular constructs by those names. I think the worst and most overloaded term is service. There are no "Angular services", although *you* may call certain things services (Perhaps because they are similar to DDD services). But there is no inherent concept of a "service" in Angular. "Factory" and "value" are less ambiguous and better describe what their providers end up doing. But even so, there are no inherit "Angular factories" or "Angular values". To make this clearer, here are the convenience methods (I expanded them out for demonstrative purposes as they were DRY, see the actual ones [here](https://github.com/angular/angular.js/blob/v1.2.0/src/auto/injector.js#L632)):

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

So `factory` is just a convenience method for creating a provider from a function that returns the instance. `service` is just a convenience method for creating a provider from a function constructor that is instantiated as the instance (If you are using CoffeeScript of like that pattern). And `value` is just a convenience method for creating a provider that returns an instance. In the beginning we talked about how IoC containers typically allow you to register either instances, factories that create instances or a type to instantiate. That's exactly the functionality these convenience methods enable. But as you can see, its all just providers, the convenience methods just make it easier to do what you will want to do 99% of the time. In other words, you're probably not going to work with providers as I've been showing up till this point, you will be using these convenience methods. But hopefully you will now understand what they actually mean and the underlying construct they are creating. 

BTW, if you're coming from C#, those convenience methods would be analogous to this respectively:

```csharp
public class Module 
{
    public Module CreateProvider(Provider provider) { ... }

    public Module Factory(string name, Expression<Func<object>> factory) 
    { 
        return CreateProvider(new Provider(name, factory));
    }

    public Module Factory(string name, Expression<Func<object, object>> factory) 
    { 
        return CreateProvider(new Provider(name, factory));
    }

    ...

    public Module Service(string name, Type type)
    { 
        return CreateProvider(new Provider(name, args => Activator.CreateInstance(args)));
    }

    public Module Value(string name, object instance)
    { 
        return CreateProvider(new Provider(name, () => instance)));
    }
}
```

### Fitting it all together ###

So now that we understand provider, how is all this tied together? The following illustrates this:

![Angular provider flow](/blog/images/angular-provider-flow.png)

So when you register a provider either directly or via one of the convenience methods (service, factory or value) the provider injector creates provider, injecting dependencies that exist in the *provider cache*. This explains why you can only take in providers or constants as dependencies in provider factory methods. It then decorates the provider (We'll cover that later) and then puts the provider in the cache.

When a controller or directive is created, the instance injector tries to inject dependencies from the instance cache. If it can't find a dependency there it then looks to see if there is a provider for the dependency in the provider cache. If there is, it calls the `$get` function on the provider. It resolves the dependencies of the `$get` method the same way it does for controllers and directives; first checking the instance cache and then trying to find a provider, etc. The instance returned by the provider `$get` function is then cached in the instance cache for future use.

I put constants and decorators last as it will probably be easier to see how they fit in after this point.

### Constants ###

Now as you can probably see, constants are [not like the others](http://www.youtube.com/watch?v=ueZ6tvqhk8U). They are odd in that they get put into the provider cache, even though they are not providers, so that provider factories can take them as a dependency. They are also put into the instance cache so that providers (i.e. `$get`), controllers and directives can also take them as dependencies. You can see that clearly in the source:

```js
function constant(name, value) {
    providerCache[name] = value;
    instanceCache[name] = value;
}
```

Constants can be an object or primitive (Just in case the name makes you think primitives only). Since they are not providers they cannot be altered by decorators, so in that way they are "constant".

### Decorators ###

The last piece of the puzzle are decorators. Looking at the image above you will see a step in the provider injector called decorate. After a provider is created, the provider injector checks to see if there are any decorators for it and if so calls them and passes in the provider. This allows you to override or augment the functionality of a provider. One example of this is how Angular mocks overrides functionality. Check out how it overrides `$http` [here](https://github.com/angular/angular.js/blob/v1.2.0/src/ngMock/angular-mocks.js#L1748). 




