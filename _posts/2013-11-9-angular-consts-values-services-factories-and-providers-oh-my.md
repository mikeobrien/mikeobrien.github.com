---
published: true
layout: post
title: Angular Consts, Values, Factories, Services, Providers and Decorators, Oh My!
tags: [AngularJS]
---

Consts, values, factories, services, providers and directives; pretty confusing when you first start working with Angluar. [@mhevery](https://twitter.com/mhevery) wrote up a nice comparison [here](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/b8hdPskxZXsJ) that really helped me make sense of most of these concepts (Values, factories, services and providers at least). [@liormessinger](https://twitter.com/liormessinger) also wrote up a fantastic SO answer explaining [@mhevery](https://twitter.com/mhevery)'s comparison [here](http://stackoverflow.com/a/15666049/126068). The following is yet another overview that also includes consts and decorators (Based on Angular 1.2.0). All these combined make up the [$provide service](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide). The name soup is pretty confusing and IMO makes it harder to grok than it should be so hopefully this discussion will help clear it up.

### Providers ###

Conceptually Angular has an IoC container that only supports a singelton lifecycle. IoC containers typically allow you to register either instances or factories that create instances. All that should sound familiar if you come from .NET or Java and use an IoC container. Internally Angular's IoC container only allows you register a *provider* (in Angular parlance). A provider is essentially a *factory* that can create an instance:

```js
{
    $get: function(...) {   // Dependencies
        return ...;         // Return the instance
    }
}
```

That's it! An object with a `$get` method that returns an object or a primitive. Only one instance of the provider itself and the value it produces are maintained. You can also pass in dependencies. These dependencies can either be *constants* (In Angular parlance) or the results of other providers. 

A [convenience method](http://code.angularjs.org/1.2.0/docs/api/AUTO.$provide#methods_provider) on `Module` allows you to register providers:

```js
module('myModule', []).
    provider('theProviderName', {
        $get: function(...) {
            return ...;
        }
    });
```

You pass in the provider name and the provider. The name you specify is then used to resolve dependencies, for example:

```js
module('myModule', []).
    provider('repository', {
        $get: function($http) {
            return ...;
        }
    }).
    provider('loggingRepository', {
        $get: function(repository) {
            return ...;
        }
    }).
    controller('UserCtrl', function(loggingRepository) { ... });
```

Notice how the `loggingRepository` and `UserCtrl` are taking in the dependencies `repository` and `loggingRepository` respectively. The `repository` is taking `$http` as a dependency which was provided by Angular. NB: minimization can mangle the parameter names killing Angular's DI. You can find more info in this [here](http://docs.angularjs.org/tutorial/step_05#controller_a-note-on-minification).

You can also define providers in the module config method if you need more flexibility:

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
    // Constructor invocation pattern
    provider('name', function(...) {  // Dependencies (Other providers or constants)
        this.$get = function(...) {   // Dependencies (Values created by providers or constants)
            return ...;               // Return the instance
        };
    }).

    // Object literal factory
    provider('name', function(...) {  // Dependencies (Other providers or constants)
        return {
            $get: function(...) {     // Dependencies (Values created by providers or constants)
                return ...;           // Return the instance
            }
        };
    });
```

According to [https://twitter.com/petebd‎](petebd) [the constructor invocation pattern was supported mainly because of CoffeeScript classes](https://groups.google.com/forum/#!msg/angular/56sdORWEoqg/kWGd1jo5_5cJ) which follow that. As you can see provider factories can take dependencies but they are not the same dependencies as the provider `$get` function can take. This can be a little confusing at first. The only dependencies that the provider factory can take are other providers (Not the values they produce) and constants (You'll see why in a bit). So for example:


```js
module('myModule', []).
    constant('pi', 3.14159).
    provider('math', function(pi) {
        return {
            $get: function(...) { ... }
        };
    }).
    provider('math2', function(pi, mathProvider) {
        return {
            $get: function(...) { ... }
        };
    });
```

So the second provider takes in a constant and the math provider. Notice how `Provider` is prepended to the provider name.

Up until now I haven't said anything about services, factories or values. Why? Because they don't exist in Angular, there are just providers, period. The service, factory and value methods on `Module` and `$provide` are just *convenience methods* that accept different things and turn them into providers. *THERE ARE NO SERVICES, FACTORIES OR VALUES IN ANGULAR!* Here are the convenience methods (I expanded them out for demonstrative purposes, see the actual ones [here](https://github.com/angular/angular.js/blob/v1.2.0/src/auto/injector.js#L632)):

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

So `factory` is just a convenience method for passing a function that creates an instance. `service` is just a convenience method for passing in a function constructor. And `value` is just a convenience method for passing an instance. But as you can see, its all just providers. Or if you're coming from C# these would be analogous to this respectively:

```csharp
public class Module 
{
    public Module CreateProvider(Provider provider) { ... }

    public Module CreateProvider(Func<object> factory) 
    { 
        CreateProvider(new Provider(factory));
        return this;
    }

    public Module CreateProvider(Type type)
    { 
        CreateProvider(new Provider(() => Activator.CreateInstance(type))));
        return this;
    }

    public Module CreateProvider(object instance)
    { 
        CreateProvider(new Provider(() => instance)));
        return this;
    }
}
```

I really think this nomenclature confuses people leading people to believe that there are these three separate constructs when really there is just one. The methods should be renamed to something along these lines IMO:

```js
providerFactory()
providerConstructor()
providerInstance()
```

So now that we understand this how is all this tied together? The following illustrates this:

![Angular provider flow](images/angular-provider-flow.png)



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

