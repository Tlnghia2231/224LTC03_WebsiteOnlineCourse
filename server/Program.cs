using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using WebApplication1.Areas.Student.Middleware;
using WebApplication1.Areas.Student.Services;
using WebApplication1.Models;
using WebApplication1.Services;


// Load .env file
void LoadEnvFile()
{
    var currentDir = Directory.GetCurrentDirectory();
    var pathsToTry = new[]
    {
        Path.Combine(currentDir, ".env"),
        Path.Combine(currentDir, "..", ".env"),
        Path.Combine(AppContext.BaseDirectory, ".env"),
        Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env")
    };

    foreach (var path in pathsToTry)
    {
        if (File.Exists(path))
        {
            foreach (var line in File.ReadAllLines(path))
            {
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
                var parts = line.Split('=', 2);
                if (parts.Length == 2)
                {
                    var key = parts[0].Trim();
                    var value = parts[1].Trim();
                    Environment.SetEnvironmentVariable(key, value);
                }
            }
            break;
        }
    }
}
LoadEnvFile();

var builder = WebApplication.CreateBuilder(args);

// Ghi đè VNPay config từ Environment Variables nếu có
var vnpayTmnCode = Environment.GetEnvironmentVariable("VNPAY_TMNCODE") ?? builder.Configuration["Vnpay:TmnCode"];
var vnpayHashSecret = Environment.GetEnvironmentVariable("VNPAY_HASHSECRET") 
    ?? Environment.GetEnvironmentVariable("VNPAY_HASHSECERT") 
    ?? builder.Configuration["Vnpay:HashSecret"];
var vnpayUrl = Environment.GetEnvironmentVariable("VNPAY_URL") ?? builder.Configuration["Vnpay:BaseUrl"];
var vnpayCallbackUrl = Environment.GetEnvironmentVariable("VNPAY_CALLBACK_URL") ?? builder.Configuration["Vnpay:PaymentBackReturnUrl"];

if (!string.IsNullOrEmpty(vnpayTmnCode)) builder.Configuration["Vnpay:TmnCode"] = vnpayTmnCode;
if (!string.IsNullOrEmpty(vnpayHashSecret)) builder.Configuration["Vnpay:HashSecret"] = vnpayHashSecret;
if (!string.IsNullOrEmpty(vnpayUrl)) builder.Configuration["Vnpay:BaseUrl"] = vnpayUrl;
if (!string.IsNullOrEmpty(vnpayCallbackUrl)) builder.Configuration["Vnpay:PaymentBackReturnUrl"] = vnpayCallbackUrl;

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Cấu hình CORS cho phép Client gọi API
var clientUrl = Environment.GetEnvironmentVariable("CLIENT_URL");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        var allowedOrigins = new List<string> { "http://localhost:5173", "http://127.0.0.1:5173" };
        if (!string.IsNullOrEmpty(clientUrl))
        {
            allowedOrigins.Add(clientUrl.TrimEnd('/'));
        }
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Cấu hình Cloudinary từ Environment Variables hoặc appsettings.json
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.AddSingleton<Cloudinary>(provider =>
{
    var cloudinaryCloudName = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUDNAME") ?? builder.Configuration["CloudinarySettings:CloudName"];
    var cloudinaryApiKey = Environment.GetEnvironmentVariable("CLOUDINARY_APIKEY") ?? builder.Configuration["CloudinarySettings:ApiKey"];
    var cloudinaryApiSecret = Environment.GetEnvironmentVariable("CLOUDINARY_SECRETKEY") 
        ?? Environment.GetEnvironmentVariable("CLOUDINARY_APISECRET") 
        ?? builder.Configuration["CloudinarySettings:ApiSecret"];

    if (string.IsNullOrEmpty(cloudinaryCloudName) || string.IsNullOrEmpty(cloudinaryApiKey) || string.IsNullOrEmpty(cloudinaryApiSecret))
    {
        var settings = provider.GetRequiredService<IOptions<CloudinarySettings>>().Value;
        return new Cloudinary(new Account(settings.CloudName, settings.ApiKey, settings.ApiSecret));
    }
    return new Cloudinary(new Account(cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret));
});
builder.Services.AddScoped<CloudinaryService>();

// Cấu hình DbContext sử dụng biến môi trường hoặc fallback
var dbConnectionStringEnv = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");
var mysqlUnixSocket = Environment.GetEnvironmentVariable("MYSQL_UNIX_SOCKET");
var mysqlServer = Environment.GetEnvironmentVariable("MYSQL_SERVER");
var mysqlPort = Environment.GetEnvironmentVariable("MYSQL_PORT") ?? "3306";
var mysqlUser = Environment.GetEnvironmentVariable("MYSQL_USER");
var mysqlPassword = Environment.GetEnvironmentVariable("MYSQL_PASSWORD");
var mysqlDatabase = Environment.GetEnvironmentVariable("MYSQL_DATABASE");

string connectionString;
if (!string.IsNullOrEmpty(dbConnectionStringEnv))
{
    connectionString = dbConnectionStringEnv;
}
else if (!string.IsNullOrEmpty(mysqlUnixSocket) && !string.IsNullOrEmpty(mysqlUser) && !string.IsNullOrEmpty(mysqlDatabase))
{
    connectionString = $"server=localhost;unix_socket={mysqlUnixSocket};user={mysqlUser};password={mysqlPassword};database={mysqlDatabase}";
}
else if (!string.IsNullOrEmpty(mysqlServer) && !string.IsNullOrEmpty(mysqlUser) && !string.IsNullOrEmpty(mysqlDatabase))
{
    connectionString = $"server={mysqlServer};port={mysqlPort};user={mysqlUser};password={mysqlPassword};database={mysqlDatabase}";
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "server=localhost;port=3306;user=root;password=mysql_root_pw;database=QUANLYKHOAHOC";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 4, 0))));

// Thêm và cấu hình Authentication với JWT Bearer
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration["JwtSettings:Secret"] ?? "EduLearnSecretKey_VeryLongStringWith32BytesLength!";
var jwtKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["token"];
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
    logging.SetMinimumLevel(LogLevel.Debug);
});

builder.Services.AddScoped<ICartStudent, ItemCartStudentService>();
builder.Services.AddScoped<IVNPayService, VNPayService>();

// Thêm Authorization
builder.Services.AddAuthorization();

// Swagger API Documentation Setup
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.MapType<IFormFile>(() => new OpenApiSchema { Type = "string", Format = "binary" });
});

var app = builder.Build();

// Enable Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "EduLearn API v1");
    c.RoutePrefix = "swagger";
});

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Kích hoạt CORS
app.UseCors("AllowClient");

// Thêm middleware cho Authentication và Authorization (ĐÂY LÀ THỨ TỰ ĐÚNG)
app.UseAuthentication();
app.UseUserInfo();
app.UseAuthorization();

// Khớp các Controller API
app.MapControllers();

app.Run();