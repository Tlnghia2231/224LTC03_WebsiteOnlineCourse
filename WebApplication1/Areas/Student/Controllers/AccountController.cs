using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;

namespace WebApplication1.Areas.Student.Controllers
{
    [Area("Student")]
    [Authorize(Roles = "Student")]
    public class AccountController : Controller
    {

        private readonly ILogger<AccountController> _logger;
        private readonly AppDbContext _context;

        public AccountController(ILogger<AccountController> logger, AppDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        [Route("/student/mylearning")]
        public IActionResult MyLearning()
        {
            var maHocSinh = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(maHocSinh))
            {
                return RedirectToAction("Login", "Account", new { area = "" });
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
            return View(viewModel);
        }

        [HttpGet]
        [Route("/student/myaccount")]
        public IActionResult MyAccount()
        {
            return View();
        }
    }
}
