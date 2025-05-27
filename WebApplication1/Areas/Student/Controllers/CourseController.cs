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
    [Area("Student")]
    [Authorize(Roles = "Student")]
    public class CourseController : Controller
    {
        private readonly AppDbContext _context;
        private readonly Cloudinary _cloudinary;

        public CourseController(AppDbContext context, Cloudinary cloudinary)
        {
            _context = context;
            _cloudinary = cloudinary;
        }

        [HttpGet]
        [Route("/student/coursepage")]
        public IActionResult CoursePage()
        {
            var featuredCourses = _context.KhoaHocs
                .Include(k => k.MaGiaoVienNavigation)
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

            return View(viewModel);
        }

        [HttpGet]
        [Route("/student/coursedetail/{id}")]
        public async Task<IActionResult> CourseDetail(string id)
        {
            // Tìm khóa học theo MaKhoaHoc
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

            // Lấy các khóa học liên quan (cùng MonHoc, không bao gồm khóa học hiện tại)
            var relatedCourses = await _context.KhoaHocs
                .Where(c => c.MonHoc == course.MonHoc && c.MaKhoaHoc != id)
                .Take(4)
                .ToListAsync();

            // Dữ liệu tĩnh
            var includes = new List<string>
            {
                "65 giờ video theo yêu cầu",
                "85 tài liệu có thể tải xuống",
                "Truy cập trọn đời",
                "Chứng chỉ hoàn thành"
            };

            // Lấy thời lượng video từ Cloudinary
            var videoDurations = new Dictionary<string, int>();
            foreach (var lesson in course.BaiHocs)
            {
                if (!string.IsNullOrEmpty(lesson.LinkVideo))
                {
                    try
                    {
                        // Giả định LinkVideo có dạng: https://res.cloudinary.com/your-cloud-name/video/upload/public_id.mp4
                        var publicId = lesson.LinkVideo.Split('/').Last().Split('.').First(); // Lấy public_id từ URL
                        var videoInfo = await _cloudinary.GetResourceAsync(new GetResourceParams(publicId)
                        {
                            ResourceType = ResourceType.Video // Sử dụng enum ResourceType.Video thay vì chuỗi "video"
                        });

                        if (videoInfo.StatusCode == System.Net.HttpStatusCode.OK)
                        {
                            // Thời lượng video tính bằng giây, chuyển sang phút
                            int durationSeconds = (int)(videoInfo.JsonObj["duration"]?.Value<double>() ?? 0);
                            int durationMinutes = (int)Math.Ceiling(durationSeconds / 60.0);
                            videoDurations[lesson.MaBaiHoc] = durationSeconds;
                        }
                        else
                        {
                            videoDurations[lesson.MaBaiHoc] = 10; // Giả lập nếu không lấy được
                        }
                    }
                    catch
                    {
                        videoDurations[lesson.MaBaiHoc] = 10; // Giả lập nếu có lỗi
                    }
                }
                else
                {
                    videoDurations[lesson.MaBaiHoc] = 10; // Giả lập nếu không có link
                }
            }

            // Tạo view model
            var viewModel = new CoursePageViewModel
            {
                Course = course,
                RelatedCourses = relatedCourses,
                Includes = includes,
                VideoDurations = videoDurations
            };

            return View(viewModel);
        }

    }
}
