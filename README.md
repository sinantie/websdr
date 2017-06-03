# WebSDR Client for Intel Edison
This is a simple client for [WebSDR](http://websdr.ewi.utwente.nl:8901/) designed for [Intel Edison](https://software.intel.com/en-us/iot/hardware/edison) and the [Sparkfun OLED screen](https://www.sparkfun.com/products/13035) with button controls. The implementation is based on [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface), and a browser that implements the [Chrome Debugging Protocol](https://chromedevtools.github.io/devtools-protocol/) (currently tested with Google Chrome, Chromium and Google Chrome Canary).

## Requirements and Installation
- Flash [Jubilinux for Edison: Debian Jessie](http://www.jubilinux.org/) to Intel Edison following the instructions [here](https://learn.sparkfun.com/tutorials/loading-debian-ubilinux-on-the-edison) (they are originally for Ubilinux but should apply for Jubilinux as well). We have only tested v0.1.1 (Snapshot 04-Apr-2017).

The following instructions assume that you are connected to your Edison using an SSH client.

- First, install [Chromium](https://www.chromium.org/Home). We have tested only Chromium 57.0.2987.98.
```
apt-get install chromium
```
The version should be 57.0.2987.98.
```
$ chromium --version
Chromium 57.0.2987.98 Built on 8.7, running on Debian 8.8
```
- You will also need [NodeJs](https://nodejs.org/). We have tested the client using v6.10.3.
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
```
- Next get [npm](https://www.npmjs.com/) in order to install the dependencies for the client. We have tested only v3.10.10.
```
apt-get install npm
```
- Then get [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)
```
npm install chrome-remote-interface  
```
- Install the mraa libraries for Jubilinux following the instructions [here](https://learn.sparkfun.com/tutorials/installing-libmraa-on-ubilinux-for-edison).

- Get the Edison OLED drivers and Javascript ports from the npm repository.
```
npm install edison-oled --unsafe-perm
```
- Download [keypress](https://www.npmjs.com/package/keypress), a keyboard event handling code, which is useful for debugging, as well as for interacting with `websdr_controller_keys.js`, the non-Edison client that runs locally from Linux/Mac OS X.
```
npm install keypress
```
- Finally clone the websdr client code, making sure you install on the same directory level as `node_modules`. You should be good to go!

## Execution

Simply run on your Edison.
```
./websdr.sh [frequency] [mode]
``` 
A splash screen should show on Edison for a few seconds and then you should see the main screen. If you don't input any parameters, you should start listening to the pre-defined default station (BBC Radio 4 on 198am) streaming remotely from the station at UTwente. You can change the default WebSDR server by changing the `URL` parameter in the `websdr.sh` script. 

You can control the client by changing the frequency, using the up/down buttons on the joystick, left/right buttons for changing the frequency step (+:0.1kHZ, ++:1kHz, +++:2.5/9kHz depending on the mode), select button for changing the mode (CW, LSB, USB, AM, FM, AMsync), A/B buttons (on the right) for changing the bands (LW, MW, 160m, 80m, 40m, 30m, 20m, 18m, 15m, 12m, 10m).
The same frequency, step, mode, and band info should appear on your terminal too.

You can use your keyboard to control the client from the terminal as well: 
Frequency down ['j'] / up ['k'].
Step size down: ['h'] / up ['l'].
Band down: ['i'], Band up: ['o'].
Change Mode: ['m'].
Ctrl^C to exit.

You can also run the websdr client from your laptop (Ubuntu Linux 16.04 / Mac OS X tested only), by changing the `RUNTIME` parameter in the `websdr.sh` script to:
```
RUNTIME=websdr_controller_keys.js
```

## Autostart
TBC

