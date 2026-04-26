# 🍕 Pizza Palace — Trang Quản Trị (Admin Dashboard)

Hệ thống quản trị nội bộ dành cho chuỗi pizza **Pizza Palace**, xây dựng trên nền [Next.js 16](https://nextjs.org) với TypeScript, kết hợp MongoDB (Prisma), xác thực Clerk và thông báo thời gian thực qua Socket.IO.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Kiến trúc thư mục](#kiến-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt & chạy dự án](#cài-đặt--chạy-dự-án)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Scripts](#scripts)
- [Triển khai](#triển-khai)
- [Đóng góp](#đóng-góp)
- [License](#license)

---

## Tổng quan

Pizza Palace Admin là ứng dụng quản trị **chỉ dành cho nhân viên/admin** của hệ thống Pizza Palace. Ứng dụng cho phép:

- Xem tổng quan kinh doanh theo thời gian thực (doanh thu, đơn hàng, khách hàng).
- Quản lý toàn bộ menu: pizza, gà rán, khai vị, đồ uống, combo.
- Xử lý và theo dõi vòng đời đơn hàng (từ `PENDING` → `PREPARING` → `DELIVERING` → `COMPLETED`).
- Nhận thông báo đơn hàng mới ngay lập tức qua WebSocket.
- Quản lý người dùng và phân quyền (CUSTOMER / STAFF / ADMIN).

---

## Tính năng

| Nhóm | Chi tiết |
|---|---|
| **Dashboard** | Thống kê doanh thu (ngày / tháng / tổng), tỷ lệ hoàn tất đơn, top sản phẩm, biểu đồ theo tháng |
| **Quản lý sản phẩm** | Pizza (kích thước, đế), Gà rán, Khai vị, Đồ uống, Combo; upload ảnh Cloudinary |
| **Quản lý đơn hàng** | Danh sách đơn, lọc theo trạng thái / thanh toán, cập nhật trạng thái, xem chi tiết |
| **Quản lý cấu hình** | Pizza tag, pizza crust (loại đế), pizza size |
| **Quản lý người dùng** | Danh sách khách hàng, phân quyền |
| **Realtime** | Nhận đơn mới qua Socket.IO (`join:admin` room), không cần reload trang |
| **Xác thực** | Đăng nhập qua Clerk (hỗ trợ OAuth, email/password) |

---

## Kiến trúc thư mục

```
pizzapalace-admin/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Layout + trang đăng nhập (Clerk)
│   ├── (dashboard)/            # Layout chính + tất cả route quản trị
│   │   └── (routes)/
│   │       ├── page.tsx        # Dashboard tổng quan
│   │       ├── orders/         # Quản lý đơn hàng
│   │       ├── pizzas/         # Quản lý pizza
│   │       ├── chickens/       # Gà rán
│   │       ├── appetizers/     # Khai vị
│   │       ├── beverages/      # Đồ uống
│   │       ├── combos/         # Combo
│   │       ├── crusts/         # Loại đế pizza
│   │       ├── tags/           # Pizza tag
│   │       └── components/     # Component dùng riêng cho dashboard
│   └── api/                    # Route Handlers (REST API)
│       ├── auth/               # Đăng nhập tùy chỉnh
│       ├── orders/             # CRUD đơn hàng
│       ├── pizzas/             # CRUD pizza
│       ├── categories/         # Danh mục
│       └── ...
├── actions/                    # Server Actions (Next.js)
├── components/                 # Shared UI components (shadcn/ui + custom)
├── hooks/                      # Custom React hooks
├── lib/                        # Tiện ích: prismadb, email, realtime, utils
├── providers/                  # Context providers (Toast)
├── prisma/
│   └── schema.prisma           # Database schema (MongoDB)
├── public/                     # Tài nguyên tĩnh
├── realtime-server.js          # Server Socket.IO độc lập (Express)
├── .env.example                # Mẫu biến môi trường
├── next.config.ts
├── prisma.config.ts
└── tsconfig.json
```

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

## Triển khai

### Vercel (khuyến nghị cho Next.js)

1. Push code lên GitHub.
2. Import repository vào [Vercel](https://vercel.com/new).
3. Thêm toàn bộ biến môi trường trong **Settings → Environment Variables**.
4. Deploy — Vercel tự động nhận diện Next.js và build.

> **Lưu ý:** `realtime-server.js` là một server Node.js độc lập, **không** chạy được trên Vercel Serverless. Triển khai riêng realtime server lên **Railway**, **Fly.io**, **Render**, hoặc VPS, sau đó cập nhật `NEXT_PUBLIC_REALTIME_URL` và `REALTIME_SERVER_URL` cho phù hợp.

### Tự host (VPS / Docker)

```bash
# Build
npm run build

# Chạy Next.js (khuyến nghị dùng PM2)
pm2 start npm --name "pizzapalace-admin" -- start

# Chạy realtime server
pm2 start realtime-server.js --name "pizzapalace-realtime"
```

**Lưu ý production quan trọng:**

- Đặt `REALTIME_ALLOWED_ORIGINS` thành domain thực tế, **không dùng `*`**.
- Đặt `REALTIME_EMIT_SECRET` thành một chuỗi ngẫu nhiên mạnh (ví dụ: `openssl rand -hex 32`).
- Đảm bảo Clerk dashboard đã thêm domain production vào danh sách cho phép.
- Cấu hình Nginx/Caddy để reverse proxy cả port 3000 (Next.js) và 4001 (Socket.IO) với hỗ trợ WebSocket (`Upgrade` header).

---

## Đóng góp

Mọi đóng góp đều được hoan nghênh! Quy trình đề xuất:

1. Fork repository và tạo nhánh từ `main`:
   ```bash
   git checkout -b feat/ten-tinh-nang
   ```
2. Thực hiện thay đổi, đảm bảo code đã qua lint:
   ```bash
   npm run lint
   ```
3. Commit theo quy ước [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: thêm tính năng lọc đơn hàng theo ngày
   fix: sửa lỗi hiển thị giá combo
   docs: cập nhật README
   refactor: tối ưu query dashboard
   ```
4. Mở Pull Request vào nhánh `main` với mô tả rõ ràng.

**Code style:**
- TypeScript strict mode.
- ESLint cấu hình theo `eslint-config-next` (xem `eslint.config.mjs`).
- Dùng `shadcn/ui` cho các component UI mới.
- Tailwind CSS cho styling — tuân theo utility-first, tránh custom CSS nếu không cần thiết.

---

## License

Dự án này chưa có file LICENSE. Mọi quyền thuộc về tác giả gốc.
