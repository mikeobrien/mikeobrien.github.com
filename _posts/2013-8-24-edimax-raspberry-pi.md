---
published: true
layout: post
title: Setting up the Edimax Nano on the Raspberry Pi
tags: [RaspberryPi]
---

Finally got the [Edimax Nano (EW-7811Un)](http://www.amazon.com/Edimax-EW-7811Un-Wireless-Adapter-Wizard/dp/B003MTTJOY) setup on my Raspberry Pi. Last year I could not get it working but it appears that newer versions of the Raspbian Wheezy image might have simplifed the config. The following instructions worked with the 7/26/2013 Raspbian image (can't speak for older or newer versions) and WPA (Did not try it for WPA2).

- Plug in the adapter and reboot.
- Check that the device is showing up (Note the last entry):

```bash
pi@raspberrypi ~ $ lsusb
Bus 001 Device 002: ID 0424:9512 Standard Microsystems Corp. 
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 003: ID 0424:ec00 Standard Microsystems Corp. 
Bus 001 Device 004: ID 7392:7811 Edimax Technology Co., Ltd EW-7811Un 802.11n Wireless Adapter [Realtek RTL8188CUS]
```

- Edit the /etc/network/interfaces file as follows and reboot:

```bash
auto lo

iface lo inet loopback
iface eth0 inet dhcp

auto wlan0
allow-hotplug wlan0
iface wlan0 inet dhcp
wpa-ssid "my ssid"
wpa-psk "my wifi password"
```

- See if you're connected and getting an IP, a blue light should be flashing on the adapter:

```bash
pi@raspberrypi ~ $ ifconfig wlan0
wlan0     Link encap:Ethernet  HWaddr 80:1f:02:70:7d:b1  
          inet addr:192.168.1.104  Bcast:192.168.1.255  Mask:255.255.255.0
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:911 errors:0 dropped:1014 overruns:0 frame:0
          TX packets:444 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:123537 (120.6 KiB)  TX bytes:74644 (72.8 KiB)
```

**Troubleshooting**

- See if you can scan for available networks, if so you might have your ssid or password set incorrectly:

```bash
pi@raspberrypi ~ $ sudo iwlist wlan0 scan
wlan0     Scan completed :
          Cell 01 - Address: 08:60:6E:E8:DD:64
                    ESSID:"dagobah"
                    Protocol:IEEE 802.11bgn
                    Mode:Master
                    Frequency:2.437 GHz (Channel 6)
                    Encryption key:on
...
```

- Try plugging the adapter into the other USB port on the pi. Was having a terrible time getting it to work, did this and voila!
- Make sure you are plugged into a powered hub. I guess this can be a problem as the adapter draws more current than some ports can provide. If you don't see the blue light flashing on the adapter this might be the issue.
- Hit the [pi add-ons forum](http://www.raspberrypi.org/phpBB3/viewforum.php?f=45). And don't ask me in the comments because I'm just as clueless as you.