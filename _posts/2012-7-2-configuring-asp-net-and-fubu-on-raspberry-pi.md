---
published: false
layout: mdpost
title: Setting up ASP.NET and FubuMVC on the RaspberryPi
tags: [RaspberryPi, Mono, ASP.NET, FubuMVC]
---

These instructions assume you're running Debian Squeeze on your pi. If you havent set that up see [here](http://www.raspberrypi.org/downloads) for further instructions. 

### Initial Setup ###
--------

Once you have written the image to your sd card and inserted it, plugin the pi to a display, keyboard, ethernet and usb power. Login using the default creds pi/raspberry. The following commands set the password and enable ssh:

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

    shutdown -r now

You can now unplug your display and keyboard and ssh into the pi. You may want to setup a hosts record on your machine so you don't have to remember the ip address.

### Installing Apache ###
-------