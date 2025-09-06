import WorkerFactory from './worker?worker';

// Types
interface BenchmarkData {
  testSize: number;
  iterations: number;
  stringType: string;
  stringLength: number;
  method1: { name: string; times: number[] };
  method2: { name: string; times: number[] };
}

interface Stats {
  avg: number;
  min: number;
  max: number;
  median: number;
  times: number[];
}

interface WorkerMessage {
  type: 'test-string' | 'test-buffer';
  data: string | ArrayBuffer;
}

interface WorkerResponse {
  type: 'string-result' | 'buffer-result';
  processed: boolean;
  length: number;
}

// Global variables
let benchmarkWorker: Worker | null = null;

// Initialize worker
function initWorker(): void {
  if (benchmarkWorker) {
    benchmarkWorker.terminate();
  }
  benchmarkWorker = new WorkerFactory();
}

// Generate test string
function generateTestString(size: number, type: string): string {
  const bytes = size;
  let str = '';
  
  switch (type) {
    case 'random':
      for (let i = 0; i < bytes; i++) {
        str += String.fromCharCode(Math.floor(Math.random() * 95) + 32);
      }
      break;
    case 'unicode':
      for (let i = 0; i < bytes / 2; i++) {
        str += String.fromCharCode(Math.floor(Math.random() * 0xFFFF));
      }
      break;
    case 'repeated':
      const pattern = 'Hello World! This is a test string. ';
      const repeats = Math.ceil(bytes / pattern.length);
      str = pattern.repeat(repeats).substring(0, bytes);
      break;
  }
  
  return str;
}

// Calculate statistics
function calculateStats(times: number[]): Stats {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted.length % 2 === 0 
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  return { avg, min, max, median, times: sorted };
}

// Display results
function displayResults(data: BenchmarkData, method1Stats: Stats, method2Stats: Stats): void {
  const resultsDiv = document.getElementById('resultContent');
  if (!resultsDiv) return;
  
  const winner = method1Stats.avg < method2Stats.avg ? 'method1' : 'method2';
  
  resultsDiv.innerHTML = `
    <div class="stats">
      <div class="stat-item">
        <span><strong>Test Configuration:</strong></span>
        <span>${(data.testSize / 1024 / 1024).toFixed(1)}MB, ${data.iterations} iterations, ${data.stringType}</span>
      </div>
      <div class="stat-item">
        <span><strong>String Length:</strong></span>
        <span>${data.stringLength.toLocaleString()} characters</span>
      </div>
    </div>
    
    <div class="result-section ${winner === 'method1' ? 'winner' : ''}">
      <h3>Method 1: Direct String Transfer</h3>
      <div class="result-item">
        <span class="method-name">Average Time:</span>
        <span class="time">${method1Stats.avg.toFixed(2)}ms</span>
      </div>
      <div class="result-item">
        <span class="method-name">Min Time:</span>
        <span class="time">${method1Stats.min.toFixed(2)}ms</span>
      </div>
      <div class="result-item">
        <span class="method-name">Max Time:</span>
        <span class="time">${method1Stats.max.toFixed(2)}ms</span>
      </div>
      <div class="result-item">
        <span class="method-name">Median Time:</span>
        <span class="time">${method1Stats.median.toFixed(2)}ms</span>
      </div>
    </div>
    
    <div class="result-section ${winner === 'method2' ? 'winner' : ''}">
      <h3>Method 2: ArrayBuffer Transfer</h3>
      <div class="result-item">
        <span class="method-name">Average Time:</span>
        <span class="time">${method2Stats.avg.toFixed(2)}ms</span>
      </div>
      <div class="result-item">
        <span class="method-name">Min Time:</span>
        <span class="time">${method2Stats.min.toFixed(2)}ms</span>
      </div>
      <div class="result-item">
        <span class="method-name">Max Time:</span>
        <span class="time">${method2Stats.max.toFixed(2)}ms</span>
      </div>
      <div class="result-item">
        <span class="method-name">Median Time:</span>
        <span class="time">${method2Stats.median.toFixed(2)}ms</span>
      </div>
    </div>
    
    <div class="stats">
      <div class="stat-item">
        <span><strong>Winner:</strong></span>
        <span>${winner === 'method1' ? 'Direct String Transfer' : 'ArrayBuffer Transfer'}</span>
      </div>
      <div class="stat-item">
        <span><strong>Speed Difference:</strong></span>
        <span>${Math.abs(method1Stats.avg - method2Stats.avg).toFixed(2)}ms (${((Math.abs(method1Stats.avg - method2Stats.avg) / Math.max(method1Stats.avg, method2Stats.avg)) * 100).toFixed(1)}%)</span>
      </div>
    </div>
  `;
  
  const resultsElement = document.getElementById('results');
  if (resultsElement) {
    resultsElement.style.display = 'block';
  }
}

// Run benchmark
async function runBenchmark(): Promise<void> {
  const testSize = parseInt((document.getElementById('testSize') as HTMLSelectElement)?.value || '10485760');
  const iterations = parseInt((document.getElementById('iterations') as HTMLInputElement)?.value || '5');
  const stringType = (document.getElementById('stringType') as HTMLSelectElement)?.value || 'random';
  
  const runBtn = document.getElementById('runBenchmark') as HTMLButtonElement;
  const spinner = document.getElementById('spinner');
  const results = document.getElementById('results');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  
  // UI updates
  if (runBtn) runBtn.disabled = true;
  if (spinner) spinner.style.display = 'block';
  if (results) results.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'block';
  if (progressBar) progressBar.style.width = '0%';
  
  try {
    initWorker();
    
    // Generate test string
    console.log(`Generating ${(testSize / 1024 / 1024).toFixed(1)}MB test string...`);
    const testString = generateTestString(testSize, stringType);
    console.log(`Generated string length: ${testString.length} characters`);
    
    const results_data: BenchmarkData = {
      testSize: testSize,
      iterations: iterations,
      stringType: stringType,
      stringLength: testString.length,
      method1: { name: 'Direct String Transfer', times: [] },
      method2: { name: 'ArrayBuffer Transfer', times: [] }
    };
    
    const totalTests = iterations * 2;
    let completedTests = 0;
    
    // Test Method 1: Direct String Transfer
    console.log('Testing Method 1: Direct String Transfer...');
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      await new Promise<void>((resolve) => {
        if (!benchmarkWorker) {
          resolve();
          return;
        }
        
        benchmarkWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.type === 'string-result') {
            const endTime = performance.now();
            const duration = endTime - startTime;
            results_data.method1.times.push(duration);
            completedTests++;
            if (progressBar) {
              progressBar.style.width = `${(completedTests / totalTests) * 100}%`;
            }
            resolve();
          }
        };
        
        benchmarkWorker.postMessage({
          type: 'test-string',
          data: testString
        } as WorkerMessage);
      });
    }
    
    // Test Method 2: ArrayBuffer Transfer
    console.log('Testing Method 2: ArrayBuffer Transfer...');
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      await new Promise<void>((resolve) => {
        if (!benchmarkWorker) {
          resolve();
          return;
        }
        
        benchmarkWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.type === 'buffer-result') {
            const endTime = performance.now();
            const duration = endTime - startTime;
            results_data.method2.times.push(duration);
            completedTests++;
            if (progressBar) {
              progressBar.style.width = `${(completedTests / totalTests) * 100}%`;
            }
            resolve();
          }
        };
        
        // Encode string to ArrayBuffer
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(testString);
        
        benchmarkWorker.postMessage({
          type: 'test-buffer',
          data: uint8Array.buffer
        } as WorkerMessage, [uint8Array.buffer]);
      });
    }
    
    // Calculate statistics
    const method1Stats = calculateStats(results_data.method1.times);
    const method2Stats = calculateStats(results_data.method2.times);
    
    // Display results
    displayResults(results_data, method1Stats, method2Stats);
    
  } catch (error) {
    console.error('Benchmark failed:', error);
    alert('Benchmark failed: ' + (error as Error).message);
  } finally {
    if (runBtn) runBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';
  }
}

// Initialize on page load
function initializeApp(): void {
  initWorker();
  
  // Make runBenchmark available globally
  (window as any).runBenchmark = runBenchmark;
}

// Export for module usage
export { runBenchmark, initializeApp, generateTestString, calculateStats, displayResults };
export type { BenchmarkData, Stats, WorkerMessage, WorkerResponse };
