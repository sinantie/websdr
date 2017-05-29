const CDP = require('chrome-remote-interface');
var keypress = require('keypress');
var verbose = true;
var delay = 50;

CDP((client) => {
	
	function killClient() {
		client.close();
	}
	
	var args = process.argv;
	if(args.length != 4) {
		killClient();
	} else {
		var step = 1;
		var currentMode = args[3];
		var currentFrequency = parseFloat(args[2]);
		const bands = [198, 530, 1800, 3500, 7000, 10100, 14000, 18068, 21000, 24890, 28000];
		var currentBand = 0;
		function intro() {
			console.log("Step up ['u'] / down ['d'].\nStep size: 1 ['q'], 2 ['w'], 3 ['e'].\nBand down: ['k'], Band up: ['l']\nMode: CW ['z'], LSB ['x'], USB ['c'], AM ['v'], FM ['b'], AMSync ['n'].\nCtrl^C to exit.")
			getFrequency();
			getMode();
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
				bandUp();
			}
			else if(key && key.name == 'l') {
				bandDown();
			}
			//		getFrequency();
		}
		
		var freqUp = debounce(function() {
			changeFreq(true, step);
		}, delay);
		
		var freqDown = debounce(function() {
			changeFreq(false, step);
		}, delay);

		function bandUp() {
			setBand(true);
		}
		
		function bandDown() {
			setBand(false);
		}

		addKeyPressListener();
		intro();
	}
});
