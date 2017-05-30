#!/bin/bash

RUNTIME=websdr_controller_edison.js
BROWSER=chromium
START_FREQ="${1:-198}"
START_MODE="${2:-am}"
URL=http://websdr.ewi.utwente.nl:8901/?tune=${START_FREQ}${START_MODE}

# Setup broweser in headless mode
$BROWSER --headless --disable-gpu --remote-debugging-port=9222 ${URL}&
PID=$!
# Start WebSDR controller

node ${RUNTIME} ${START_FREQ} ${START_MODE}

kill $PID
