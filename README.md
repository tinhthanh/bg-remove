# Background Removal with WebGPU

A powerful background removal tool built with WebGPU and WebAssembly, supporting both browser-based and iframe integration.

## Features

- 🚀 Fast background removal using WebGPU (when available)
- 🌐 Cross-browser support with WebAssembly fallback
- 📱 Optimized for iOS devices
- 🎨 Built-in image editor
- 📦 Batch processing support
- 🔌 **Iframe integration with Penpal** - Embed in your applications

## Iframe Integration

You can easily integrate this background removal tool into your application using an iframe and Penpal for communication.

### Quick Start

```javascript
import { WindowMessenger, connect } from 'penpal';

const iframe = document.getElementById('bgRemovalIframe');
const messenger = new WindowMessenger({
  remoteWindow: iframe.contentWindow,
  allowedOrigins: ['https://your-domain.com'],
});

const connection = connect({ messenger });
const remote = await connection.promise;

// Remove background from image
const result = await remote.removeBackground(base64Image);
```

### Documentation

See [IFRAME_INTEGRATION.md](./IFRAME_INTEGRATION.md) for complete documentation including:
- API reference
- Usage examples (vanilla JS & React)
- Security considerations
- Troubleshooting guide

### Demo

Run the demo to see iframe integration in action:

```bash
npm run dev
# Then open http://localhost:5173/parent-demo.html
```

## Technical Implementation

The app implements a cross-browser approach to background removal with optional WebGPU acceleration:

### Default Implementation (All Browsers)
- Uses [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4), a robust background removal model
- Ensures consistent performance across all modern browsers
- Processes images efficiently using WebAssembly

### Optional WebGPU Acceleration
- For browsers with WebGPU support, offers [MODNet](https://huggingface.co/Xenova/modnet) as an alternative
- Can be enabled through a dropdown when WebGPU is available
- Leverages GPU acceleration for potentially faster processing

Both implementations use Transformers.js to run the machine learning models directly in the browser, eliminating the need for server-side processing.

## How It Works

1. **File Selection**: Upload any image file
2. **Model Selection**: 
   - By default, uses RMBG-1.4 for maximum compatibility
   - If WebGPU is available, offers option to switch to MODNet
3. **Background Removal**: The selected ML model processes your media, creating an alpha mask
4. **Customization**: Choose a custom background color, image or keep transparency
5. **Export**: Download your processed media with either transparent or colored background

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/addyosmani/bg-remove.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Browser Support

- **Default Experience**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Optional WebGPU**: Available in browsers with WebGPU support (Chrome Canary with WebGPU flags enabled)

## Technical Stack

- React + Vite for the frontend framework
- Transformers.js for ML model inference
- RMBG-1.4 as the default cross-browser model
- Optional WebGPU acceleration with MODNet
- IndexedDB (via Dexie.js) for local file management
- TailwindCSS for styling

## Credits

Based on the [WebGPU background removal demo](https://github.com/huggingface/transformers.js-examples/tree/main/remove-background-webgpu) by [@xenova](https://github.com/xenova)

## License

MIT License - feel free to use this in your own projects!
