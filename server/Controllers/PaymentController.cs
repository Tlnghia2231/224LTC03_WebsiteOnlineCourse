using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.VNPay;
using WebApplication1.Services;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IVNPayService _vnPayService;

        public PaymentController(IVNPayService vnPayService)
        {
            _vnPayService = vnPayService;
        }

        [HttpPost]
        [Route("CreatePaymentUrlVnpay")]
        public IActionResult CreatePaymentUrlVnpay(PaymentInformationModel model)
        {
            var url = _vnPayService.CreatePaymentUrl(model, HttpContext);
            if (string.IsNullOrEmpty(url))
            {
                return BadRequest("Không thể tạo liên kết thanh toán VNPay.");
            }
            return Ok(new { success = true, paymentUrl = url });
        }
    }
}
