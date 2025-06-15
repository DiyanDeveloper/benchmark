// tools.js

// 🌐 Network Speed Test using Cachefly (100MB)
async function runNetworkTest() {
  const url = 'https://cachefly.cachefly.net/100mb.test'; // CORS-enabled
  const startTime = performance.now();
  let bytesReceived = 0;

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.body) throw new Error('ReadableStream not supported');
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesReceived += value.length;
    }

    const duration = (performance.now() - startTime) / 1000;
    const mbps = ((bytesReceived * 8) / duration / 1024 / 1024).toFixed(2);
    const megabytes = (bytesReceived / (1024 * 1024)).toFixed(2);

    document.getElementById("networkResult").innerHTML = `
      <ul>
        <li><strong>Download Speed:</strong> ${mbps} Mbps</li>
        <li><strong>Time Taken:</strong> ${duration.toFixed(2)} seconds</li>
        <li><strong>Total Data:</strong> ${megabytes} MB</li>
      </ul>
    `;
  } catch (e) {
    document.getElementById("networkResult").innerText = `❌ Network test failed: ${e.message}`;
  }
}

// 🔋 Battery Info
function getBatteryInfo() {
  navigator.getBattery().then(battery => {
    document.getElementById("batteryResult").innerHTML = `
      <ul>
        <li><strong>Level:</strong> ${(battery.level * 100).toFixed(0)}%</li>
        <li><strong>Charging:</strong> ${battery.charging}</li>
        <li><strong>Charging Time:</strong> ${battery.chargingTime}s</li>
        <li><strong>Discharging Time:</strong> ${battery.dischargingTime}s</li>
      </ul>
    `;
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
      <li><strong>Renderer:</strong> ${renderer}</li>
      <li><strong>Vendor:</strong> ${vendor}</li>
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
        document.getElementById("coreResult").innerText =
          `Completed using ${threads} threads in ${(end - start).toFixed(2)} ms.`;
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
    document.getElementById("memoryResult").innerText =
      `✅ Successfully allocated ${total * 1e6} entries (~${(total * 1e6 * 8 / (1024 * 1024)).toFixed(2)} MB).`;
  } catch (e) {
    document.getElementById("memoryResult").innerText =
      `❌ Failed after ${total * 1e6} entries (~${(total * 1e6 * 8 / (1024 * 1024)).toFixed(2)} MB).`;
  }
}

// ⌨️ Input Latency Test
function startInputLatencyTest() {
  const resultEl = document.getElementById("inputLatencyResult");
  let clicks = 0;
  let lastClickTime = performance.now();

  resultEl.innerHTML = `<button id="latencyClickBtn">Click to test latency</button><div id="latencyDetails"></div>`;

  const button = document.getElementById("latencyClickBtn");
  const details = document.getElementById("latencyDetails");

  button.onclick = () => {
    const now = performance.now();
    const latency = (now - lastClickTime).toFixed(2);
    clicks++;
    details.innerHTML = `
      <strong>Clicks:</strong> ${clicks} / 10<br>
      <strong>Last Latency:</strong> ${latency} ms
    `;
    lastClickTime = now;

    if (clicks >= 10) {
      button.disabled = true;
      details.innerHTML += `<br>✅ Test complete.`;
    }
  };
}

// 📱 Sensor Access Test
function checkSensors() {
  let result = "";
  if ('DeviceOrientationEvent' in window) result += "📐 Device Orientation: Supported<br>";
  if ('DeviceMotionEvent' in window) result += "📦 Device Motion: Supported<br>";
  document.getElementById("sensorResult").innerHTML = result || "❌ No supported sensors detected.";
}

// 🎮 VRAM Fill Test
function vramTest() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    const texList = [];
    const textureSize = 512;

    for (let i = 0; i < 1000; i++) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureSize, textureSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      texList.push(tex);
    }

    const totalMB = (texList.length * textureSize * textureSize * 4 / 1024 / 1024).toFixed(2);
    document.getElementById("vramResult").innerText = `Allocated approx. ${totalMB} MB of VRAM with ${texList.length} textures.`;
  } catch (e) {
    document.getElementById("vramResult").innerText = "❌ VRAM test failed.";
  }
}
