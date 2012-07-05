---
published: false
layout: post
title: Setting up nginx, ASP.NET and FubuMVC on the RaspberryPi
tags: [RaspberryPi, Mono, ASP.NET, FubuMVC]
---

Thanks to the various sources on the interwebs for help compiling these steps.

These instructions assume you're running Debian image on your pi. If you havent set that up see [here](http://www.raspberrypi.org/downloads) for further instructions. 

### Initial Setup ###
--------

Once you have written the image to your sd card and inserted it, plugin the pi to a display, keyboard, ethernet and usb power. Login using the default creds pi/raspberry. 

First we need to resize the root partition to fill the SD card as the default size of 1.6Gb is not big enough (You'll need ~2.5Gb total, some of which you can delete after the install). 

    sudo fdisk -uc /dev/mmcblk0
    
* Type `p<enter>` for a list of partitions and note the start of the `Linux` partition (i.e. 157696). 
* Delete the `Linux` and `Linux swap...` partitions by pressing `d<enter>` and the partition number `#<enter>`, in this case 2 and 3.
* Create a new partition by pressing `n<enter>` of type primary, `p<enter>`. This will be partition 2, `2<enter>` starting at the location of the `Linux` partition you noted earlier `1234<enter>`. When prompted for the last sector press `<enter>` to accept the default which is the remaining space on the SD card.
* Type `w<enter>` to save.

Now reboot, resize the partition and reboot once more and verify the new size:

    sudo reboot
    sudo resize2fs /dev/mmcblk0p2
    sudo reboot
    df -h

The following commands set the time zone, password and enable ssh:

    dpkg-reconfigure tzdata

    passwd
    
    sudo mv /boot/boot_enable_ssh.rc /boot/boot.rc

You'll want to either setup a static DHCP lease on your DHCP server or configure a static ip on the pi. The following command displays the network interface (and the mac address) if you want to setup a static DHCP lease:

    ifconfig -a
    
Or the following command allows you to set a static ip:

    sudo vi /etc/network/interfaces
    
Change this:

    iface eth0 inet dhcp
    
To this (with your settings):

    iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    network 192.168.1.0
    broadcast 192.168.1.255
    gateway 192.168.1.254

Now restart:

    sudo reboot

You can now unplug your display and keyboard and ssh into the pi. You may want to setup a hosts record on your machine so you don't have to remember the ip address.

### Installing nginx ###
-------

To install nginx you'll need to to first update apt-get. Next install the nginx package, make the web root dir and add the group account:

    apt-get update
    apt-get install nginx
    sudo mkdir /var/www
    sudo groupadd www-data
    
Disable ipv6 on the default site by commenting out this line: `listen [::]:80 default ipv6only=on;`:

    sudo vi /etc/nginx/sites-enabled/default
    
Start the web server:
    
    sudo service nginx start
    
Create a test page:

    vi /var/www/index.html
    
If all is well you should see your test page.

### Installing mono ###
-------

Unfortunately [the latest version of mono isn't available for squeeze](http://mono-project.com/DistroPackages/Debian), which at the time of writing is the latest stable version of debian. The official squeeze mono package is version 2.6.7 [which is equivilent to .NET 3.5](http://en.wikipedia.org/wiki/Mono_(software)#History). Subsequent versions (i.e. wheezy and sid) will ship with an oficial mono package of version 2.10.8.1 which is equivilent to .NET 4.0. So if the pi image you installed is wheezy or higher or you don't mind running the older version of mono you can just use `sudo apt-get install mono-complete`. Otherwise if you're on squeeze and want to run the latest version of mono we'll have to grab the source and compile it (Which will take ~8 hours) or download the precompiled version.

First install the prerequsites:

    apt-get install gcc libtool bison pkg-config libglib2.0-dev gettext make bzip2 g++ autoconf automake

a) Either download the precompiled version:

    wget http://...mono-2.10.8-pi-compiled.tar.bz2
    tar xvjf mono-2.10.8-pi-compiled.tar.bz2; cd mono-2.10.8
    make install
    cd ..; rm -rf mono-2.10.8; rm mono-2.10.8-pi-compiled.tar.bz2

b) Or compile yourself:

    wget http://origin-download.mono-project.com/sources/mono/mono-2.10.8.tar.bz2
    tar xvjf mono-2.10.8.tar.bz2; cd mono-2.10.8
    ./configure --prefix=/usr/local; make; make install
    cd ..; rm -rf mono-2.10.8; rm mono-2.10.8.tar.bz2

Then verify the installation:

    mono --version

### Configuring ASP.NET ###
-------