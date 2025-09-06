// src/benchmark-worker.ts
// Web Worker for benchmarking string transfer methods

interface StringTestMessage {
  type: 'test-string';
  data: string;
}

interface BufferTestMessage {
  type: 'test-buffer';
  data: ArrayBuffer;
}

interface StringResultMessage {
  type: 'string-result';
  processed: boolean;
  length: number;
}

interface BufferResultMessage {
  type: 'buffer-result';
  processed: boolean;
  length: number;
}

type WorkerMessage = StringTestMessage | BufferTestMessage;
type WorkerResponse = StringResultMessage | BufferResultMessage;

function doNothing(data: string): boolean {
  return true;
}

// Simulate some processing on the received data
function processStringData(data: string): boolean {
  // Simulate some string processing
  let processed = false;
  
  // Count characters
  const charCount = data.length;
  
  // Check if string contains certain patterns (simulate real processing)
  const hasNumbers = /\d/.test(data);
  const hasLetters = /[a-zA-Z]/.test(data);
  const hasSpecialChars = /[^a-zA-Z0-9\s]/.test(data);
  
  // Simulate some computation
  let checksum = 0;
  for (let i = 0; i < Math.min(data.length, 10000); i++) {
    checksum += data.charCodeAt(i) % 256;
  }
  
  // Simulate string manipulation
  const upperCase = data.toUpperCase();
  const lowerCase = data.toLowerCase();
  const reversed = data.split('').reverse().join('');
  
  processed = true;
  
  return processed;
}

// Handle messages from main thread
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;
  
  if (message.type === 'test-string') {
    // Method 1: Direct string transfer
    const startTime = performance.now();
    
    // Process the string
    const processed = doNothing(message.data);
    const length = message.data.length;
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    console.log(`String processing took: ${processingTime.toFixed(2)}ms`);
    
    const response: StringResultMessage = {
      type: 'string-result',
      processed,
      length
    };
    
    self.postMessage(response);
    
  } else if (message.type === 'test-buffer') {
    // Method 2: ArrayBuffer transfer
    const startTime = performance.now();
    
    // Decode ArrayBuffer back to string
    const decoder = new TextDecoder();
    const decodedString = decoder.decode(message.data);
    
    const decodeTime = performance.now();
    console.log(`Buffer decode took: ${(decodeTime - startTime).toFixed(2)}ms`);
    
    // Process the decoded string
    const processed = doNothing(decodedString);
    const length = decodedString.length;
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const processingTime = endTime - decodeTime;
    
    console.log(`Buffer processing took: ${processingTime.toFixed(2)}ms`);
    console.log(`Total buffer method time: ${totalTime.toFixed(2)}ms`);
    
    const response: BufferResultMessage = {
      type: 'buffer-result',
      processed,
      length
    };
    
    self.postMessage(response);
  }
};

// Export types for main thread
export type { WorkerMessage, WorkerResponse };
