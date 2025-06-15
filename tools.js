// tools.js

// 🌐 Improved Network Speed Test (fixed URL with CORS support)
async function runNetworkTest() {
 const testUrl = "https://nbg1-speed.hetzner.com/100MB.bin"; // your preferred test file URL with CORS
  const startTime = performance.now();

  try {
    const response = await fetch(testUrl, { cache: "no-store" });
    if (!response.ok) throw new Error('Network response not ok');

    const reader = response.body.getReader();
    let received = 0;
    const start = performance.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
    }

    const duration = (performance.now() - start) / 1000; // seconds
    const speedMbps = ((received * 8) / duration / 1024 / 1024).toFixed(2);
    document.getElementById("networkResult").innerHTML = `
      <strong>Download Speed:</strong> ${speedMbps} Mbps<br>
      <strong>Time Taken:</strong> ${duration.toFixed(2)} seconds
    `;
  } catch (error) {
    document.getElementById("networkResult").innerText = "❌ Network test failed: " + error.message;
  }
}

// 🔋 Battery Info
function getBatteryInfo() {
  if (!navigator.getBattery) {
    document.getElementById("batteryResult").innerText = "Battery API not supported.";
    return;
  }
  navigator.getBattery().then(battery => {
    document.getElementById("batteryResult").innerHTML = `
      <ul>
        <li>Level: ${(battery.level * 100).toFixed(0)}%</li>
        <li>Charging: ${battery.charging}</li>
        <li>Charging Time: ${battery.chargingTime}s</li>
        <li>Discharging Time: ${battery.dischargingTime}s</li>
      </ul>
    `;
  }).catch(() => {
    document.getElementById("batteryResult").innerText = "Failed to get battery info.";
  });
}

// 🖥 GPU Info
function getGPUInfo() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    document.getElementById("gpuResult").innerText = "WebGL not supported.";
    return;
  }
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown";
  const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "Unknown";
  document.getElementById("gpuResult").innerHTML = `
    <ul>
      <li>Renderer: ${renderer}</li>
      <li>Vendor: ${vendor}</li>
    </ul>
  `;
}

// 🧠 Multicore Threading Test
function runMultiCoreTest() {
  const threads = navigator.hardwareConcurrency || 4;
  let completed = 0;
  const start = performance.now();

  for (let i = 0; i < threads; i++) {
    const blob = new Blob([`onmessage=function(){let x=0;for(let i=0;i<1e7;i++){x+=i}postMessage(x);}`]);
    const worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = () => {
      completed++;
      if (completed === threads) {
        const end = performance.now();
        document.getElementById("coreResult").innerText = `Multithreaded task completed in ${(end - start).toFixed(2)} ms using ${threads} cores.`;
      }
    };
    worker.postMessage('go');
  }
}

// 💾 Memory Stress Test
function runMemoryTest() {
  let total = 0;
  try {
    const arrays = [];
    for (let i = 0; i < 1000; i++) {
      arrays.push(new Array(1e6).fill(0));
      total++;
    }
    document.getElementById("memoryResult").innerText = `Allocated ${total * 1e6} entries successfully.`;
  } catch (e) {
    document.getElementById("memoryResult").innerText = `Failed after allocating ${total * 1e6} entries.`;
  }
}

// ⌨️ Mobile-friendly Input Latency Test
function startInputLatencyTest() {
  const resultEl = document.getElementById("inputLatencyResult");
  resultEl.innerHTML = `
    <button id="latencyBtn" style="
      font-size: 1.4em; 
      padding: 15px 30px; 
      border-radius: 10px; 
      width: 100%; 
      max-width: 300px; 
      cursor: pointer;
      user-select: none;
    ">Start Input Latency Test</button>
    <div id="latencyStats" style="margin-top: 15px; font-size: 1.1em;"></div>
  `;

  const btn = document.getElementById("latencyBtn");
  const stats = document.getElementById("latencyStats");
  let lastTime = null;
  let clicks = 0;
  const maxClicks = 10;

  btn.onclick = () => {
    const now = performance.now();
    if (lastTime !== null) {
      const latency = (now - lastTime).toFixed(2);
      clicks++;
      stats.innerHTML = `Clicks: ${clicks} / ${maxClicks}<br>Last latency: ${latency} ms`;
      recordLatency(latency);

      if (clicks >= maxClicks) {
        btn.disabled = true;
        btn.innerText = "Test Complete";
        stats.innerHTML += `<br>Average latency: ${calculateAverageLatency()} ms`;
      }
    } else {
      clicks = 1;
      stats.innerHTML = `Clicks: ${clicks} / ${maxClicks}<br>Last latency: N/A (first click)`;
    }
    lastTime = now;
  };

  const latencies = [];
  function recordLatency(latency) {
    latencies.push(parseFloat(latency));
  }

  function calculateAverageLatency() {
    if (latencies.length === 0) return 'N/A';
    const sum = latencies.reduce((a, b) => a + b, 0);
    return (sum / latencies.length).toFixed(2);
  }
}

// 📱 Sensor Access
function checkSensors() {
  let result = "";
  if ('DeviceOrientationEvent' in window) result += "Orientation Supported\n";
  if ('DeviceMotionEvent' in window) result += "Motion Supported\n";
  document.getElementById("sensorResult").innerText = result || "No sensors available.";
}

// 🎮 VRAM Fill Test
function vramTest() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
      document.getElementById("vramResult").innerText = "WebGL not supported.";
      return;
    }
    const texList = [];
    for (let i = 0; i < 1000; i++) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      texList.push(tex);
    }
    document.getElementById("vramResult").innerText = `Filled approx. ${(texList.length * 512 * 512 * 4 / 1024 / 1024).toFixed(1)} MB of VRAM.`;
  } catch (e) {
    document.getElementById("vramResult").innerText = "VRAM test failed.";
  }
}
