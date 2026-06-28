using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models;
using WebApplication1.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace WebApplication1.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/giaoviens")]
    [Authorize(Roles = "Admin")]
    public class GiaoViensController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly CloudinaryService _cloudinaryService;

        public GiaoViensController(AppDbContext context, CloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // GET: api/admin/giaoviens
        [HttpGet]
        public async Task<IActionResult> Index()
        {
            return Ok(await _context.GiaoViens.ToListAsync());
        }

        // GET: api/admin/giaoviens/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> Details(string id)
        {
            var giaoVien = await _context.GiaoViens.FirstOrDefaultAsync(m => m.MaGiaoVien == id);
            if (giaoVien == null)
            {
                return NotFound("Không tìm thấy giáo viên.");
            }
            return Ok(giaoVien);
        }

        // POST: api/admin/giaoviens
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] GiaoVien giaoVien, IFormFile? AnhDaiDien)
        {
            if (AnhDaiDien != null)
            {
                var imageUrl = _cloudinaryService.UploadImage(AnhDaiDien);
                giaoVien.DuongDanAnhDaiDien = imageUrl;
            }

            giaoVien.NgayTao = DateTime.Now;
            ModelState.Remove(nameof(giaoVien.NgayTao));

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            _context.Add(giaoVien);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = giaoVien });
        }

        // PUT: api/admin/giaoviens/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Edit(string id, [FromForm] GiaoVien giaoVien, IFormFile? AnhDaiDien)
        {
            if (id != giaoVien.MaGiaoVien)
            {
                return BadRequest("Mã giáo viên không khớp.");
            }

            var giaoVienCu = await _context.GiaoViens.FindAsync(id);
            if (giaoVienCu == null)
            {
                return NotFound("Không tìm thấy giáo viên để cập nhật.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ.", errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
            }

            if (AnhDaiDien != null && AnhDaiDien.Length > 0)
            {
                var imageUrl = await _cloudinaryService.UploadImageAsync(AnhDaiDien);
                giaoVienCu.DuongDanAnhDaiDien = imageUrl;
            }

            giaoVienCu.HoTen = giaoVien.HoTen;
            giaoVienCu.Email = giaoVien.Email;
            giaoVienCu.DienThoai = giaoVien.DienThoai;
            giaoVienCu.GioiThieu = giaoVien.GioiThieu;

            try
            {
                _context.Update(giaoVienCu);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, data = giaoVienCu });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GiaoVienExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        // DELETE: api/admin/giaoviens/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var giaoVien = await _context.GiaoViens.FindAsync(id);
            if (giaoVien == null)
            {
                return NotFound("Không tìm thấy giáo viên.");
            }

            _context.GiaoViens.Remove(giaoVien);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Xóa giáo viên thành công." });
        }

        private bool GiaoVienExists(string id)
        {
            return _context.GiaoViens.Any(e => e.MaGiaoVien == id);
        }
    }
}
