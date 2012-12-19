---
published: false
layout: post
title: 
tags: [physics, semiconductors, transistors, diodes]
---

I just started reading [The Elements of Computing Systems](http://mitpress.mit.edu/books/elements-computing-systems) (A **fantastic** book BTW) and it starts out talking about the most primitive element, the [logic gate](http://en.wikipedia.org/wiki/Logic_gate). The following post will try to cover some of the basics up to where the book begins by looking at the relevant physics behind semiconductors and then looking at diodes and after that, transistors (which make up logic gates in modern computing systems). Now I'm not a professional phycisist, materials scientist or electrical engineer, just a hobyist so all the usual disclaimers apply.

### Physics

Before we look at transistors I'd like to cover the relevant physics. This is the way I approached it and I've found it really helped me. Most of the material in this section is taken from [Donald Sadoway's](http://donaldsadoway.com/) phenominal course [3.091 Introduction to Solid State Chemistry](http://ocw.mit.edu/courses/materials-science-and-engineering/3-091sc-introduction-to-solid-state-chemistry-fall-2010/index.htm). I'll try to reference the video lectures as we go and I encourage you to watch them. 

#### Quantum Energy States

You probably already know the basics from high school physics but we'll cover them anyways. Atoms and molecules have discreete energy states that electrons can occupy. Because electrons can only be in these states around the atom or molecule the states are said to be [quantized](http://en.wikipedia.org/wiki/Quantization_(physics)). According to the [Aufbau Principle](http://en.wikipedia.org/wiki/Aufbau_principle) (Aufbau litererally meaning "building up" in German) electrons will occupy the lowest energy states first. The lowest energy state is called the [ground state](http://en.wikipedia.org/wiki/Ground_state). The closer electrons are to the nucleus the lower the energy state but the higher the [binding energy](http://en.wikipedia.org/wiki/Electron_binding_energy). Energy states are grouped into [shells](http://en.wikipedia.org/wiki/Electron_shell). The following [energy level diagram](http://en.wikipedia.org/wiki/Energy_level#Energy_level_diagrams) demonstrates this with elemental H:

![H Energy Level Diagram](onsemiconductors/henergylevaldiagram.png)

There are a number of things that can excite an electron to higher energy states like thermal energy, electromagnetic radiation (which I'll call light from here on out, not necessarilly visible) and kinetic energy. When it comes to semiconductors we are particularly interested in light and heat. If you were to fire a photon at a H atom with sufficent energy you would momentarily promote the ground state electron to a higher energy level, after which it would drop back down emmiting a photon of the same energy as the difference between the energy levels. So for example lets say we fired a photon at atomic H:

![H Light Promotion](hlightpromotion.png)

