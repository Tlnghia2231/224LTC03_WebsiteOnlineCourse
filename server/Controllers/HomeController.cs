using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.ViewModels;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api")]
    public class HomeController : ControllerBase
    {
        private readonly ILogger<HomeController> _logger;
        private readonly AppDbContext _context;
        private readonly PasswordHasher<object> _passwordHasher;

        public HomeController(ILogger<HomeController> logger, AppDbContext context)
        {
            _logger = logger;
            _context = context;
            _passwordHasher = new PasswordHasher<object>();
        }

        [HttpGet]
        [Route("homepage")]
        public IActionResult HomePage()
        {
            var featuredCourses = _context.KhoaHocs
                .Include(k => k.MaGiaoVienNavigation)
                .Take(6)
                .ToList();

            var subjects = _context.KhoaHocs
                .GroupBy(k => k.MonHoc)
                .Select(g => new { Subject = g.Key, Count = g.Count() })
                .ToList();

            var viewModel = new
            {
                FeaturedCourses = featuredCourses,
                Subjects = subjects
            };

            return Ok(viewModel);
        }

        [HttpGet]
        [Route("auth/me")]
        public IActionResult GetCurrentUser()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                if (HttpContext.Items.ContainsKey("UserInfo"))
                {
                    return Ok(new { isAuthenticated = true, userInfo = HttpContext.Items["UserInfo"] });
                }
                else
                {
                    var maUser = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var role = User.FindFirst(ClaimTypes.Role)?.Value;
                    var name = User.Identity.Name;
                    return Ok(new 
                    { 
                        isAuthenticated = true, 
                        userInfo = new 
                        {
                            UserName = name,
                            Email = "",
                            AvatarUrl = "https://placehold.co/150x150?text=Avatar",
                            Role = role
                        }
                    });
                }
            }
            return Ok(new { isAuthenticated = false });
        }

        [HttpPost]
        [Route("signup")]
        public async Task<IActionResult> SignUp(RegisterVM model)
        {
            _logger.LogInformation("Received UserType: {UserType}", model.UserType);
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu đăng ký không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            // Kiểm tra và gán giá trị cho HoTen
            if (string.IsNullOrWhiteSpace(model.LastName) || string.IsNullOrWhiteSpace(model.FirstName))
            {
                return BadRequest(new { success = false, message = "Họ và Tên không được để trống." });
            }

            // Kiểm tra UserType
            if (string.IsNullOrWhiteSpace(model.UserType))
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn loại người dùng (Học Sinh hoặc Admin)." });
            }

            if (model.UserType == "student")
            {
                // Kiểm tra số điện thoại và email đã tồn tại trong bảng HocSinh
                if (await _context.HocSinhs.AnyAsync(h => h.DienThoai == model.DienThoai))
                {
                    return BadRequest(new { success = false, message = "Số điện thoại đã được đăng ký cho học sinh." });
                }

                if (await _context.HocSinhs.AnyAsync(h => h.Email == model.Email))
                {
                    return BadRequest(new { success = false, message = "Email đã được đăng ký cho học sinh." });
                }

                // Tạo đối tượng HocSinh, để MaHocSinh là null để trigger tự tạo
                var hocSinh = new HocSinh
                {
                    MaHocSinh = "temp",
                    DienThoai = model.DienThoai,
                    HoTen = model.HoTen,
                    Email = model.Email,
                    PassHash = _passwordHasher.HashPassword(null, model.Password),
                    NgayDangKy = DateTime.Now
                };
                await _context.HocSinhs.AddAsync(hocSinh);
                await _context.SaveChangesAsync();

                var savedHocSinh = await _context.HocSinhs
                    .FirstOrDefaultAsync(h => h.Email == hocSinh.Email && h.DienThoai == hocSinh.DienThoai);

                if (savedHocSinh == null)
                {
                    return BadRequest(new { success = false, message = "Đã xảy ra lỗi khi lưu thông tin sinh viên." });
                }

                // Đăng nhập ngay sau khi đăng ký
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, model.HoTen ?? model.DienThoai),
                    new Claim(ClaimTypes.NameIdentifier, savedHocSinh.MaHocSinh),
                    new Claim(ClaimTypes.Role, "Student")
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = false,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30)
                };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                return Ok(new { success = true, userType = "student", message = "Đăng ký và đăng nhập thành công." });
            }
            else if (model.UserType == "admin")
            {
                return BadRequest(new { success = false, message = "Hệ thống tự động đăng ký Admin hiện không khả dụng." });
            }

            return BadRequest(new { success = false, message = "Loại người dùng không hợp lệ." });
        }

        [HttpPost]
        [Route("signin")]
        public async Task<IActionResult> SignIn(LoginVM model)
        {
            _logger.LogInformation("Received UserType: {UserType}", model.UserType);
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu đăng nhập không hợp lệ." });
            }

            if (string.IsNullOrWhiteSpace(model.UserType))
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn loại người dùng (Học Sinh hoặc Admin)." });
            }

            if (model.UserType == "student")
            {
                // Kiểm tra trong bảng HocSinh
                var hocSinh = await _context.HocSinhs.FirstOrDefaultAsync(h => h.DienThoai == model.DienThoai);
                if (hocSinh == null)
                {
                    return BadRequest(new { success = false, message = "Số điện thoại không tồn tại trong danh sách học sinh." });
                }

                // Kiểm tra mật khẩu
                var verificationResult = _passwordHasher.VerifyHashedPassword(null, hocSinh.PassHash, model.Password);
                if (verificationResult != PasswordVerificationResult.Success)
                {
                    return BadRequest(new { success = false, message = "Mật khẩu không đúng." });
                }

                // Đăng nhập
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, hocSinh.HoTen ?? hocSinh.DienThoai),
                    new Claim(ClaimTypes.NameIdentifier, hocSinh.MaHocSinh),
                    new Claim(ClaimTypes.Role, "Student")
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30)
                };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                return Ok(new { success = true, userType = "student", message = "Đăng nhập thành công." });
            }
            else if (model.UserType == "admin")
            {
                // Kiểm tra trong bảng Admin
                var admin = await _context.Admins.FirstOrDefaultAsync(a => a.DienThoai == model.DienThoai);
                if (admin == null)
                {
                    return BadRequest(new { success = false, message = "Số điện thoại không tồn tại trong danh sách admin." });
                }

                // Kiểm tra mật khẩu
                var verificationResult = _passwordHasher.VerifyHashedPassword(null, admin.PassHash, model.Password);
                if (verificationResult != PasswordVerificationResult.Success)
                {
                    return BadRequest(new { success = false, message = "Mật khẩu không đúng." });
                }

                // Đăng nhập
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, admin.HoTen ?? admin.DienThoai),
                    new Claim(ClaimTypes.NameIdentifier, admin.MaAdmin),
                    new Claim(ClaimTypes.Role, "Admin")
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30)
                };

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity), authProperties);

                return Ok(new { success = true, userType = "admin", message = "Đăng nhập admin thành công." });
            }

            return BadRequest(new { success = false, message = "Loại người dùng không hợp lệ." });
        }

        [HttpPost]
        [Route("signout")]
        public async Task<IActionResult> SignOutUser()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { success = true, message = "Đăng xuất thành công." });
        }
    }
}