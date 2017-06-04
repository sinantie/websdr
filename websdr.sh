#!/bin/bash

RUNTIME=websdr_controller_edison.js
BROWSER=chromium
START_FREQ="${2:-198}"
START_MODE="${3:-am}"
URL=${1}/?tune=${START_FREQ}${START_MODE}

# Setup broweser in headless mode
$BROWSER --headless --disable-gpu --remote-debugging-port=9222 ${URL}&
PID=$!
# Start WebSDR controller

node ${RUNTIME} ${START_FREQ} ${START_MODE}

kill $PID
