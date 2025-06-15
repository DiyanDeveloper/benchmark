// tools.js

// NETWORK SPEED TEST (Download simulation)
async function runNetworkTest() {
  const output = document.getElementById('networkResult');
  output.textContent = 'Running network speed test...';

  try {
    // Download a random small image multiple times to simulate speed
    const url = 'https://speed.hetzner.de/100MB.bin'; // Public test file, can change to smaller if needed
    const start = performance.now();
    // Fetch first 1MB chunk only (range header)
    const response = await fetch(url, { headers: { Range: 'bytes=0-1048575' } });
    const blob = await response.blob();
    const end = performance.now();

    const sizeMB = blob.size / (1024 * 1024);
    const durationSec = (end - start) / 1000;
    const speedMbps = (sizeMB * 8) / durationSec;

    output.textContent = `Download: ${sizeMB.toFixed(2)} MB in ${durationSec.toFixed(2)} s (~${speedMbps.toFixed(2)} Mbps)`;
  } catch (e) {
    output.textContent = 'Network test failed: ' + e.message;
  }
}

// BATTERY INFO
function getBatteryInfo() {
  const output = document.getElementById('batteryResult');
  output.textContent = 'Fetching battery info...';

  if (!navigator.getBattery) {
    output.textContent = 'Battery API not supported in this browser.';
    return;
  }

  navigator.getBattery().then(battery => {
    let status = `Charging: ${battery.charging ? 'Yes' : 'No'}\n`;
    status += `Level: ${(battery.level * 100).toFixed(1)}%\n`;
    status += `Charging time: ${battery.chargingTime === Infinity ? 'N/A' : battery.chargingTime + ' s'}\n`;
    status += `Discharging time: ${battery.dischargingTime === Infinity ? 'N/A' : battery.dischargingTime + ' s'}`;
    output.textContent = status;
  }).catch(err => {
    output.textContent = 'Failed to get battery info: ' + err.message;
  });
}

// GPU INFO (WebGL Renderer)
function getGPUInfo() {
  const output = document.getElementById('gpuResult');
  const canvas = document.createElement('canvas');
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) {
    output.textContent = 'WebGL not supported';
    return;
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    output.textContent = `Vendor: ${vendor}\nRenderer: ${renderer}`;
  } else {
    output.textContent = 'WEBGL_debug_renderer_info extension not supported.';
  }
}

// MULTICORE TEST (Simple CPU load test)
function runMultiCoreTest() {
  const output = document.getElementById('coreResult');
  output.textContent = 'Running multicore test...';

  const cores = navigator.hardwareConcurrency || 4;
  output.textContent = `Detected ${cores} logical CPU cores. Running stress test...`;

  // Run a CPU-intensive task on multiple Web Workers (if supported)
  if (!window.Worker) {
    output.textContent += '\nWeb Workers not supported, running single-thread test.';
    singleThreadCPUTest().then(result => {
      output.textContent += `\nSingle-thread test duration: ${result} ms`;
    });
    return;
  }

  const workers = [];
  const workerCode = `
    self.onmessage = function() {
      const start = performance.now();
      let total = 0;
      for (let i = 0; i < 1e7; i++) {
        total += Math.sqrt(i);
      }
      const duration = performance.now() - start;
      self.postMessage(duration);
      self.close();
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  let finished = 0;
  const durations = [];

  return new Promise(resolve => {
    for (let i = 0; i < cores; i++) {
      const w = new Worker(url);
      workers.push(w);
      w.onmessage = e => {
        durations.push(e.data);
        finished++;
        if (finished === cores) {
          const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
          output.textContent += `\nAll workers finished. Average duration: ${avg.toFixed(2)} ms`;
          URL.revokeObjectURL(url);
          resolve(avg);
        }
      };
      w.postMessage('');
    }
  });
}

async function singleThreadCPUTest() {
  const start = performance.now();
  let total = 0;
  for (let i = 0; i < 1e7; i++) {
    total += Math.sqrt(i);
  }
  const duration = performance.now() - start;
  return duration.toFixed(2);
}

// MEMORY TEST (allocate and release arrays)
function runMemoryTest() {
  const output = document.getElementById('memoryResult');
  output.textContent = 'Running memory stress test...';

  try {
    const arrs = [];
    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      arrs.push(new Array(1e6).fill(i));
    }
    const mid = performance.now();
    arrs.length = 0; // release
    const end = performance.now();
    output.textContent = `Allocated and filled 50 million elements.\nAllocation took ${(mid - start).toFixed(2)} ms.\nRelease took ${(end - mid).toFixed(2)} ms.`;
  } catch (e) {
    output.textContent = 'Memory test failed: ' + e.message;
  }
}

// INPUT LATENCY TEST (measures time between keypress and rendering)
function startInputLatencyTest() {
  const output = document.getElementById('inputLatencyResult');
  output.textContent = `Press any key and see latency measurement (Press ESC to stop)...`;

  let lastTime = 0;
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      output.textContent += '\nInput latency test stopped.';
      window.removeEventListener('keydown', onKeyDown);
      return;
    }
    const start = performance.now();
    requestAnimationFrame(() => {
      const latency = performance.now() - start;
      output.textContent = `Key "${e.key}" latency: ${latency.toFixed(2)} ms\n(Press ESC to stop)`;
    });
  }
  window.addEventListener('keydown', onKeyDown);
}

// SENSOR INFO (if available)
function checkSensors() {
  const output = document.getElementById('sensorResult');
  output.textContent = 'Checking for available sensors...\n';

  // Device Orientation
  if ('DeviceOrientationEvent' in window) {
    output.textContent += 'DeviceOrientationEvent is supported.\n';
  } else {
    output.textContent += 'DeviceOrientationEvent not supported.\n';
  }

  // Device Motion
  if ('DeviceMotionEvent' in window) {
    output.textContent += 'DeviceMotionEvent is supported.\n';
  } else {
    output.textContent += 'DeviceMotionEvent not supported.\n';
  }

  // Ambient Light Sensor (experimental)
  if ('AmbientLightSensor' in window) {
    output.textContent += 'AmbientLightSensor is supported.\n';
  } else {
    output.textContent += 'AmbientLightSensor not supported.\n';
  }
}

// VRAM FILL TEST (draw many large rectangles on canvas)
function vramTest() {
  const output = document.getElementById('vramResult');
  output.textContent = 'Starting VRAM fill test...';

  const canvas = document.getElementById('benchmarkCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 200;

  const start = performance.now();

  // Draw 200 large rectangles randomly
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},0.8)`;
    ctx.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      50,
      50
    );
  }

  const end = performance.now();
  output.textContent = `Drew 200 large rectangles in ${(end - start).toFixed(2)} ms.`;
}
