using System.Security.Claims;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Areas.Student.Services;
using WebApplication1.Areas.Student.ViewModel;
using WebApplication1.Models;
using WebApplication1.Models.VNPay;
using WebApplication1.Services;

namespace WebApplication1.Areas.Student.Controllers
{
    [ApiController]
    [Route("api/student")]
    [Authorize(Roles = "Student")]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AccountController> _logger;
        private readonly Cloudinary _cloudinary;
        private readonly ICartStudent _cartService;
        private readonly IVNPayService _vnPayService;

        public CartController(AppDbContext context, ILogger<AccountController> logger, Cloudinary cloudinary, ICartStudent cartStudent, IVNPayService vnPayService)
        {
            _context = context;
            _logger = logger;
            _cloudinary = cloudinary;
            _cartService = cartStudent;
            _vnPayService = vnPayService;
        }

        [HttpGet]
        [Route("mycart")]
        public async Task<IActionResult> MyCart()
        {
            var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var gioHang = await _context.GioHangs
                .FirstOrDefaultAsync(gh => gh.MaHocSinh == maHocSinh);

            if (gioHang == null)
            {
                return NotFound("Không tìm thấy giỏ hàng.");
            }

            var chiTietGioHangs = await _context.ChiTietGioHangs
                .Where(ctgh => ctgh.MaGioHang == gioHang.MaGioHang)
                .Include(ctgh => ctgh.MaKhoaHocNavigation)
                    .ThenInclude(kh => kh.MaGiaoVienNavigation)
                .ToListAsync();

            int totalItems = chiTietGioHangs.Count;
            decimal totalPrice = chiTietGioHangs.Sum(ctgh => ctgh.MaKhoaHocNavigation.GiaKhoaHoc);

            var viewModel = new MyCartViewModel
            {
                MaGioHang = gioHang.MaGioHang,
                CartItems = chiTietGioHangs.Select(ctgh => ctgh.MaKhoaHocNavigation).ToList(),
                TotalItems = totalItems,
                TotalPrice = totalPrice
            };

            return Ok(viewModel);
        }

        [HttpPost]
        [Route("mycart/requestpaymentvnpay")]
        public async Task<IActionResult> RequestPaymentVNPay(PaymentInformationModel model)
        {
            var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var gioHang = await _context.GioHangs
                    .Include(gh => gh.ChiTietGioHangs)
                    .ThenInclude(ctgh => ctgh.MaKhoaHocNavigation)
                    .FirstOrDefaultAsync(gh => gh.MaHocSinh == maHocSinh);
            if (gioHang == null || !gioHang.ChiTietGioHangs.Any())
            {
                _logger.LogWarning("No cart or empty cart found for user: {UserId}", maHocSinh);
                return BadRequest(new { success = false, message = "Giỏ hàng trống hoặc không tồn tại." });
            }

            var paymentUrl = _vnPayService.CreatePaymentUrl(model, HttpContext);

            if (string.IsNullOrEmpty(paymentUrl))
            {
                _logger.LogError("Failed to create VNPay payment URL.");
                return BadRequest(new { success = false, message = "Không thể tạo yêu cầu thanh toán." });
            }
            _logger.LogInformation("Redirecting to VNPay payment URL: {PaymentUrl}", paymentUrl);
            return Ok(new { success = true, paymentUrl });
        }

        [HttpGet]
        [AllowAnonymous] // VNPay callback needs to be accessible by VNPay redirect
        [Route("mycart/PaymentCallbackVnpay")]
        public async Task<IActionResult> PaymentCallbackVnpay()
        {
            var clientUrl = Environment.GetEnvironmentVariable("CLIENT_URL") ?? "https://224-ltc-03-website-online-course.vercel.app";
            try
            {
                var response = _vnPayService.PaymentExecute(Request.Query);

                if (response == null)
                {
                    _logger.LogWarning("PaymentExecute trả về phản hồi null cho truy vấn: {@Query}", Request.Query);
                    return Redirect($"{clientUrl}/student/cart.html?payment=error&message=No+valid+payment+data+received");
                }

                if (!response.Success || response.VnPayResponseCode != "00")
                {
                    _logger.LogWarning("Thanh toán thất bại hoặc phản hồi không hợp lệ từ VNPay. Phản hồi: {@Response}", response);
                    return Redirect($"{clientUrl}/student/cart.html?payment=error&message={Uri.EscapeDataString(response.Message ?? "Payment failed")}");
                }

                _logger.LogInformation("Thanh toán VNPay thành công. Phản hồi: {@Response}", response);

                // Lấy userId từ OrderDescription hoặc Claims nếu user vẫn giữ session
                // Lưu ý: Do redirect từ VNPay có thể bị mất session Cookie trên một số trình duyệt (Samesite),
                // tốt nhất là lấy userId được lưu trong OrderDescription hoặc dùng Cookie nếu còn.
                // Ở đây chúng ta tạm thời lấy từ User.Identity
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Không tìm thấy người dùng đã xác thực trong PaymentCallbackVnpay. Cố gắng lấy từ OrderDescription");
                    // VNPay OrderDescription chứa thông tin thanh toán, ta có thể dùng cơ chế khác để lưu userId khi khởi tạo payment.
                    // Cho hiện tại, ta giả định session Cookie vẫn tồn tại khi redirect qua localhost.
                    return Redirect($"{clientUrl}/student/cart.html?payment=error&message=User+not+authenticated");
                }

                double amount;
                try
                {
                    amount = response.OrderDescription != null
                        ? double.Parse(response.OrderDescription.Split(' ').Last())
                        : 0;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Không thể phân tích Amount từ OrderDescription: {OrderDescription}", response.OrderDescription);
                    amount = 0;
                }

                var model = new PaymentInformationModel
                {
                    Name = User.Identity?.Name ?? "Unknown",
                    Amount = amount,
                    OrderDescription = response.OrderDescription ?? "Thanh toán qua VnPay tại EduLearn",
                    OrderType = "course",
                };

                bool success = await ProcessCartToMyLearning(userId, model);

                if (success)
                {
                    return Redirect($"{clientUrl}/student/my-learning.html?payment=success");
                }
                else
                {
                    return Redirect($"{clientUrl}/student/cart.html?payment=error&message=Failed+to+process+cart");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong PaymentCallbackVnpay. Truy vấn: {@Query}", Request.Query);
                return Redirect($"{clientUrl}/student/cart.html?payment=error&message={Uri.EscapeDataString(ex.Message)}");
            }
        }

        private async Task<bool> ProcessCartToMyLearning(string userId, PaymentInformationModel model)
        {
            var gioHang = await _context.GioHangs
                .Include(gh => gh.ChiTietGioHangs)
                    .ThenInclude(ctgh => ctgh.MaKhoaHocNavigation)
                .FirstOrDefaultAsync(gh => gh.MaHocSinh == userId);

            if (gioHang == null || !gioHang.ChiTietGioHangs.Any())
            {
                _logger.LogWarning("Không tìm thấy giỏ hàng hoặc giỏ hàng trống cho người dùng: {UserId}", userId);
                return false;
            }

            foreach (var chiTiet in gioHang.ChiTietGioHangs)
            {
                var khoaHocHocSinh = new KhoaHocHocSinh
                {
                    MaHocSinh = userId,
                    MaKhoaHoc = chiTiet.MaKhoaHoc,
                    NgayDangKy = DateTime.Now
                };
                _context.KhoaHocHocSinhs.Add(khoaHocHocSinh);
                _context.ChiTietGioHangs.Remove(chiTiet);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        [HttpPost]
        [Route("addtocart")]
        public async Task<IActionResult> AddToCart(string maKhoaHoc)
        {
            try
            {
                var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(maHocSinh))
                {
                    return Unauthorized("Vui lòng đăng nhập.");
                }

                var gioHang = await _context.GioHangs
                    .FirstOrDefaultAsync(gh => gh.MaHocSinh == maHocSinh);

                if (gioHang == null)
                {
                    return NotFound("Không tìm thấy giỏ hàng cho học sinh.");
                }

                await _cartService.AddCourse(gioHang.MaGioHang, maKhoaHoc);

                return Ok(new { success = true, message = "Thêm khóa học vào giỏ hàng thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AddToCart for MaKhoaHoc: {MaKhoaHoc}", maKhoaHoc);
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete]
        [Route("removefromcart")]
        public async Task<IActionResult> RemoveFromCart(string maKhoaHoc)
        {
            try
            {
                var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(maHocSinh))
                {
                    _logger.LogWarning("User not authenticated for DELETE request.");
                    return Unauthorized("Vui lòng đăng nhập để thực hiện hành động này.");
                }

                var gioHang = await _context.GioHangs
                    .FirstOrDefaultAsync(gh => gh.MaHocSinh == maHocSinh);

                if (gioHang == null)
                {
                    _logger.LogWarning("Cart not found for MaHocSinh: {MaHocSinh}", maHocSinh);
                    return NotFound("Giỏ hàng không tồn tại.");
                }

                _logger.LogInformation("Attempting to delete course {MaKhoaHoc} from cart {MaGioHang}", maKhoaHoc, gioHang.MaGioHang);
                await _cartService.DeleteCourse(gioHang.MaGioHang, maKhoaHoc);
                _logger.LogInformation("Course {MaKhoaHoc} deleted successfully from cart {MaGioHang}", maKhoaHoc, gioHang.MaGioHang);

                return Ok(new { success = true, message = "Xóa khóa học thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting course {MaKhoaHoc}: {Message}", maKhoaHoc, ex.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = "Lỗi server: " + ex.Message });
            }
        }
    }
}
