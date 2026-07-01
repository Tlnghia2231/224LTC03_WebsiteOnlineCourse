# Website Quản Lý Khóa Học Trực Tuyến - EduLearn

Dự án Website Quản Lý Khóa Học Trực Tuyến (EduLearn) là sản phẩm phục vụ cho học tập và giảng dạy, được xây dựng theo mô hình phân tách rõ ràng giữa Client (Frontend) và Server (Backend API).

## Sinh viên thực hiện
* **Trần Lâm Nghĩa** - MSSV: `22115053122231`
* **Đoàn Kim Nghĩa** - MSSV: `22115053122232`

---

## Demo Trực Tiếp & Tài Khoản Thử Nghiệm

* **Link chạy thử trực tiếp (Frontend):** [https://224-ltc-03-website-online-course.vercel.app](https://224-ltc-03-website-online-course.vercel.app)
* **Link Backend API (Swagger):** [https://edulearn-backend-657921071020.asia-southeast1.run.app/swagger/index.html](https://edulearn-backend-657921071020.asia-southeast1.run.app/swagger/index.html)

### Thông tin thẻ test thanh toán VNPay (Người kiểm thử):
Khi tiến hành thanh toán khóa học qua VNPay ở môi trường Sandbox, vui lòng nhập thông tin thẻ test dưới đây:

| Trường thông tin | Giá trị kiểm thử |
| :--- | :--- |
| **Ngân hàng** | NCB |
| **Số thẻ** | `9704198526191432198` |
| **Tên chủ thẻ** | `NGUYEN VAN A` |
| **Ngày phát hành** | `07/15` |
| **Mật khẩu OTP** | `123456` |

> [!TIP]
> Bạn có thể tự đăng ký một tài khoản Học sinh mới trực tiếp trên giao diện của Website để tiến hành chạy thử và mua khóa học bằng thẻ test VNPay ở trên.

---

## Giới thiệu đề tài
Hệ thống EduLearn được phát triển nhằm mục đích cung cấp một nền tảng học tập trực tuyến tiện ích cho học sinh và hỗ trợ quản trị viên/giáo viên quản lý giáo trình hiệu quả.
Hệ thống hỗ trợ các tính năng chính bao gồm:
* **Dành cho học sinh:** Đăng ký/đăng nhập tài khoản, xem danh sách và chi tiết khóa học, thêm khóa học vào giỏ hàng, thanh toán trực tuyến qua cổng thanh toán **VNPay**, theo dõi tiến độ học tập và xem bài học bằng trình phát video.
* **Dành cho quản trị viên (Admin):** Quản lý khóa học, quản lý danh sách giáo viên, tạo và chỉnh sửa bài giảng, cũng như tải các nội dung đa phương tiện (hình ảnh, video bài giảng) trực tiếp lên đám mây thông qua dịch vụ **Cloudinary**.

---

## Công nghệ sử dụng
### 1. Backend (Server)
* **Framework:** ASP.NET Core 8 Web API.
* **Database:** MySQL.
* **ORM:** Entity Framework Core.
* **Authentication:** JWT (JSON Web Token) được lưu trữ qua HttpOnly Cookie bảo mật cao.
* **Media Storage:** Cloudinary SDK (tải ảnh/video).
* **Payment Gateway:** Tích hợp SDK VNPay Sandbox.

### 2. Frontend (Client)
* **Công nghệ:** HTML5, CSS3, JavaScript (Vanilla JS).
* **Build tool/Dev server:** Vite.
* **Library phụ trợ:** SweetAlert2 (hiển thị thông báo trực quan).

---

## Cấu trúc thư mục dự án (Source Tree)
```
WebsiteOnlineCourse/
├── client/                     # Mã nguồn Frontend (Vite + Vanilla JS)
│   ├── admin/                  # Giao diện quản lý dành cho Admin
│   ├── css/                    # Các file stylesheet của client
│   ├── dist/                   # File build đầu ra của Frontend
│   ├── js/                     # Các file logic Javascript chung
│   ├── public/                 # Các tài nguyên tĩnh (hình ảnh, logo)
│   ├── src/                    # Mã nguồn logic JS/JSX
│   ├── student/                # Giao diện học sinh (Giỏ hàng, Hồ sơ, Học tập)
│   ├── index.html              # Trang chủ
│   ├── signin.html             # Trang đăng nhập
│   ├── signup.html             # Trang đăng ký
│   ├── vite.config.js          # File cấu hình Vite & Proxy
│   └── package.json            # Các thư viện frontend
├── server/                     # Mã nguồn Backend (ASP.NET Core Web API)
│   ├── Areas/                  # Phân chia phân hệ (Admin & Student)
│   │   ├── Admin/              # API & Controllers dành cho quản trị
│   │   └── Student/            # API & Controllers dành cho học sinh
│   ├── Controllers/            # Controllers chung (Home, Payment, Media)
│   ├── Models/                 # Các Entity model ánh xạ database
│   ├── Services/               # Các dịch vụ xử lý logic (VNPay, Cloudinary)
│   ├── appsettings.json        # File cấu hình cấu hình cơ sở dữ liệu và API key mẫu
│   ├── appsettings.Development.json
│   ├── Program.cs              # Điểm khởi chạy ứng dụng & Đăng ký dịch vụ
│   └── server.csproj           # Cấu hình project .NET
├── CSDL.sql                    # File script SQL khởi tạo cơ sở dữ liệu MySQL
├── MySQL_CSDL.sql              # File script SQL thay thế
├── .env                        # File biến môi trường chứa API key và thông tin bí mật (được gitignore)
├── .gitignore                  # Cấu hình bỏ qua các file bí mật khi commit
└── ReadMe.txt                  # Thông tin nhóm thực hiện dự án
```

---

## Hướng dẫn cài đặt và chạy dự án

### 1. Cấu hình Cơ sở dữ liệu (MySQL)
* Tạo một cơ sở dữ liệu mới trong MySQL Server của bạn tên là: `QUANLYKHOAHOC`.
* Sử dụng một công cụ quản lý cơ sở dữ liệu (ví dụ: MySQL Workbench, DBeaver, hoặc phpMyAdmin) để import file [CSDL.sql] hoặc [MySQL_CSDL.sql] vào cơ sở dữ liệu vừa tạo.

### 2. Cấu hình Biến môi trường
Tạo một file `.env` ở thư mục gốc của dự án (cùng cấp với thư mục `server` và `client`) nếu chưa có, hoặc cập nhật thông tin kết nối và API Key của bạn:

```env
# Kết nối cơ sở dữ liệu MySQL
MYSQL_SERVER=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=QUANLYKHOAHOC

# Cấu hình VNPay Sandbox
VNPAY_TMNCODE=your_vnpay_tmncode
VNPAY_HASHSECERT=your_vnpay_hashsecret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_CALLBACK_URL=http://localhost:5254/api/student/mycart/PaymentCallbackVnpay

# Cấu hình Cloudinary (Tải lên file ảnh/video)
CLOUDINARY_CLOUDNAME=your_cloudinary_cloudname
CLOUDINARY_APIKEY=your_cloudinary_apikey
CLOUDINARY_SECRETKEY=your_cloudinary_secretkey

# Cấu hình URL Client cho callback chuyển hướng
CLIENT_URL=http://localhost:5173
```

Đồng thời, bạn cũng có thể điền thông tin kết nối cơ sở dữ liệu trong file [server/appsettings.json] nếu cần:
```json
"ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;user=root;password=your_mysql_password;database=QUANLYKHOAHOC"
}
```

### 3. Khởi chạy Backend (Server)
1. Mở một terminal mới và di chuyển vào thư mục `server`.
2. Khởi chạy dự án bằng lệnh:
   ```bash
   dotnet run
   ```
3. Server sẽ chạy mặc định tại cổng `5254` (`http://localhost:5254`). Tài liệu API Swagger sẽ hiển thị tại địa chỉ: `http://localhost:5254/swagger/index.html`.

### 4. Khởi chạy Frontend (Client)
1. Mở một terminal mới khác và di chuyển vào thư mục `client`.
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Chạy dev server của Vite:
   ```bash
   npm run dev
   ```
4. Truy cập giao diện ứng dụng tại: `http://localhost:5173`.
*Lưu ý: Vite đã được cấu hình proxy tự động chuyển tiếp toàn bộ yêu cầu bắt đầu bằng `/api` sang server chạy cổng `5254`.*

---

## Danh sách API (Endpoints API)

Dưới đây là các API chính được cung cấp bởi hệ thống:

### 1. API Xác thực & Người dùng (Authentication)

| Phương thức | Endpoint | Tham số | Mô tả | Quyền |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/signup` | FormBody: `RegisterVM` | Đăng ký tài khoản học sinh mới | Public |
| `POST` | `/api/signin` | FormBody: `LoginVM` | Đăng nhập hệ thống (Học sinh/Admin) | Public |
| `POST` | `/api/signout` | Không | Đăng xuất, xóa cookie JWT | Public |
| `GET` | `/api/auth/me` | Cookie JWT | Lấy thông tin tài khoản hiện tại | Đã đăng nhập |
| `GET` | `/api/homepage` | Không | Lấy dữ liệu hiển thị trang chủ | Public |
| `GET` | `/api/test-secrets`| Không | Kiểm tra trạng thái của các biến môi trường | Public |

### 2. API Dành cho Học sinh (Student Area)

| Phương thức | Endpoint | Tham số | Mô tả | Quyền |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/student/profile` | Không | Xem thông tin chi tiết hồ sơ cá nhân | Học sinh |
| `POST/PATCH`| `/api/student/profile`| Form-data: `UpdateProfileViewModel` | Cập nhật hồ sơ & thay đổi avatar | Học sinh |
| `GET` | `/api/student/mylearning`| Không | Xem danh sách các khóa học đã đăng ký học | Học sinh |
| `GET` | `/api/student/mycart` | Không | Lấy danh sách khóa học có trong giỏ hàng | Học sinh |
| `POST` | `/api/student/addtocart` | Query: `maKhoaHoc` | Thêm một khóa học vào giỏ hàng | Học sinh |
| `DELETE` | `/api/student/removefromcart`| Query: `maKhoaHoc` | Xóa một khóa học khỏi giỏ hàng | Học sinh |
| `POST` | `/api/student/mycart/requestpaymentvnpay`| JSON: `PaymentInformationModel` | Khởi tạo và lấy link thanh toán VNPay | Học sinh |
| `GET` | `/api/student/mycart/PaymentCallbackVnpay`| Query của VNPay | VNPay callback xác thực giao dịch thành công | Public |
| `GET` | `/api/student/lessonplayer/{lessonId}`| Path: `lessonId` (Mã khóa học) | Lấy danh sách bài giảng để học sinh học | Học sinh |
| `GET` | `/api/student/coursepage`| Query: `page`, `pageSize`, `subject`, `search` | Tìm kiếm, lọc và phân trang khóa học | Public |
| `GET` | `/api/student/coursedetail/{id}`| Path: `id` (Mã khóa học) | Xem chi tiết thông tin khóa học | Public |

### 3. API Dành cho Quản trị viên (Admin Area)

| Phương thức | Endpoint | Tham số | Mô tả | Quyền |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Không | Lấy số liệu thống kê chung (Khóa học, Học sinh, Giáo viên) | Admin |
| `GET` | `/api/admin/baihocs` | Query: `maKhoaHoc` | Lấy danh sách bài học của một khóa học | Admin |
| `POST` | `/api/admin/baihocs` | Form-data: `BaiHoc`, `videoFile` | Thêm bài học mới (Upload video lên Cloudinary) | Admin |
| `GET` | `/api/admin/baihocs/{id}` | Path: `id` | Xem chi tiết một bài giảng | Admin |
| `PUT` | `/api/admin/baihocs/{id}` | Path: `id`, Form-data: `BaiHoc`, `videoFile?` | Cập nhật bài học | Admin |
| `DELETE` | `/api/admin/baihocs/{id}` | Path: `id` | Xóa bài học | Admin |
| `GET` | `/api/admin/giaoviens` | Không | Lấy danh sách giáo viên | Admin |
| `POST` | `/api/admin/giaoviens` | Form-data: `GiaoVien`, `AnhDaiDien?` | Thêm giáo viên mới | Admin |
| `PUT` | `/api/admin/giaoviens/{id}`| Path: `id`, Form-data: `GiaoVien`, `AnhDaiDien?`| Cập nhật thông tin giáo viên | Admin |
| `DELETE` | `/api/admin/giaoviens/{id}`| Path: `id` | Xóa giáo viên | Admin |
| `GET` | `/api/admin/khoahocs` | Query: `sortOrder`, `searchString`, `teacherName` | Lấy danh sách khóa học kèm theo tìm kiếm & sắp xếp | Admin |
| `POST` | `/api/admin/khoahocs` | Form-data: `KhoaHoc`, `AnhKhoaHoc?` | Thêm khóa học mới | Admin |
| `PUT` | `/api/admin/khoahocs/{id}`| Path: `id`, Form-data: `KhoaHoc`, `AnhKhoaHoc?`| Cập nhật thông tin khóa học | Admin |
| `DELETE` | `/api/admin/khoahocs/{id}`| Path: `id` | Xóa khóa học | Admin |

### 4. API Tải lên đa phương tiện (Media Controller)

| Phương thức | Endpoint | Tham số | Mô tả | Quyền |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/media/teacher-avatar`| Form: `file`, Query: `maGiaoVien` | Upload ảnh đại diện giáo viên lên Cloudinary | Đã đăng nhập |
| `POST` | `/api/media/course-image`| Form: `file`, Query: `maKhoaHoc` | Upload ảnh bìa khóa học lên Cloudinary | Đã đăng nhập |
| `POST` | `/api/media/lesson-video`| Form: `file`, Query: `maKhoaHoc`, `thuTu`, `tieuDe` | Upload video bài giảng lên Cloudinary | Đã đăng nhập |
