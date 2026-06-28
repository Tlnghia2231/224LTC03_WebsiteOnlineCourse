using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.ViewModel;
using WebApplication1.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace WebApplication1.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/baihocs")]
    [Authorize(Roles = "Admin")]
    public class BaiHocsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CloudinaryService _cloudinaryService;

        public BaiHocsController(AppDbContext context, CloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // GET: api/admin/baihocs?maKhoaHoc=KHXXX
        [HttpGet]
        public async Task<IActionResult> Index(string maKhoaHoc)
        {
            if (string.IsNullOrEmpty(maKhoaHoc))
            {
                return BadRequest("Vui lòng cung cấp mã khóa học.");
            }

            var khoaHoc = await _context.KhoaHocs
                                        .Include(kh => kh.BaiHocs)
                                        .FirstOrDefaultAsync(kh => kh.MaKhoaHoc == maKhoaHoc);

            if (khoaHoc == null)
            {
                return NotFound($"Không tìm thấy khóa học với mã: {maKhoaHoc}.");
            }

            var orderedLessons = khoaHoc.BaiHocs.OrderBy(bh => bh.ThuTu).ToList();
            var baiHocDauTien = orderedLessons.FirstOrDefault();

            var viewModel = new ChiTietKhoaHocViewModel
            {
                MaKhoaHoc = khoaHoc.MaKhoaHoc,
                TieuDeKhoaHoc = khoaHoc.TieuDe,
                DanhSachBaiHoc = orderedLessons.Select(bh => new BaiHocViewModel
                {
                    MaBaiHoc = bh.MaBaiHoc,
                    TieuDe = bh.TieuDe ?? "N/A",
                    ThuTu = bh.ThuTu,
                    LinkVideo = bh.LinkVideo
                }).ToList(),
                LinkVideoBanDau = baiHocDauTien?.LinkVideo ?? "#",
                TieuDeBaiHocBanDau = baiHocDauTien?.TieuDe ?? (orderedLessons.Any() ? "N/A" : "Chưa có bài học")
            };

            return Ok(viewModel);
        }

        // POST: api/admin/baihocs
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] BaiHoc baiHoc, IFormFile videoFile)
        {
            if (videoFile == null || videoFile.Length == 0)
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn một video để tải lên." });
            }

            try
            {
                string videoUrl = await _cloudinaryService.UploadFileAsync(videoFile, CloudinaryService.UploadType.Video);
                baiHoc.LinkVideo = videoUrl;
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Lỗi khi tải video lên Cloudinary: {ex.Message}" });
            }

            baiHoc.NgayTao = DateTime.Now;
            baiHoc.MaBaiHoc = "BH" + DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(100, 999);

            ModelState.Remove(nameof(baiHoc.MaBaiHoc));
            ModelState.Remove(nameof(baiHoc.LinkVideo));
            ModelState.Remove(nameof(baiHoc.MaKhoaHocNavigation));

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            _context.Add(baiHoc);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = baiHoc, message = "Thêm bài học mới thành công!" });
        }

        // GET: api/admin/baihocs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Details(string id)
        {
            var baiHoc = await _context.BaiHocs.FindAsync(id);
            if (baiHoc == null)
            {
                return NotFound("Không tìm thấy bài học.");
            }
            return Ok(baiHoc);
        }

        // PUT: api/admin/baihocs/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(string id, [FromForm] BaiHoc baiHoc, IFormFile? videoFile)
        {
            if (id != baiHoc.MaBaiHoc)
            {
                return BadRequest("Mã bài học không khớp.");
            }

            var baiHocToUpdate = await _context.BaiHocs.FindAsync(id);
            if (baiHocToUpdate == null)
            {
                return NotFound("Không tìm thấy bài học để cập nhật.");
            }

            ModelState.Remove(nameof(baiHoc.MaKhoaHocNavigation));
            ModelState.Remove(nameof(baiHoc.LinkVideo));

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            baiHocToUpdate.TieuDe = baiHoc.TieuDe;
            baiHocToUpdate.ThuTu = baiHoc.ThuTu;

            if (videoFile != null && videoFile.Length > 0)
            {
                try
                {
                    string newVideoUrl = await _cloudinaryService.UploadFileAsync(videoFile, CloudinaryService.UploadType.Video);
                    baiHocToUpdate.LinkVideo = newVideoUrl;
                }
                catch (Exception ex)
                {
                    return BadRequest(new { success = false, message = $"Lỗi khi tải video mới lên: {ex.Message}" });
                }
            }

            try
            {
                _context.Update(baiHocToUpdate);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, data = baiHocToUpdate, message = "Cập nhật bài học thành công!" });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BaiHocExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        // DELETE: api/admin/baihocs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var baiHoc = await _context.BaiHocs.FindAsync(id);
            if (baiHoc == null)
            {
                return NotFound("Không tìm thấy bài học.");
            }

            _context.BaiHocs.Remove(baiHoc);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Xóa bài học thành công!" });
        }

        private bool BaiHocExists(string id)
        {
            return _context.BaiHocs.Any(e => e.MaBaiHoc == id);
        }
    }
}
