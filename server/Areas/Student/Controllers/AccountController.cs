using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WebApplication1.Models;
using WebApplication1.Models.VNPay;
using WebApplication1.Services;

namespace WebApplication1.Areas.Student.Controllers
{
    [ApiController]
    [Route("api/student")]
    [Authorize(Roles = "Student")]
    public class AccountController : ControllerBase
    {
        private readonly ILogger<AccountController> _logger;
        private readonly AppDbContext _context;
        private readonly CloudinaryService _cloudinaryService;
        private readonly IVNPayService _vnPayService;

        public AccountController(ILogger<AccountController> logger, AppDbContext context, CloudinaryService cloudinaryService, IVNPayService vnPayService)
        {
            _logger = logger;
            _context = context;
            _cloudinaryService = cloudinaryService;
            _vnPayService = vnPayService;
        }

        [HttpGet]
        [Route("mylearning")]
        public IActionResult MyLearning()
        {
            var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(maHocSinh))
            {
                return Unauthorized("Vui lòng đăng nhập.");
            }

            var featuredCourses = _context.KhoaHocHocSinhs
                .Where(khhs => khhs.MaHocSinh == maHocSinh)
                .Include(khhs => khhs.MaKhoaHocNavigation)
                .ThenInclude(kh => kh.MaGiaoVienNavigation)
                .Select(khhs => khhs.MaKhoaHocNavigation)
                .ToList();

            var viewModel = new
            {
                FeaturedCourses = featuredCourses ?? new List<KhoaHoc>()
            };
            return Ok(viewModel);
        }

        [HttpGet]
        [Route("profile")]
        public IActionResult Profile()
        {
            var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(maHocSinh))
            {
                return Unauthorized("Vui lòng đăng nhập.");
            }

            var hocSinh = _context.HocSinhs
                .FirstOrDefault(hs => hs.MaHocSinh == maHocSinh);

            if (hocSinh == null)
            {
                return NotFound("Không tìm thấy thông tin học sinh.");
            }

            return Ok(hocSinh);
        }

        [HttpPost]
        [Route("profile")]
        public async Task<IActionResult> Profile([FromForm] HocSinh model, [FromForm] IFormFile? AvatarFile)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var hocSinh = await _context.HocSinhs
                .FirstOrDefaultAsync(h => h.MaHocSinh == userId);

            if (hocSinh == null)
            {
                _logger.LogWarning("HocSinh not found for userId: {UserId}", userId);
                return BadRequest(new { success = false, message = "Không tìm thấy thông tin học sinh" });
            }

            // Cập nhật các trường từ model nếu có giá trị
            if (!string.IsNullOrEmpty(model.HoTen))
            {
                hocSinh.HoTen = model.HoTen;
            }
            if (!string.IsNullOrEmpty(model.Email))
            {
                hocSinh.Email = model.Email;
            }
            if (!string.IsNullOrEmpty(model.DienThoai))
            {
                hocSinh.DienThoai = model.DienThoai;
            }
            if (model.NgaySinh.HasValue)
            {
                hocSinh.NgaySinh = model.NgaySinh;
            }
            if (!string.IsNullOrEmpty(model.GioiTinh))
            {
                hocSinh.GioiTinh = model.GioiTinh;
            }
            if (!string.IsNullOrEmpty(model.DiaChi))
            {
                hocSinh.DiaChi = model.DiaChi;
            }

            // Xử lý tải lên ảnh đại diện nếu có file
            if (AvatarFile != null && AvatarFile.Length > 0)
            {
                if (AvatarFile.Length > 5 * 1024 * 1024)
                {
                    return BadRequest(new { success = false, message = "Kích thước file không được vượt quá 5MB" });
                }

                try
                {
                    var avatarUrl = await _cloudinaryService.UploadFileAsync(AvatarFile, CloudinaryService.UploadType.Avatar);
                    hocSinh.DuongDanAnhDaiDien = avatarUrl;
                    _logger.LogInformation("Avatar uploaded successfully. URL: {Url}", avatarUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi tải ảnh lên Cloudinary.");
                    return BadRequest(new { success = false, message = $"Lỗi khi tải ảnh lên: {ex.Message}" });
                }
            }
            else if (string.IsNullOrEmpty(model.DuongDanAnhDaiDien))
            {
                hocSinh.DuongDanAnhDaiDien = null;
            }

            try
            {
                _context.Update(hocSinh);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Profile updated successfully for MaHocSinh: {MaHocSinh}", hocSinh.MaHocSinh);
                return Ok(new
                {
                    success = true,
                    message = "Cập nhật thông tin thành công",
                    hoTen = hocSinh.HoTen,
                    maHocSinh = hocSinh.MaHocSinh
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi cập nhật thông tin hồ sơ học sinh.");
                return BadRequest(new { success = false, message = $"Lỗi khi lưu thông tin: {ex.Message}" });
            }
        }
    }
}