const CDP = require('chrome-remote-interface');
var keypress = require('keypress');
var verbose = true;
var delay = 10;

function printError(message) {
	console.log("Err: " + meesage);
}

CDP((client) => {
	
	function killClient() {
		client.close();
	}
	
	var args = process.argv;
	if(args.length != 4) {
		printError("Invalid execution: node websdr_controller_edison.js freq mode");
		killClient();
	} else {
		var MAX_STEP = 3;
		var step = 1;
		var currentMode = args[3];
		var currentFrequency = parseFloat(args[2]);
		const bands = [153, 522, 1800, 3500, 7000, 10100, 14000, 18068, 21000, 24890, 28000];
		const bandNames = ['LW', 'MW', '160m', '80m', '40m', '30m', '20m', '18m', '15m', '12m', '10m'];
		const modes = ['cw', 'lsb', 'usb', 'am', 'fm', 'amsync'];
		const modeNames = ["CW", "LSB", "USB", "AM", "FM", "AM's"];
		var currentBand = 0;
		var currentModeId = 3;

		function intro() {
			console.log("Frequency down ['j'] / up ['k'].\nStep size down: ['h'] / up ['l'].\nBand down: ['i'], Band up: ['o'].\nChange Mode: ['m'] {CW, LSB, USB, AM, FM, AMSync}.\nCtrl^C to exit.");
			printStatus();
		}
		
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
			printStatus();
		}

		function changeFreq(up, step) {
			var str = up ? '+' : '-';
			client.send('Runtime.evaluate', {'expression': 'freqstep(' + str + step + '); nominalfreq();'}, (error, response) => {
				if(error) {
					printError(error);
					return;
				}
				currentFrequency = response.result.value;
				printStatus();
			});
			//if(verbose)
			//	console.log('stepped ' + (up ? 'up' : 'down'));
		}

		function setFreq(freq) {
			client.send('Runtime.evaluate', {'expression': 'setfreq(' + freq + '); nominalfreq();'}, (error, response) => {
				if(error) {
					printError(error);
					return;
				}
				currentFrequency = response.result.value;
				printStatus();
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
					printError(error);
					return;
				}
				currentFrequency = response.result.value;
				printStatus();
			});
			currentMode = mode;
		}

		function queryFrequency() {
			client.send('Runtime.evaluate', {'expression': 'nominalfreq()'}, (error, response) => {
				if(error) {
					printError(error);
					return;
				}
				currentFrequency = response.result.value;
			});
		}

		function printStatus() {
			let currentModeName = modeNames[currentModeId];
			let currentBandName = bandNames[currentBand];
			let currentStepStr = step == 1 ? "+" : (step == 2 ? "++" : "+++");
			console.log('Frequency: ' + parseFloat(currentFrequency).toFixed(3) + 'kHz, Band: ' + currentBandName + ', Mode: ' + currentModeName + ', Step: ' + currentStepStr);
		}

		function keyPressEvent(ch, key) {
			//console.log('got "keypress"', key);
			if (key && key.name == 'k') {
				freqUp();
			}
			else if (key && key.name == 'j') {
				freqDown();
			}
			else if(key && key.name == 'h') {
				stepLeft();
			}
			else if(key && key.name == 'l') {
				stepRight();
			}
			else if(key && key.name == 'o') {
				bandUp();
			}
			else if(key && key.name == 'i') {
				bandDown();
			}
			else if(key && key.name == 'm') {
				nextMode();
				//queryFrequency();
			}
			else if (key && key.ctrl && key.name == 'c') {
				process.stdin.pause();
				killClient();
			}
		}
		
		var freqUp = debounce(function() {
			changeFreq(true, step);
		}, delay);
		
		var freqDown = debounce(function() {
			changeFreq(false, step);
		}, delay);
		
		var stepLeft = debounce(function() {
			step = step - 1;
			step = step < 1 ? MAX_STEP : step;
			changeStep(step);
		}, delay);

		var stepRight = debounce(function() {
			step = step + 1;
			step = step > MAX_STEP ? 1 : step;
			changeStep(step);
		}, delay);
		
		var nextMode = debounce(function() {
			currentModeId += 1;
			currentModeId = currentModeId >= modes.length ? 0 : currentModeId;
			currentMode = modes[currentModeId];
			setMode([currentMode]);
		}, delay);

		var bandUp = debounce(function() {
			setBand(true);
		}, delay);
		
		var bandDown = debounce(function() {
			setBand(false);
		}, delay);

		addKeyPressListener();
		intro();
	}
}).on('error', (err) => {
  // cannot connect to the remote endpoint
  printError(err);
});
