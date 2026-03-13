# 🛍️ 3D Virtual Try-On Fashion E-Commerce

Một hệ sinh thái thương mại điện tử toàn diện (Web & Mobile) dành cho ngành hàng thời trang. Dự án tập trung vào việc nâng cao trải nghiệm mua sắm (UI/UX) bằng cách tích hợp công nghệ **Mô hình 3D** và tính năng **Phòng thử đồ ảo (Virtual Try-on)** thông qua API, giúp người dùng hình dung sản phẩm một cách chân thực nhất.

## 🌟 Tính năng kỹ thuật nổi bật (Highlights)

* **Phòng thử đồ ảo (Virtual Try-on):** Tích hợp [Tên API bạn dùng, VD: API X/Y] cho phép người dùng ghép thử trang phục lên người mẫu ảo trực tiếp trên nền tảng web.
* **Tương tác 3D Real-time:** Ứng dụng [Tên thư viện 3D, VD: Three.js / WebGL] để render mô hình sản phẩm. Người dùng có thể xoay 360 độ, thu phóng để xem chi tiết chất liệu và phom dáng.
* **Full E-commerce Flow:** Xây dựng trọn vẹn luồng mua sắm từ A-Z bao gồm: Lọc/tìm kiếm sản phẩm, quản lý giỏ hàng (Cart State Management), và quy trình thanh toán.
* **Kiến trúc Monorepo:** Tổ chức source code rõ ràng, phân tách Frontend (React), Backend (Node.js/Express), và Mobile App thành các module độc lập nhưng tương t
  
## 💻 Tech Stack (Công nghệ sử dụng)

**Frontend (Web):**
* React.js (Hooks, Context API/Redux)
* HTML5 / CSS3 / Tailwind CSS (hoặc thư viện UI bạn dùng)
* Xử lý 3D: [Điền tên thư viện 3D vào đây]

**Backend (API & Server):**
* Node.js & Express.js
* RESTful API Architecture
* Authentication (JWT)

**Database:**
* MySQL (Thiết kế Schema và tối ưu hóa truy vấn)

**Mobile App:**
*Flutter & Dart

## 🚀 Hướng dẫn cài đặt chạy Local

Yêu cầu môi trường: Node.js (v14+) và MySQL.

### 1. Khởi động Backend

```bash
cd backend
npm install
# Tạo file .env và cấu hình DB theo file .env.example (nếu có)
npm start
(Server sẽ chạy tại http://localhost:5000)
```
### 2. Khởi động Frontend

```bash
cd frontend
npm install
npm start
(Web client sẽ chạy tại http://localhost:3000)
