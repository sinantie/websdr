'use strict';
const CDP = require('chrome-remote-interface');
const mraa = require('mraa');
//var edison = require('./node_modules/edison-oled/build/Release/edisonnodeaddon');
var keypress = require('keypress');
var verbose = true;
var delay = 50;

CDP((client) => {
	
	function killClient() {
		client.close();
	}
	
	var args = process.argv;
	if(args.length != 4) {
		console.log("Invalid execution: node websdr_controller_edison.js freq mode");
		killClient();
	} else {
		var MAX_STEP = 3;
		var step = 1;
		var currentMode = args[3];
		var currentFrequency = parseFloat(args[2]);
		const bands = [142, 522, 1800, 3500, 7000, 10100, 14000, 18068, 21000, 24890, 28000];
		const modes = ['cw', 'lsb', 'usb', 'am', 'fm', 'amsync'];
		var currentBand = 0;
		var currentModeId = 3;
		var btnUp, btnDown, btnLeft, btnRight, btnSelect, btnA, btnB;

		function debounce(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		};


		function initOled() {

		}

		function initButtons() {
			btnUp = initButton(46, freqUp);
			btnDown = initButton(31, freqDown);
			btnLeft = initButton(15, stepLeft);
			btnRight = initButton(45, stepRight);
			btnSelect = initButton(33, nextMode);
			btnA = initButton(47, bandUp);
			btnB = initButton(32, bandDown);
		}
	
		function deregisterButtons() {
			btnUp.isrExit();
			btnDown.isrExit();
			btnLeft.isrExit();
			btnRight.isrExit();
			btnSelect.isrExit();
			btnA.isrExit();
			btnB.isrExit();
		}

		function initButton(pinIn, callback) {
			let btn = new mraa.Gpio(pinIn);
			btn.dir(mraa.DIR_IN);
			btn.isr(mraa.EDGE_RISING, callback);
			return btn;
		}

		function intro() {
			console.log("Step up ['u'] / down ['d'].\nStep size: 1 ['q'], 2 ['w'], 3 ['e'].\nBand down: ['k'], Band up: ['l']\nMode: CW ['z'], LSB ['x'], USB ['c'], AM ['v'], FM ['b'], AMSync ['n'].\nCtrl^C to exit.")
			getFrequency();
			getMode();
		}
		
		function addKeyPressListener() {
			// make `process.stdin` begin emitting "keypress" events 
			keypress(process.stdin);
			// listen for the "keypress" event 
			process.stdin.on('keypress', keyPressEvent);
			process.stdin.setRawMode(true);
			process.stdin.resume();
		}

		function changeStep(stepIn) {
			step = stepIn;
			if(verbose)
				console.log('step = ' + step);
		}

		function changeFreq(up, step) {
			var str = up ? '+' : '-';
			client.send('Runtime.evaluate', {'expression': 'freqstep(' + str + step + '); nominalfreq();'}, (error, response) => {
				if(error) {
					console.log(error);
					return;
				}
				currentFrequency = response.result.value;
				getFrequency();
			});
			//if(verbose)
			//	console.log('stepped ' + (up ? 'up' : 'down'));
		}
		
		function setFreq(freq) {
			client.send('Runtime.evaluate', {'expression': 'setfreq(' + freq + '); nominalfreq();'}, (error, response) => {
				if(error) {
					console.log(error);
					return;
				}
				currentFrequency = response.result.value;
				getFrequency();
			});
		}

		function setBand(up) {
			if(up) {
				currentBand += 1;
				currentBand = currentBand >= bands.length ? 0 : currentBand;
			} else {
				currentBand -= 1;
				currentBand = currentBand < 0 ? bands.length - 1 : currentBand;
			}
			setFreq(bands[currentBand]);
		}
		
		function setMode(mode) {
				client.send('Runtime.evaluate', {'expression': 'set_mode(\'' + mode + '\'); nominalfreq();'}, (error, response) => {
				if(error) {
					console.log(error);
					return;
				}
				currentFrequency = response.result.value;
				getFrequency();
			});
			currentMode = mode;
			getMode();
		}
		
		function queryFrequency() {
			client.send('Runtime.evaluate', {'expression': 'nominalfreq()'}, (error, response) => {
				if(error) {
					console.log(error);
					return;
				}
				currentFrequency = response.result.value;
			});
		}

		function getFrequency() {
			console.log('Frequency = ' + parseFloat(currentFrequency).toFixed(3) + 'kHz');
		}

		function getMode() {
			console.log('Mode = ' + currentMode);
		}

		function keyPressEvent(ch, key) {
			//console.log('got "keypress"', key);
			if (key && key.name == 'u') {
				freqUp();
			}
			else if (key && key.name == 'd') {
				freqDown();
			}
			else if(key && key.name == 'q') {
				changeStep(1);
			}
			else if(key && key.name == 'w') {
				changeStep(2);
			}
			else if(key && key.name == 'e') {
				changeStep(3);
			}
			else if(key && key.name == 'z') {
				setMode('cw');
				//queryFrequency();
			}
			else if(key && key.name == 'x') {
				setMode('lsb');
			}
			else if (key && key.ctrl && key.name == 'c') {
				process.stdin.pause();
				deregisterButtons();
				killClient();
			}
			else if(key && key.name == 'c') {
				setMode('usb');
			}
			else if(key && key.name == 'v') {
				setMode('am');
			}
			else if(key && key.name == 'b') {
				setMode('fm');
			}
			else if(key && key.name == 'n') {
				setMode('amsync');
			}
			else if(key && key.name == 'k') {
				bandDown();
			}
			else if(key && key.name == 'l') {
				bandUp();
			}
			//		getFrequency();
		}

		function freqUp() = debounce(function() {
			changeFreq(true, step);
		}, delay);

		function freqDown() = debounce(function() {
			changeFreq(false, step);
		}, delay);
		
		function stepLeft() = debounce(function() {
			step = step - 1;
			step = step < 1 ? MAX_STEP : step;
			changeStep(step);
		}, delay);

		function stepRight() = debounce(function() {
			step = step + 1;
			step = step > MAX_STEP ? 1 : step;
			changeStep(step);
		}
		
		function nextMode() = debounce(function() {
			currentModeId += 1;
			currentModeId = currentModeId >= modes.length ? 0 : currentModeId;
			currentMode = modes[currentModeId];
			setMode([currentMode]);
		}, delay);

		function bandUp() = debounce(function() {
			setBand(true);
		}, delay);
		
		function bandDown() = debounce(function() {
			setBand(false);
		}, delay);

		addKeyPressListener();
		intro();
		
		initOled();
		initButtons();
	}
});
