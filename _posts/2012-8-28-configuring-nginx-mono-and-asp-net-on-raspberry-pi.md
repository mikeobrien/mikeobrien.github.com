---
layout: post
title: Setting up nginx, Mono and ASP.NET on the RaspberryPi
tags: [RaspberryPi, Mono, ASP.NET]
---

**UPDATE: Much of this post is no longer valid with the [new Raspbian image](http://www.raspberrypi.org/downloads). For example the steps in the Initial Setup section are now automated in the initial setup screen. Also wheezy ships with a newer version of mono, so depending on your needs, there may no longer be a need to download and compile the latest source.**


Thanks to the all the sources on the interwebs for help compiling these steps. These instructions assume you're running Debian image on your pi. If you havent set that up see [here](http://www.raspberrypi.org/downloads) for further instructions. 

### Initial Setup ###
--------

Once you have written the image to your sd card and inserted it, plugin the pi to a display, keyboard, ethernet and usb power. Login using the default creds pi/raspberry. 

First we need to resize the root partition to fill the SD card as the default size of 1.6Gb is not big enough (You'll need ~2.5Gb total, some of which you can delete after the install). 

```bash
sudo fdisk -uc /dev/mmcblk0
```
    
* Type `p<enter>` for a list of partitions and note the start of the `Linux` partition (i.e. 157696). 
* Delete the `Linux` and `Linux swap...` partitions by pressing `d<enter>` and the partition number `#<enter>`, in this case 2 and 3.
* Create a new partition by pressing `n<enter>` of type primary, `p<enter>`. This will be partition 2, `2<enter>` starting at the location of the `Linux` partition you noted earlier `1234<enter>`. When prompted for the last sector press `<enter>` to accept the default which is the remaining space on the SD card.
* Type `w<enter>` to save.

Now reboot, resize the partition and reboot once more and verify the new size:

```bash
sudo reboot
sudo resize2fs /dev/mmcblk0p2
sudo reboot
df -h
```

The following commands set the time zone, password and enable ssh:

```bash
dpkg-reconfigure tzdata
```
