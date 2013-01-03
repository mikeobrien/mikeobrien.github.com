---
layout: post
title: Setting up nginx, Mono and ASP.NET on the RaspberryPi
tags: [RaspberryPi, Mono, ASP.NET]
---

### UPDATE: Much of this post is no longer valid with the [new Raspbian image](http://www.raspberrypi.org/downloads). For example the steps in the Initial Setup section are now automated in the initial setup screen. Also wheezy ships with a newer version of mono, so depending on your needs, there may no longer be a need to download and compile the latest source. 

Thanks to the all the sources on the interwebs for help compiling these steps. These instructions assume you're running Debian image on your pi. If you havent set that up see [here](http://www.raspberrypi.org/downloads) for further instructions. 

### Initial Setup ###
--------

Once you have written the image to your sd card and inserted it, plugin the pi to a display, keyboard, ethernet and usb power. Login using the default creds pi/raspberry. 

First we need to resize the root partition to fill the SD card as the default size of 1.6Gb is not big enough (You'll need ~2.5Gb total, some of which you can delete after the install). 

```bash
sudo fdisk -uc /dev/mmcblk0
```
    
