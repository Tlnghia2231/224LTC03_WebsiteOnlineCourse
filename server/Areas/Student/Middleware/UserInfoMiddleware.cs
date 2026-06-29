using System.Security.Claims;
using WebApplication1.Models;

namespace WebApplication1.Areas.Student.Middleware
{
    public class UserInfoMiddleware
    {
        private readonly RequestDelegate _next;

        public UserInfoMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
        {
            if (context.User.Identity != null && context.User.Identity.IsAuthenticated)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var role = context.User.FindFirst(ClaimTypes.Role)?.Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    if (role == "Student")
                    {
                        var hocSinh = dbContext.HocSinhs.FirstOrDefault(h => h.MaHocSinh == userId);
                        if (hocSinh != null)
                        {
                            var userInfo = new
                            {
                                UserName = hocSinh.HoTen ?? hocSinh.DienThoai,
                                Email = hocSinh.Email ?? "Không có email",
                                AvatarUrl = hocSinh.DuongDanAnhDaiDien ?? "https://placehold.co/150x150?text=Avatar",
                                Role = "Student"
                            };
                            context.Items["UserInfo"] = userInfo;
                        }
                        else
                        {
                            // Stale student token (does not exist in DB anymore). Reject request.
                            context.User = new ClaimsPrincipal(new ClaimsIdentity());
                            context.Response.Cookies.Delete("token");
                        }
                    }
                    else if (role == "Admin")
                    {
                        var admin = dbContext.Admins.FirstOrDefault(a => a.MaAdmin == userId);
                        if (admin != null)
                        {
                            var userInfo = new
                            {
                                UserName = admin.HoTen ?? admin.DienThoai,
                                Email = admin.Email ?? "Không có email",
                                AvatarUrl = "https://placehold.co/150x150?text=Admin",
                                Role = "Admin"
                            };
                            context.Items["UserInfo"] = userInfo;
                        }
                        else
                        {
                            // Stale admin token. Reject request.
                            context.User = new ClaimsPrincipal(new ClaimsIdentity());
                            context.Response.Cookies.Delete("token");
                        }
                    }
                }
            }

            await _next(context);
        }
    }

    public static class UserInfoMiddlewareExtensions
    {
        public static IApplicationBuilder UseUserInfo(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<UserInfoMiddleware>();
        }
    }
}
