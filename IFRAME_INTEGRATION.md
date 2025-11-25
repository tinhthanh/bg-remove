# 🛠️ Iframe Integration Guide

Hướng dẫn tích hợp công cụ xóa background vào ứng dụng của bạn thông qua Iframe và Penpal.

## 🌟 Tính năng nổi bật
- **Auto-Initialization**: Model tự động tải và khởi tạo khi có request đầu tiên. Không cần quản lý trạng thái loading thủ công.
- **Smart Queue**: Xử lý hàng đợi request thông minh.
- **Cross-Browser**: Tự động chọn WebGPU (nhanh) hoặc WASM (tương thích) tùy thiết bị.
- **Optimized for iOS**: Tự động tối ưu hóa cho Safari trên iPhone/iPad.

---

## 1. Cài đặt

### Trong dự án Parent (Host App)

Bạn cần thư viện `penpal` để giao tiếp với iframe an toàn.

```bash
npm install penpal
```

Hoặc sử dụng CDN:

```html
<script src="https://unpkg.com/penpal@^7/dist/penpal.min.js"></script>
```

---

## 2. Nhúng Iframe

Nhúng iframe trỏ đến domain chứa service xóa phông (ví dụ: `https://bg.your-domain.com`).

```html
<!-- Bạn có thể ẩn iframe này bằng CSS -->
<iframe 
  id="bgRemovalIframe" 
  src="https://bg.your-domain.com" 
  style="width: 0; height: 0; border: none; position: absolute; visibility: hidden;"
></iframe>
```

---

## 3. Kết nối & Sử dụng

### TypeScript Interface

```typescript
interface BackgroundRemovalService {
  /** Xóa phông và trả về Base64 string (image/png) */
  removeBackground(imageData: string | Blob): Promise<string>;
  
  /** Xóa phông và trả về Blob object */
  removeBackgroundAsBlob(imageData: string | Blob): Promise<Blob>;
  
  /** (Optional) Khởi tạo model trước để trải nghiệm mượt mà hơn */
  initializeModel(modelId?: 'briaai/RMBG-1.4' | 'Xenova/modnet'): Promise<boolean>;
  
  /** Lấy thông tin model hiện tại */
  getModelInfo(): Promise<{
    currentModelId: string;
    isWebGPUSupported: boolean;
    isIOS: boolean;
  }>;
}
```

### Code tích hợp mẫu

```javascript
import { WindowMessenger, connect } from 'penpal';

// 1. Setup kết nối
const iframe = document.getElementById('bgRemovalIframe');
const connection = connect({
  messenger: new WindowMessenger({
    remoteWindow: iframe.contentWindow,
    allowedOrigins: ['https://bg.your-domain.com'], // Quan trọng cho bảo mật
  }),
});

// 2. Lấy remote API
const service = await connection.promise;

// 3. Sử dụng
async function handleImageUpload(file) {
  try {
    // Cách 1: Nhận về Blob (Tiết kiệm bộ nhớ, khuyên dùng)
    const blob = await service.removeBackgroundAsBlob(file);
    const imageUrl = URL.createObjectURL(blob);
    document.getElementById('result').src = imageUrl;

    // Cách 2: Nhận về Base64
    // const base64 = await service.removeBackground(file);
    // document.getElementById('result').src = base64;
    
  } catch (error) {
    console.error("Lỗi xử lý:", error);
  }
}
```

---

## 4. Best Practices

### Pre-loading Model (Khuyên dùng)
Mặc dù hệ thống có *Auto-Initialization*, nhưng việc model tải (khoảng 100MB) trong lần request đầu tiên có thể khiến user phải chờ đợi.
Bạn nên gọi `initializeModel()` ngay khi trang web tải xong (idle time).

```javascript
// Gọi ngay sau khi kết nối thành công
service.initializeModel().then(() => {
  console.log('✨ Model đã sẵn sàng!');
});
```

### Xử lý lỗi
Luôn bọc các lệnh gọi trong `try/catch`.

```javascript
try {
  const result = await service.removeBackground(file);
} catch (error) {
  if (error.code === 'ConnectionTimeout') {
    alert('Không thể kết nối đến service');
  } else {
    alert('Lỗi xử lý ảnh: ' + error.message);
  }
}
```

---

## 5. Demo

Xem file [`parent-demo.html`](./parent-demo.html) trong thư mục `public` để xem ví dụ thực tế về cách triển khai.
