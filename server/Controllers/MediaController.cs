using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.Services;
using System.Threading.Tasks;
using System;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/media")]
    public class MediaController : ControllerBase
    {
        private readonly CloudinaryService _cloudinaryService;
        private readonly AppDbContext _context;

        public MediaController(CloudinaryService _cloudinaryService, AppDbContext _context)
        {
            this._cloudinaryService = _cloudinaryService;
            this._context = _context;
        }

        // Upload ảnh đại diện giáo viên
        [HttpPost]
        [Route("teacher-avatar")]
        public async Task<IActionResult> UploadTeacherAvatar(IFormFile file, string maGiaoVien)
        {
            try
            {
                if (file != null && file.Length > 0)
                {
                    var avatarUrl = await _cloudinaryService.UploadFileAsync(file, CloudinaryService.UploadType.Avatar);
                    var teacher = await _context.GiaoViens.FindAsync(maGiaoVien);
                    if (teacher != null)
                    {
                        teacher.DuongDanAnhDaiDien = avatarUrl;
                        await _context.SaveChangesAsync();
                        return Ok(new { success = true, message = "Upload ảnh đại diện thành công!", url = avatarUrl });
                    }
                    return NotFound(new { success = false, message = "Không tìm thấy giáo viên." });
                }
                return BadRequest(new { success = false, message = "Vui lòng chọn file để upload." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // Upload ảnh khóa học
        [HttpPost]
        [Route("course-image")]
        public async Task<IActionResult> UploadCourseImage(IFormFile file, string maKhoaHoc)
        {
            try
            {
                if (file != null && file.Length > 0)
                {
                    var imageUrl = await _cloudinaryService.UploadFileAsync(file, CloudinaryService.UploadType.CourseImage);
                    var course = await _context.KhoaHocs.FindAsync(maKhoaHoc);
                    if (course != null)
                    {
                        course.DuongDanAnhKhoaHoc = imageUrl;
                        await _context.SaveChangesAsync();
                        return Ok(new { success = true, message = "Upload ảnh khóa học thành công!", url = imageUrl });
                    }
                    return NotFound(new { success = false, message = "Không tìm thấy khóa học." });
                }
                return BadRequest(new { success = false, message = "Vui lòng chọn file để upload." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }

        // Upload video bài học
        [HttpPost]
        [Route("lesson-video")]
        public async Task<IActionResult> UploadLessonVideo(IFormFile file, string maKhoaHoc, int thuTu, string tieuDe)
        {
            try
            {
                if (file != null && file.Length > 0)
                {
                    var videoUrl = await _cloudinaryService.UploadFileAsync(file, CloudinaryService.UploadType.Video);
                    var lesson = new BaiHoc
                    {
                        MaKhoaHoc = maKhoaHoc,
                        ThuTu = thuTu,
                        TieuDe = tieuDe,
                        LinkVideo = videoUrl,
                        NgayTao = DateTime.Now
                    };
                    _context.BaiHocs.Add(lesson);
                    await _context.SaveChangesAsync();
                    return Ok(new { success = true, message = "Upload video bài học thành công!", url = videoUrl, data = lesson });
                }
                return BadRequest(new { success = false, message = "Vui lòng chọn file để upload." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi: {ex.Message}" });
            }
        }
    }
}