using System.Security.Claims;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using WebApplication1.Areas.Student.ViewModels;
using WebApplication1.Models;

namespace WebApplication1.Areas.Student.Controllers
{
    [ApiController]
    [Route("api/student")]
    [Authorize(Roles = "Student")]
    public class CourseController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Cloudinary _cloudinary;

        public CourseController(AppDbContext context, Cloudinary cloudinary)
        {
            _context = context;
            _cloudinary = cloudinary;
        }

        [HttpGet]
        [Route("coursepage")]
        [AllowAnonymous]
        public IActionResult CoursePage(int page = 1, int pageSize = 10, string? subject = null, string? search = null)
        {
            var subjects = _context.KhoaHocs
                .GroupBy(k => k.MonHoc)
                .Select(g => new { Subject = g.Key, Count = g.Count() })
                .ToList();

            var query = _context.KhoaHocs.Include(k => k.MaGiaoVienNavigation).AsQueryable();

            if (!string.IsNullOrWhiteSpace(subject))
            {
                query = query.Where(k => k.MonHoc == subject);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(k => k.TieuDe.ToLower().Contains(lowerSearch) || (k.MoTa != null && k.MoTa.ToLower().Contains(lowerSearch)));
            }

            int totalCourses = query.Count();
            int totalPages = (int)Math.Ceiling((double)totalCourses / pageSize);

            var featuredCourses = query
                .OrderBy(k => k.MaKhoaHoc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var viewModel = new
            {
                FeaturedCourses = featuredCourses,
                Subjects = subjects,
                TotalPages = totalPages,
                CurrentPage = page,
                TotalCourses = totalCourses
            };

            return Ok(viewModel);
        }

        [HttpGet]
        [Route("coursedetail/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> CourseDetail(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var course = await _context.KhoaHocs
                .Include(c => c.MaGiaoVienNavigation)
                .Include(c => c.MucTieuKhoaHocs)
                .Include(c => c.YeuCauKhoaHocs)
                .Include(c => c.BaiHocs)
                .FirstOrDefaultAsync(c => c.MaKhoaHoc == id);

            if (course == null)
            {
                return NotFound();
            }

            var relatedCourses = await _context.KhoaHocs
                .Where(c => c.MonHoc == course.MonHoc && c.MaKhoaHoc != id)
                .Take(4)
                .ToListAsync();

            var includes = new List<string>
            {
                "65 giờ video theo yêu cầu",
                "85 tài liệu có thể tải xuống",
                "Truy cập trọn đời",
                "Chứng chỉ hoàn thành"
            };

            string inCourse = "false";
            if (!string.IsNullOrEmpty(userId))
            {
                var isInYourCourse = await _context.KhoaHocHocSinhs
                    .AnyAsync(khhs => khhs.MaHocSinh == userId && khhs.MaKhoaHoc == id);

                if (isInYourCourse)
                {
                    inCourse = "inYourCourse";
                }
                else
                {
                    var gioHang = await _context.GioHangs
                        .FirstOrDefaultAsync(gh => gh.MaHocSinh == userId);

                    if (gioHang != null)
                    {
                        var query = _context.ChiTietGioHangs
                            .Where(ctgh => ctgh.MaGioHang == gioHang.MaGioHang && ctgh.MaKhoaHoc == id);
                        var inCart = await query.AnyAsync();

                        if (inCart)
                        {
                            inCourse = "inYourCart";
                        }
                    }
                }
            }

            var viewModel = new CoursePageViewModel
            {
                Course = course,
                RelatedCourses = relatedCourses,
                Includes = includes,
                InCourse = inCourse
            };

            return Ok(viewModel);
        }
    }
}
