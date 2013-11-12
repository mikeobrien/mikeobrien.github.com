---
published: true
layout: post
title: Angular Consts, Values, Factories, Services, Providers and Decorators, Oh My!
tags: [AngularJS]
---

Consts, values, factories, services, providers and directives; pretty confusing when you first start working with Angluar. [@mhevery](https://twitter.com/mhevery) wrote up a nice comparison [here](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/b8hdPskxZXsJ) that really helped me make sense of most of these concepts (Values, factories, services and providers at least). [@liormessinger](https://twitter.com/liormessinger) also wrote up a fantastic SO answer summarizing [@mhevery](https://twitter.com/mhevery)'s comparison [here](http://stackoverflow.com/a/15666049/126068). The following is yet another overview that also includes consts and decorators (Based on Angular 1.2.0). All these combined make up the [$provide service](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide). The name soup is pretty confusing and IMO makes things harder to grok than they should be so hopefully this discussion will help clear it up.

### Providers ###

Conceptually, Angular has an IoC container that only supports a singleton lifecycle. IoC containers typically allow you to register either instances or factories that create instances. All that should sound familiar if you come from .NET or Java and use an IoC container. Internally Angular's IoC container only allows you register a *provider* (in Angular parlance). A provider is just a *factory* that can create an instance:

```js
{
    $get: function(...) {   // Dependencies
        return ...;         // Return the instance
    }
}
```

That's it! An object with a `$get` method that returns an object or a primitive. Only one instance of the provider itself and the instance it produces are maintained. You can also pass in dependencies. These dependencies can either be *constants* (Which we'll cover in a bit) or instances created by other providers (But not the providers themselves, more on that later). 

A [convenience method](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide#methods_provider) on `Module` allows you to register providers:

```js
module('myModule', []).
    provider('theProviderName', {
        $get: function(...) {
            return ...;
        }
    });
```

You pass in the provider name and the provider. Dependencies are resolved by mapping the function parameter names to provider names, for example:

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

You can also define providers in the module `config` method if you need more flexibility:

```js
module('myModule', []).
    config(function($provide) {
        // Do some stuff here...
        $provide.provider('repository', {
            $get: function($http) {
                return ...;
            }
        });
    };
```

Now the `provider` function doesn't just take object literals, you can also pass in functions:


```js
module('myModule', []).
    // Function constructor that can be instantiated
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

According to [petebd](petebd), [constructor functions were supported mainly because CoffeeScript classes use them](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/kWGd1jo5_5cJ). So don't feel compelled to use them unless you're using CoffeeScript or you like the constructor invocation pattern. You may find it simpler to just pass a function that returns a provider. As you can see, provider factories can take dependencies and this can be an advantage. But they are not the same dependencies that are injected into the provider `$get` function. This can be a little confusing at first. The only dependencies that the provider factory can take are other providers (Not the instances they produce) and constants (You'll see why in a bit). So for example:


```js
module('myModule', []).
    constant('pi', 3.14159).
    provider('math', function(pi) {
        return {
            $get: function(...) { ... }
        };
    }).
    provider('math2', function(mathProvider) {
        return {
            $get: function(...) { ... }
        };
    });
```

So the first provider take in a constant and the second provider takes in the math provider. Notice how `Provider` is prepended to the provider name. Thats the convention Angular uses for naming providers.

Up until now I haven't said anything about services, factories or values. Why? Because they don't exist in Angular, there are only providers, period. The service, factory and value methods on `Module` and `$provide` are just *convenience methods* that accept different things and turn them into providers. *THERE ARE NO SERVICES, FACTORIES OR VALUES IN ANGULAR!* Here are the convenience methods (I expanded them out for demonstrative purposes, see the actual ones [here](https://github.com/angular/angular.js/blob/v1.2.0/src/auto/injector.js#L632)):

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

So `factory` is just a convenience method for creating a provider from a function. `service` is just a convenience method for creating a provider from a function constructor (If you are using CoffeeScript of like that pattern). And `value` is just a convenience method for creating a provider that returns an instance. But as you can see, its all just providers, the convenience methods just make it easier to do what people will want to do 99% of the time. If you're coming from C#, these convenience methods would be analogous to this respectively:

```csharp
public class Module 
{
    public Module CreateProvider(Provider provider) { ... }

    public Module CreateProvider(string name, Func<object> factory) 
    { 
        return CreateProvider(new Provider(name, factory));
    }

    public Module CreateProvider<T>(string name) where T : new()
    { 
        return CreateProvider(new Provider(name, () => new T()));
    }

    public Module CreateProvider(string name, object instance)
    { 
        return CreateProvider(new Provider(name, () => instance)));
    }
}
```

So now that we understand this, how is all this tied together? The following illustrates this:

![Angular provider flow](/blog/images/angular-provider-flow.png)



TODO: non singleton


### Consts ###

First we'll start off with consts as they are [not like the others](http://www.youtube.com/watch?v=ueZ6tvqhk8U). Constants are different 

```js
function constant(name, value) {
    assertNotHasOwnProperty(name, 'constant');
    providerCache[name] = value;
    instanceCache[name] = value;
}
```

