# WebSDR Client for Intel Edison
This is a simple client for [WebSDR](http://websdr.ewi.utwente.nl:8901/) designed for [Intel Edison](https://software.intel.com/en-us/iot/hardware/edison) and the [Sparkfun OLED screen](https://www.sparkfun.com/products/13035) with button controls. Streamed audio is played back via a USB audio interface. The implementation is based on [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface), and a browser that implements the [Chrome Debugging Protocol](https://chromedevtools.github.io/devtools-protocol/) (currently tested with Google Chrome, Chromium and Google Chrome Canary).

## Requirements and Installation
- Flash [Jubilinux for Edison: Debian Jessie](http://www.jubilinux.org/) to Intel Edison following the instructions [here](https://learn.sparkfun.com/tutorials/loading-debian-ubilinux-on-the-edison) (they are originally for Ubilinux but should apply for Jubilinux as well). We have only tested v0.1.1 (Snapshot 04-Apr-2017).

The following instructions assume that you are connected to your Edison using an SSH client.

- First, you should make sure audio is played back properly to the USB audio interface. Install the ALSA drivers and utilities:
```
 apt-get install alsa-utils
 ```
 Most likely the USB audio interface is not pre-selected as the default audio output, so we need to change `/etc/asound.conf` accordindgly. 
Identify first what is the card id assigned to the USB audio interface (below is just an example):
 ```
$ aplay -l  
**** List of PLAYBACK Hardware Devices ****  
card 0: Loopback [Loopback], device 0: Loopback PCM [Loopback PCM]  
  Subdevices: 8/8  
  Subdevice #0: subdevice #0  
  Subdevice #1: subdevice #1  
  Subdevice #2: subdevice #2  
  Subdevice #3: subdevice #3  
  Subdevice #4: subdevice #4  
  Subdevice #5: subdevice #5  
  Subdevice #6: subdevice #6  
  Subdevice #7: subdevice #7  
card 0: Loopback [Loopback], device 1: Loopback PCM [Loopback PCM]  
  Subdevices: 8/8  
  Subdevice #0: subdevice #0  
  Subdevice #1: subdevice #1  
  Subdevice #2: subdevice #2  
  Subdevice #3: subdevice #3  
  Subdevice #4: subdevice #4  
  Subdevice #5: subdevice #5  
  Subdevice #6: subdevice #6  
aplay -l  Subdevice #7: subdevice #7  
card 1: dummyaudio [dummy-audio], device 0: 14 []  
  Subdevices: 1/1  
  Subdevice #0: subdevice #0  
card 2: Device [USB Audio Device], device 0: USB Audio [USB Audio]  
  Subdevices: 0/1  
  Subdevice #0: subdevice #0  
 ```
According to the above listing, card 2 points to the USB audio interface, so let's make the change to `/etc/asound.conf`:
```
pcm.!default {  
type hw  
card 2  
device 0  
}  
```
Try playing an audio file via `aplay audio_file.wav`; you should be able to hear now audio coming from the headphone or line out of the audio interface.

- Next, install [Chromium](https://www.chromium.org/Home). We have tested only Chromium 57.0.2987.98.
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
- Next, get [npm](https://www.npmjs.com/) in order to install the dependencies for the client. We have tested only v3.10.10.
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

Simply run on your Edison:
```
./websdr.sh [websdr_server_url] [frequency] [mode]
``` 
`websdr_server_url` should be the url of a WebSDR server, such as one listed [here](http://websdr.org/), `frequency` is the frequency to instruct the server to tune on, and `mode` is one of `cw, lsb, usb, am, fm, amsync`.
A splash screen should show up for a few seconds and then you should see the main screen. If you don't want to input any parameters every time, you can also pre-define them from inside `websdr.sh` script, be setting the appropriate values to `URL, START_FREQ` and `START_MODE` parameters.

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
If you want to make the client start automatically when you boot Edison, follow these steps (adapted from Stepanie Moyerman's blog [post](http://stephaniemoyerman.com/?p=41)):
- Disable the keyboard event listener by commenting out the following line in `websdr_controller_edison.js`:
```
.
.
.
intro();
// addKeyPressListener();  <--- (line 330)
		
startScreen();
sleep(sleepTime);
if(verbose) {
	console.log('--show main screen');
}
setFreq(currentFrequency);
printStatus();
initButtons();
.
.
.
```
- Create a shell script in `/etc/init.d`, by calling it something like `start_websdr.sh` and add the following (make sure you enter the correct path to where you have cloned the client into, and the parameters for the starting script; see above for details):
```
#!/bin/sh

### BEGIN INIT INFO
# Provides:   start_websdr
# Required-Start:    
# Required-Stop:     
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: starts the websdr client
### END INIT INFO
cd path_to_where_websdr_client_is_installed
./websdr.sh websdr_server_url start_freq start_mode
```
- Make the script you have just made executable via `chmod +x start_websdr.sh`
- Finally, make sure the script is executable every time linux boots:
```
$ cd /etc/init.d/
$ update-rc.d start_websdr.sh defaults
```
