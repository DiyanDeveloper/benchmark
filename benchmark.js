// benchmark.js

// State to prevent multiple runs
let runClicked = false;

// Utility to get hardware info (best-effort)
function getHardwareInfo() {
  const nav = navigator;
  return {
    deviceMemory: nav.deviceMemory || 'Unknown',
    hardwareConcurrency: nav.hardwareConcurrency || 'Unknown',
    platform: nav.platform,
    userAgent: nav.userAgent,
    language: nav.language,
    screenResolution: `${screen.width}x${screen.height}`,
  };
}

// Display hardware info on page
function displayHardwareInfo() {
  const info = getHardwareInfo();
  const infoHtml = `
    <h2>Hardware Info</h2>
    <ul>
      <li><strong>Platform:</strong> ${info.platform}</li>
      <li><strong>Language:</strong> ${info.language}</li>
      <li><strong>User Agent:</strong> ${info.userAgent}</li>
      <li><strong>Memory:</strong> ${info.deviceMemory} GB</li>
      <li><strong>Logical Cores:</strong> ${info.hardwareConcurrency}</li>
      <li><strong>Screen:</strong> ${info.screenResolution}</li>
    </ul>
  `;
  document.getElementById('hardware').innerHTML = infoHtml;
}

// Main benchmark runner
async function runBenchmarks() {
  if (runClicked) {
    alert('Benchmarks already run. Reload to run again.');
    return;
  }
  runClicked = true;
  document.getElementById('runBtn').disabled = true;

  const results = [];
  const canvas = document.getElementById('benchmarkCanvas');
  const ctx = canvas.getContext('2d');

  const timestamp = () => new Date().toLocaleTimeString();

  results.push(`Benchmark started at ${timestamp()}`);

  // Stage 1: DOM Stress Test
  let domStart = performance.now();
  const temp = document.createElement('div');
  for (let i = 0; i < 10000; i++) {
    const span = document.createElement('span');
    span.textContent = 'x';
    temp.appendChild(span);
  }
  let domEnd = performance.now();
  results.push(`Stage 1 - DOM Manipulation: ${(domEnd - domStart).toFixed(2)} ms`);

  // Stage 2: Canvas Drawing
  let canvasStart = performance.now();
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgb(${Math.floor(Math.random()*255)},100,150)`;
    ctx.fillRect(Math.random()*400, Math.random()*200, 2, 2);
  }
  let canvasEnd = performance.now();
  results.push(`Stage 2 - Canvas Rendering: ${(canvasEnd - canvasStart).toFixed(2)} ms`);

  // Stage 3: Storage (localStorage read/write)
  let storageStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    localStorage.setItem(`key${i}`, `value${i}`);
    localStorage.getItem(`key${i}`);
  }
  let storageEnd = performance.now();
  results.push(`Stage 3 - localStorage Read/Write: ${(storageEnd - storageStart).toFixed(2)} ms`);

  // Stage 4: JavaScript Math Operations
  let jsStart = performance.now();
  let sum = 0;
  for (let i = 0; i < 1e6; i++) {
    sum += Math.sin(i) * Math.cos(i);
  }
  let jsEnd = performance.now();
  results.push(`Stage 4 - JavaScript Math Ops: ${(jsEnd - jsStart).toFixed(2)} ms`);

  // Stage 5: FPS Measurement (~1 second)
  let frameCount = 0;
  let fpsStart = performance.now();
  await new Promise(resolve => {
    function measureFPS() {
      frameCount++;
      let now = performance.now();
      if (now - fpsStart < 1000) {
        requestAnimationFrame(measureFPS);
      } else {
        let fps = (frameCount / ((now - fpsStart) / 1000)).toFixed(2);
        results.push(`Stage 5 - Approx. FPS: ${fps}`);
        resolve();
      }
    }
    requestAnimationFrame(measureFPS);
  });

  // Stage 6: WebGL Rendering Test
  const glCanvas = document.createElement('canvas');
  const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
  if (gl) {
    let webglStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    let webglEnd = performance.now();
    results.push(`Stage 6 - WebGL Rendering: ${(webglEnd - webglStart).toFixed(2)} ms`);
  } else {
    results.push('Stage 6 - WebGL not supported.');
  }

  // Stage 7: Web Worker Computation
  await new Promise(resolve => {
    const blob = new Blob([`
      onmessage = function() {
        let total = 0;
        for (let i = 0; i < 1e7; i++) total += i;
        postMessage(total);
      }`], {type: 'application/javascript'});
    const worker = new Worker(URL.createObjectURL(blob));
    let workerStart = performance.now();
    worker.onmessage = (e) => {
      let workerEnd = performance.now();
      results.push(`Stage 7 - Web Worker Computation: ${(workerEnd - workerStart).toFixed(2)} ms`);
      resolve();
    };
    worker.postMessage('start');
  });

  // Baseline for comparison (example values)
  const baseline = {
    DOM: 100,
    Canvas: 50,
    Storage: 30,
    JS: 150,
    FPS: 60,
    WebGL: 40,
    Worker: 80
  };

  results.push('<h3>Performance vs Baseline</h3>');
  const perfKeys = ['DOM', 'Canvas', 'Storage', 'JS', 'FPS', 'WebGL', 'Worker'];

  perfKeys.forEach((key, idx) => {
    let match = results[idx + 1].match(/([0-9\.]+)(?:\sms|FPS:)/);
    if (match) {
      const val = parseFloat(match[1]);
      const percent = key === 'FPS' 
        ? ((val / baseline[key]) * 100).toFixed(0) 
        : ((baseline[key] / val) * 100).toFixed(0);
      results.push(`↳ ${key} Performance: ${percent}% of baseline`);
    }
  });

  displayResults(results);
  exportToJSON(results);
}

// Display benchmark results nicely
function displayResults(results) {
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = `
    <h2>Benchmark Results</h2>
    <ul>${results.map(r => `<li>${r}</li>`).join('')}</ul>
    <button id="exportCSVBtn">Export CSV</button>
  `;

  document.getElementById('exportCSVBtn').addEventListener('click', downloadCSV);
}

// Export results as JSON file automatically
function exportToJSON(results) {
  const dataStr = JSON.stringify(results, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "benchmark_results.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Export results as CSV on demand
function downloadCSV() {
  const lines = document.querySelectorAll('#results li');
  const csvContent = Array.from(lines)
    .map(li => li.textContent.replace(/↳ /g, '').replace(/Performance: /g, ''))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "benchmark_results.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Initial hardware info display
displayHardwareInfo();

// Attach event listener to Run Benchmarks button
document.getElementById('runBtn').addEventListener('click', runBenchmarks);
