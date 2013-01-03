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

You'll want to either setup a static DHCP lease on your DHCP server or configure a static ip on the pi. The following command displays the network interface (and the mac address) if you want to setup a static DHCP lease:

```bash
ifconfig -a
```
    
Or the following command allows you to set a static ip:

```bash
sudo vi /etc/network/interfaces
```
    
Change this:

    iface eth0 inet dhcp
    
To this (with your settings):

```ini
iface eth0 inet static
address 192.168.1.100
netmask 255.255.255.0
network 192.168.1.0
broadcast 192.168.1.255
gateway 192.168.1.254
```

Now restart:

```bash
sudo reboot
```

You can now unplug your display and keyboard and ssh into the pi. You may want to setup a hosts record on your machine so you don't have to remember the ip address.

### Installing nginx ###
-------

To install nginx you'll need to to first update apt-get. Next install the nginx package, make the web root dir and add the group account:

```bash
apt-get update
apt-get install nginx
sudo mkdir /var/www
sudo groupadd www-data
```

Edit the default site configuration:

```bash
sudo vi /etc/nginx/sites-enabled/default
```

Next disable ipv6 (By commenting out the line), also set the site domain name:

```ini
...
server {
    ...
    #listen   [::]:80 default ipv6only=on; ## listen for ipv6
    
    server_name www.mysite.com;
    ...
}
...
```
    
Start the web server:
    
```bash
sudo service nginx start
```
    
Create a test page:

```bash
sudo vi /var/www/index.html
```
    
If all is well you should see your test page.

### Installing mono ###
-------

Unfortunately [the latest version of mono isn't available for squeeze](http://mono-project.com/DistroPackages/Debian), which at the time of writing is the latest stable version of debian. The official squeeze mono package is version 2.6.7 [which is equivilent to .NET 3.5](http://en.wikipedia.org/wiki/Mono_%28software%29#History). Subsequent debian versions (i.e. wheezy and sid) will ship with an oficial mono package of version 2.10.8.1 which is equivilent to .NET 4.0. So if the pi image you installed is wheezy or higher or you don't mind running the older version of mono you can just use `sudo apt-get install mono-complete`. Otherwise if you're on squeeze and want to run the latest version of mono we'll have to grab the source and compile it (Which will take ~8 hours) or download the precompiled version.

First install the prerequsites:

```bash
apt-get install gcc libtool bison pkg-config libglib2.0-dev gettext make bzip2 g++ autoconf automake
```

a) Either download the precompiled version:

```bash
wget https://github.com/downloads/mikeobrien/pidev/mono-2.10.8-compiled-pi.tar.bz2
tar xvjf mono-2.10.8-pi-compiled.tar.bz2; cd mono-2.10.8
make install
cd ..; rm -rf mono-2.10.8; rm mono-2.10.8-pi-compiled.tar.bz2
```

b) Or compile yourself:

```bash
wget http://origin-download.mono-project.com/sources/mono/mono-2.10.8.tar.bz2
tar xvjf mono-2.10.8.tar.bz2; cd mono-2.10.8
./configure --prefix=/usr/local; make; make install
cd ..; rm -rf mono-2.10.8; rm mono-2.10.8.tar.bz2
```

Then verify the installation:

```bash
mono --version
```

### Configuring ASP.NET ###
-------

First you will need to install the mono FastCGI server. As mentioned earlier, the official debian squeeze package is a bit old. If your ok with this or if you are running debian wheezy or higher you can just do `sudo apt-get install mono-fastcgi-server2`. Otherwise you will have to build and install from scratch as follows:

```bash
wget http://origin-download.mono-project.com/sources/xsp/xsp-2.10.2.tar.bz2
tar xvjf xsp-2.10.2.tar.bz2; cd xsp-2.10.2
./configure --prefix=/usr/local; make; make install
cd ..; rm -rf xsp-2.10.2; rm xsp-2.10.2.tar.bz2
```
    
Then we need to setup FastCGI in the default nginx website:

```bash
sudo vi /etc/nginx/sites-enabled/default
```

By adding the highlighted configuration:

<pre><code>...
server {
    ...
    location / {
        root   /var/www;
        index  index.html index.htm <b>index.aspx</b>;
        <b>fastcgi_index index.aspx;
        fastcgi_pass 127.0.0.1:9000;
        include /etc/nginx/fastcgi_params;</b>
    }
    ...
}
...
</code></pre>

Next we need modify the FastCGI config file:

```bash
sudo vi /etc/nginx/fastcgi_params
```

By adding these lines to the end of the file:

```ini
# ASP.NET
fastcgi_param PATH_INFO           "";
fastcgi_param SCRIPT_FILENAME     $document_root$fastcgi_script_name;
```

Now we will need to download the mono FastCGI startup script (Complements of [Tomas Bosak](http://yojimbo87.github.com)) and install it:

```bash
wget -P /etc/init.d/ https://github.com/downloads/mikeobrien/pidev/monoserve
chmod +x /etc/init.d/monoserve
update-rc.d monoserve defaults
```
    
Edit the FastCGI startup script:

```bash
sudo vi /etc/init.d/monoserve
```

And set the domain name you set in the nginx site configuration (Highlighted below):

<pre><code>...
WEBAPPS="<b>www.mysite.com</b>:/:/var/www/"
...
</code></pre>

Note: The FastCGI startup script is set to use fastcgi-mono-server4. This would need to be adjusted if you are using older or future versions of mono.

Delete the static file you created earier and create an asp.net file:

```bash
rm /var/www/index.html
sudo vi /var/www/index.aspx
```
    
With some dynamic content:

```aspx-cs
Hello, the time is <%= System.DateTime.Now %>.
```
    
Start the service and make sure the page works:

```bash
sudo service monoserve start
```
    
### Next steps ###
-------

In my next installment we'll get [FubuMVC](http://mvc.fubu-project.org/) running on the pi.

