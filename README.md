# Web Worker String Transfer Benchmark

This benchmark compares two methods for passing large strings to web workers:

1. **Direct String Transfer**: Passing strings directly via `postMessage()`
2. **ArrayBuffer Transfer**: Converting strings to ArrayBuffer, transferring, then decoding

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run the benchmark
pnpm run benchmark
```

Then open http://localhost:5173/ in your browser.

## 📊 What This Benchmark Tests

### Method 1: Direct String Transfer
- Uses `postMessage(string)` to send data directly
- Browser uses structured clone algorithm
- String is copied (not transferred) to worker
- No encoding/decoding overhead

### Method 2: ArrayBuffer Transfer
- Converts string to ArrayBuffer using `TextEncoder`
- Uses `postMessage(buffer, [buffer])` for zero-copy transfer
- Decodes ArrayBuffer back to string using `TextDecoder`
- Includes encoding/decoding overhead

## 🎯 Test Parameters

- **String Sizes**: 1MB, 5MB, 10MB, 50MB, 100MB, 200MB
- **String Types**: 
  - Random ASCII characters
  - Unicode (UTF-8) characters
  - Repeated patterns
- **Iterations**: 1-20 runs per method (configurable)
- **Metrics**: Average, Min, Max, Median times

## 📈 Test Results

The benchmark measures which method is more efficient across different **string sizes** (1 MB → 100 MB), **string types** (ASCII vs Unicode), and multiple **iterations**.

- **String Sizes Tested**: 1 MB, 5 MB, 10 MB, 50 MB, 100 MB  
- **String Types**: Random ASCII, Unicode (UTF-8 encoded)  
- **Iterations per Test**: 20  
- **Metrics Collected**: Average, Minimum, Maximum, Median execution times  

Test results summary is as follows.

### ASCII Strings

| Size | Direct Transfer (Avg) | ArrayBuffer Transfer (Avg) | Faster Method | Relative Gain |
|------|------------------------|-----------------------------|---------------|---------------|
| 1 MB | 3.90 ms               | 9.42 ms                    | Direct        | **58.6%** |
| 5 MB | 13.70 ms              | 39.83 ms                   | Direct        | **65.6%** |
| 10 MB| 22.40 ms              | 66.58 ms                   | Direct        | **66.3%** |
| 50 MB| 93.11 ms              | 338.79 ms                  | Direct        | **72.5%** |
|100 MB| 211.33 ms             | 692.54 ms                  | Direct        | **69.5%** |

**Observation:** 

- Direct transfer consistently outperforms ArrayBuffer transfer.  
- Overhead from `TextEncoder`/`TextDecoder` dominates, despite zero-copy transfer.  
- Performance gap grows with size, reaching **~70% faster at 50–100 MB**.  

### Unicode Strings

| Size | Direct Transfer (Avg) | ArrayBuffer Transfer (Avg) | Faster Method | Relative Gain |
|------|------------------------|-----------------------------|---------------|---------------|
| 1 MB | 2.92 ms               | 16.57 ms                   | Direct        | **82.3%** |
| 5 MB | 11.99 ms              | 80.48 ms                   | Direct        | **85.1%** |
| 10 MB| 26.67 ms              | 166.73 ms                  | Direct        | **84.0%** |
| 50 MB| 93.90 ms              | 700.85 ms                  | Direct        | **86.6%** |
|100 MB| 202.35 ms             | 1529.89 ms                 | Direct        | **86.8%** |

**Observation:**  

- For Unicode, the performance difference is even larger than ASCII.  
- Encoding/decoding multibyte characters greatly increases ArrayBuffer overhead.  
- Direct transfer is **up to 7–8× faster** at large sizes (50–100 MB).  

## Test Results Analysis

### Analysis

1. **Encoding/Decoding Cost Dominates**  
   - `TextEncoder` and `TextDecoder` introduce significant overhead, particularly for Unicode strings.  
   - The supposed advantage of zero-copy transfer with ArrayBuffers is outweighed by this cost.  

2. **Scalability with String Size**  
   - Direct transfer scales better as string size grows.  
   - Although both methods slow down at larger sizes, Direct Transfer consistently maintains lower execution times and smaller variance.  

3. **Stability**  
   - Direct Transfer shows wider min/max variation (due to structured clone performance variability across runs).  
   - ArrayBuffer results are more stable but consistently slower.  

4. **Unicode vs ASCII**  
   - Direct Transfer performs similarly for ASCII and Unicode (encoding handled by browser internally).  
   - ArrayBuffer suffers much more with Unicode because encoding produces larger byte arrays and decoding is expensive.  

### Conclusion

- **Winner:** 🚀 **Direct String Transfer via `postMessage(string)`**  
- **Key Finding:** Direct transfer is consistently faster, simpler, and scales better with larger string sizes.  
- **Performance Gap:**  
  - **ASCII:** ~60–70% faster  
  - **Unicode:** ~80–87% faster  

### Practical Recommendations

- Use **Direct String Transfer** for large strings in most cases.  
- ArrayBuffer transfer is only useful when:  
  - Data is already in binary form (e.g., images, typed arrays).  
  - Zero-copy semantics are critical.  
  - You must avoid multiple string copies across contexts.  
- For string workloads, **avoid unnecessary encoding/decoding overhead**.  

## 🔬 Technical Details

### Timing Methodology
- Measures end-to-end time from `postMessage()` to worker response
- Includes all encoding/decoding overhead
- Multiple iterations to account for variance
- Uses `performance.now()` for high precision

### Worker Processing

Do nothing to avoid it affects testing results. You can edit `src/worker.ts` to simulate your actual use case.

```typescript
function processStringData(data: string)

### Memory Considerations

- Direct transfer: 2x memory usage (original + copy)
- ArrayBuffer transfer: 3x memory usage (original + encoded + decoded)

## 🛠️ Customization

### Adding New Test Sizes

Edit `index.html` and add options to the `testSize` select:

```html
<option value="524288000">500 MB</option>
<option value="1073741824">1 GB</option>
```

### Adding New String Types

Modify the `generateTestString()` function:

```javascript
case 'binary':
    for (let i = 0; i < bytes; i++) {
        str += String.fromCharCode(Math.floor(Math.random() * 256));
    }
    break;
```

### Modifying Worker Processing

Edit `src/worker.ts` to simulate your actual use case:

```typescript
function processStringData(data: string): boolean {
    // Add your specific string processing logic here
    return true;
}
```

For now, function `doNothing` is called in worker.

## 📋 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: May have different performance characteristics

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
pnpm install
```

### Worker Not Loading

- Check browser console for errors
- Ensure `dist/assets/worker-********.js` exists after build
- Verify CORS settings if serving from different domain

### Performance Anomalies
- Close other browser tabs to reduce memory pressure
- Run multiple iterations to get consistent results
- Test on different browsers for comparison

## 📚 Further Reading

- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [MDN: Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Transferable)
- [V8 Blog: ArrayBuffer Performance](https://v8.dev/blog/array-buffer)
- [Web Performance: Memory Management](https://web.dev/memory-management/)

## 🤝 Contributing

Feel free to submit issues or pull requests to improve the benchmark:

- Add new test scenarios
- Improve timing accuracy
- Add more detailed metrics
- Support for different data types
