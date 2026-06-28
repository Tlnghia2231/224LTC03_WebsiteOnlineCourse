using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.Services;

namespace WebApplication1.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/khoahocs")]
    [Authorize(Roles = "Admin")]
    public class KhoaHocsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CloudinaryService _cloudinaryService;

        public KhoaHocsController(AppDbContext context, CloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // GET: api/admin/khoahocs
        [HttpGet]
        public async Task<IActionResult> Index(string? sortOrder, string? searchString, string? teacherName)
        {
            var courses = _context.KhoaHocs.Include(k => k.MaGiaoVienNavigation).AsQueryable();

            if (!string.IsNullOrEmpty(searchString))
            {
                courses = courses.Where(s => s.TieuDe.Contains(searchString));
            }

            if (!string.IsNullOrEmpty(teacherName))
            {
                courses = courses.Where(c => c.MaGiaoVienNavigation.HoTen.Contains(teacherName));
            }

            switch (sortOrder)
            {
                case "name_desc":
                    courses = courses.OrderByDescending(s => s.TieuDe);
                    break;
                case "date_asc":
                    courses = courses.OrderBy(s => s.NgayCapNhat);
                    break;
                case "date_desc":
                    courses = courses.OrderByDescending(s => s.NgayCapNhat);
                    break;
                case "price_asc":
                    courses = courses.OrderBy(s => s.GiaKhoaHoc);
                    break;
                case "price_desc":
                    courses = courses.OrderByDescending(s => s.GiaKhoaHoc);
                    break;
                default:
                    courses = courses.OrderBy(s => s.TieuDe);
                    break;
            }

            return Ok(await courses.ToListAsync());
        }

        // GET: api/admin/khoahocs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Details(string id)
        {
            var khoaHoc = await _context.KhoaHocs
                .Include(k => k.MaGiaoVienNavigation)
                .FirstOrDefaultAsync(m => m.MaKhoaHoc == id);

            if (khoaHoc == null)
            {
                return NotFound("Không tìm thấy khóa học.");
            }

            return Ok(khoaHoc);
        }

        // POST: api/admin/khoahocs
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] KhoaHoc khoaHoc, IFormFile? AnhKhoaHoc)
        {
            if (AnhKhoaHoc != null)
            {
                var imageUrl = _cloudinaryService.UploadImage(AnhKhoaHoc);
                khoaHoc.DuongDanAnhKhoaHoc = imageUrl;
            }

            ModelState.Remove(nameof(KhoaHoc.MaGiaoVienNavigation));

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            _context.Add(khoaHoc);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = khoaHoc });
        }

        // PUT: api/admin/khoahocs/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(string id, [FromForm] KhoaHoc khoaHoc, IFormFile? AnhKhoaHoc)
        {
            if (id != khoaHoc.MaKhoaHoc)
            {
                return BadRequest("ID khóa học không khớp.");
            }

            var khoaHocToUpdate = await _context.KhoaHocs.FindAsync(id);
            if (khoaHocToUpdate == null)
            {
                return NotFound("Không tìm thấy khóa học để cập nhật.");
            }

            ModelState.Remove(nameof(KhoaHoc.MaGiaoVienNavigation));

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            if (AnhKhoaHoc != null && AnhKhoaHoc.Length > 0)
            {
                var imageUrl = await _cloudinaryService.UploadImageAsync(AnhKhoaHoc);
                khoaHocToUpdate.DuongDanAnhKhoaHoc = imageUrl;
            }

            khoaHocToUpdate.MonHoc = khoaHoc.MonHoc;
            khoaHocToUpdate.TieuDe = khoaHoc.TieuDe;
            khoaHocToUpdate.MoTa = khoaHoc.MoTa;
            khoaHocToUpdate.GiaKhoaHoc = khoaHoc.GiaKhoaHoc;
            khoaHocToUpdate.ThoiHan = khoaHoc.ThoiHan;
            khoaHocToUpdate.MaGiaoVien = khoaHoc.MaGiaoVien;
            khoaHocToUpdate.NgayCapNhat = DateTime.Now;

            try
            {
                _context.Update(khoaHocToUpdate);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, data = khoaHocToUpdate });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!KhoaHocExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        // DELETE: api/admin/khoahocs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var khoaHoc = await _context.KhoaHocs.FindAsync(id);
            if (khoaHoc == null)
            {
                return NotFound("Không tìm thấy khóa học.");
            }

            _context.KhoaHocs.Remove(khoaHoc);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Xóa khóa học thành công." });
        }

        private bool KhoaHocExists(string id)
        {
            return _context.KhoaHocs.Any(e => e.MaKhoaHoc == id);
        }
    }
}