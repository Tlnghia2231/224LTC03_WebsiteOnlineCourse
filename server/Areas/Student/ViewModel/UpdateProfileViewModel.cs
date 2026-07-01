using System;
using Microsoft.AspNetCore.Http;

namespace WebApplication1.Areas.Student.ViewModel
{
    public class UpdateProfileViewModel
    {
        public string? HoTen { get; set; }
        public string? Email { get; set; }
        public string? DienThoai { get; set; }
        public DateOnly? NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public string? DiaChi { get; set; }
        public IFormFile? AvatarFile { get; set; }
    }
}
