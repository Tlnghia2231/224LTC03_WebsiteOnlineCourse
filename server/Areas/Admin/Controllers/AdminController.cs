using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using WebApplication1.ViewModel;
using WebApplication1.ViewModels;

namespace WebApplication1.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Route("dashboard")]
        public IActionResult Dashboard()
        {
            try
            {
                var viewModel = new AdminDashboardVM
                {
                    SoLuongKhoaHoc = _context.KhoaHocs.Count(),
                    SoLuongHocVien = _context.HocSinhs.Count(),
                    SoLuongGiaoVien = _context.GiaoViens.Count()
                };

                return Ok(viewModel);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { success = false, message = ex.Message });
            }
        }
    }
}
