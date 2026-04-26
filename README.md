# 🍕 Pizza Palace — Trang Quản Trị (Admin Dashboard)

Hệ thống quản trị nội bộ dành cho chuỗi pizza **Pizza Palace**, xây dựng trên nền [Next.js 16](https://nextjs.org) với TypeScript, kết hợp MongoDB (Prisma), xác thực Clerk và thông báo thời gian thực qua Socket.IO.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt & chạy dự án](#cài-đặt--chạy-dự-án)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Scripts](#scripts)
- [License](#license)

---

## Tổng quan

Pizza Palace Admin là ứng dụng quản trị **chỉ dành cho nhân viên/admin** của hệ thống Pizza Palace. Ứng dụng cho phép:

- Xem tổng quan kinh doanh theo thời gian thực (doanh thu, đơn hàng, khách hàng).
- Quản lý toàn bộ menu: pizza, gà rán, khai vị, đồ uống, combo.
- Xử lý và theo dõi vòng đời đơn hàng.
- Nhận thông báo đơn hàng mới ngay lập tức qua WebSocket.
- Quản lý người dùng và phân quyền (CUSTOMER / STAFF / ADMIN).

---

## Tính năng

| Nhóm | Chi tiết |
|---|---|
| **Dashboard** | Thống kê doanh thu (ngày / tháng / tổng), tỷ lệ hoàn tất đơn, top sản phẩm, biểu đồ theo tháng |
| **Quản lý sản phẩm** | Pizza (kích thước, đế), Gà rán, Khai vị, Đồ uống, Combo |
| **Quản lý đơn hàng** | Danh sách đơn, lọc theo trạng thái / thanh toán, cập nhật trạng thái, xem chi tiết |
| **Quản lý người dùng** | Danh sách khách hàng, phân quyền |
| **Realtime** | Nhận đơn mới qua Socket.IO (`join:admin` room), không cần reload trang |
| **Xác thực** | Đăng nhập qua Clerk (hỗ trợ OAuth, email/password) |

---

## Yêu cầu môi trường

| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | 20 LTS trở lên |
| npm | 10+ (đi kèm Node 20) |
| MongoDB | Atlas hoặc tự host (MongoDB 6+) |

> **Không** bắt buộc cài Prisma CLI toàn cục — lệnh `prisma` đã có trong `devDependencies`.

---

## Cài đặt & chạy dự án

### 1. Clone & cài dependencies

```bash
git clone https://github.com/NGUYEN-THI-HUYNH-NHU/pizzapalace-admin.git
cd pizzapalace-admin
npm install
```

> `npm install` sẽ tự động chạy `prisma generate` (postinstall hook).

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
# Mở .env và điền các giá trị thực tế (xem phần bên dưới)
```

### 3. Chạy development

Mở **hai terminal** song song:

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Realtime Socket.IO server
npm run dev:realtime
```

- Ứng dụng admin: [http://localhost:3000](http://localhost:3000)
- Realtime server: `http://localhost:4001`

### 4. Build production

```bash
npm run build
npm run start
```

---

## Cấu hình biến môi trường

Sao chép `.env.example` thành `.env` và điền đầy đủ các giá trị:

```dotenv
# --- Database ---
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>"

# --- Clerk (xác thực) ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/sign-in

# --- Cloudinary (upload ảnh) ---
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# --- SMTP / Email ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME="Pizza Palace"

# --- Realtime Socket.IO ---
NEXT_PUBLIC_REALTIME_URL=http://localhost:4001  # URL phía trình duyệt truy cập
REALTIME_SERVER_URL=http://localhost:4001        # URL Next.js gọi nội bộ
REALTIME_EMIT_SECRET=pp-realtime-dev-secret     # Đổi thành giá trị ngẫu nhiên trên production
REALTIME_PORT=4001
REALTIME_ALLOWED_ORIGINS=*                       # Trên production: liệt kê domain cụ thể
```

> **Lưu ý:** File `.env` đã được thêm vào `.gitignore` — **không commit** file này lên repository.

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Khởi động Next.js ở chế độ development (hot-reload) |
| `npm run dev:realtime` | Khởi động server Socket.IO độc lập (cổng 4001) |
| `npm run build` | Build ứng dụng cho production |
| `npm run start` | Chạy bản build production |
| `npm run lint` | Chạy ESLint kiểm tra toàn bộ code |
| `npx prisma studio` | Mở giao diện GUI xem/chỉnh sửa dữ liệu MongoDB |
| `npx prisma generate` | Tái tạo Prisma Client sau khi thay đổi schema |

---

**Lưu ý production quan trọng:**

- Đặt `REALTIME_ALLOWED_ORIGINS` thành domain thực tế, **không dùng `*`**.
- Đặt `REALTIME_EMIT_SECRET` thành một chuỗi ngẫu nhiên mạnh (ví dụ: `openssl rand -hex 32`).
- Đảm bảo Clerk dashboard đã thêm domain production vào danh sách cho phép.
- Cấu hình Nginx/Caddy để reverse proxy cả port 3000 (Next.js) và 4001 (Socket.IO) với hỗ trợ WebSocket (`Upgrade` header).

---

## License

Mọi quyền thuộc về tác giả gốc.
