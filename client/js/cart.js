import { apiFetch } from './api.js';
import { formatPrice } from './main.js';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', async () => {
    const cartList = document.getElementById('cartItemsList');
    const summaryCount = document.getElementById('summaryCount');
    const summaryTotal = document.getElementById('summaryTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const paymentAlert = document.getElementById('paymentAlert');

    let totalPrice = 0;
    let totalItems = 0;

    // Check if redirect returned with payment errors
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const errorMessage = urlParams.get('message');

    if (paymentStatus === 'error' && errorMessage) {
        paymentAlert.textContent = `Thanh toán thất bại: ${decodeURIComponent(errorMessage)}`;
        paymentAlert.style.display = 'block';
    }

    // Initial load
    await loadCart();

    async function loadCart() {
        try {
            const res = await apiFetch('/student/mycart');
            if (res && res.ok) {
                const data = await res.json();
                
                totalPrice = data.totalPrice;
                totalItems = data.totalItems;

                summaryCount.textContent = totalItems;
                summaryTotal.textContent = formatPrice(totalPrice);

                if (data.cartItems && data.cartItems.length > 0) {
                    cartList.innerHTML = data.cartItems.map(item => `
                        <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:20px; border-radius:8px; border:1px solid #eee; margin-bottom:15px; flex-wrap:wrap; gap: 15px;">
                            <div style="display:flex; gap:15px; align-items:center;">
                                <img src="${item.duongDanAnhKhoaHoc || 'https://placehold.co/300x200?text=Course'}" alt="${item.tieuDe}" style="width:80px; height:auto; border-radius:4px; border:1px solid #ddd;">
                                <div>
                                    <h4 style="margin:0 0 5px 0; font-size:1.05rem; font-weight:600;"><a href="/course-detail.html?id=${item.maKhoaHoc}" style="text-decoration:none; color:#1e293b;">${item.tieuDe}</a></h4>
                                    <span style="font-size:0.8rem; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#666;">${item.monHoc}</span>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:20px;">
                                <strong style="color:var(--primary-color); font-size:1.1rem;">${formatPrice(item.giaKhoaHoc)}</strong>
                                <button class="btn-remove" data-id="${item.maKhoaHoc}" style="background:none; border:none; color:#e53e3e; cursor:pointer; font-size:0.9rem;" title="Xóa khỏi giỏ hàng">
                                    <i class="far fa-trash-alt"></i> Xóa
                                </button>
                            </div>
                        </div>
                    `).join('');

                    // Bind delete handlers
                    bindDeleteHandlers();
                    checkoutBtn.disabled = false;
                } else {
                    cartList.innerHTML = `
                        <div class="empty-cart" style="text-align:center; padding:40px; background:white; border-radius:8px; border:1px solid #eee;">
                            <i class="fas fa-shopping-cart" style="font-size:3rem; color:#ccc; margin-bottom:15px;"></i>
                            <h3>Giỏ hàng trống</h3>
                            <p style="color:#666; margin-bottom:20px;">Bạn chưa thêm khóa học nào vào giỏ hàng.</p>
                            <a href="/courses.html" class="btn btn-primary">Khám phá khóa học</a>
                        </div>
                    `;
                    checkoutBtn.disabled = true;
                }
            } else {
                cartList.innerHTML = '<div class="error">Không thể tải giỏ hàng. Vui lòng đăng nhập lại.</div>';
            }
        } catch (e) {
            console.error('Cart fetch error:', e);
            cartList.innerHTML = '<div class="error">Lỗi kết nối máy chủ.</div>';
        }
    }

    function bindDeleteHandlers() {
        const removeButtons = cartList.querySelectorAll('.btn-remove');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                
                Swal.fire({
                    title: 'Xác nhận xóa',
                    text: 'Bạn có chắc muốn xóa khóa học này khỏi giỏ hàng?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc2626',
                    cancelButtonColor: '#475569',
                    confirmButtonText: 'Xóa',
                    cancelButtonText: 'Hủy'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const res = await apiFetch(`/student/removefromcart?maKhoaHoc=${id}`, {
                                method: 'DELETE'
                            });
                            if (res && res.ok) {
                                await loadCart();
                                Swal.fire({
                                    title: 'Đã xóa',
                                    text: 'Khóa học đã được xóa khỏi giỏ hàng.',
                                    icon: 'success',
                                    confirmButtonColor: '#2563eb'
                                });
                            } else {
                                const err = await res.json().catch(() => ({}));
                                Swal.fire({
                                    title: 'Lỗi',
                                    text: err.message || 'Xóa khóa học thất bại.',
                                    icon: 'error',
                                    confirmButtonColor: '#2563eb'
                                });
                            }
                        } catch (err) {
                            console.error('Delete cart item error:', err);
                        }
                    }
                });
            });
        });
    }

    // Handle Checkout Submission
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Đang xử lý...';

        const payload = {
            Name: "Học sinh", // Backend will override with current session name anyway
            Amount: totalPrice,
            OrderDescription: `Thanh toan mua khoa hoc tren EduLearn`,
            OrderType: "course"
        };

        try {
            const res = await apiFetch('/student/mycart/requestpaymentvnpay', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res && res.ok) {
                const data = await res.json();
                if (data.success && data.paymentUrl) {
                    // Redirect directly to VNPay page
                    window.location.href = data.paymentUrl;
                } else {
                    Swal.fire({
                        title: 'Thanh toán thất bại',
                        text: data.message || 'Không thể tạo cổng thanh toán VNPay.',
                        icon: 'error',
                        confirmButtonColor: '#2563eb'
                    });
                    resetCheckoutBtn();
                }
            } else {
                const err = await res.json().catch(() => ({}));
                Swal.fire({
                    title: 'Lỗi',
                    text: err.message || 'Không thể tạo cổng thanh toán VNPay.',
                    icon: 'error',
                    confirmButtonColor: '#2563eb'
                });
                resetCheckoutBtn();
            }
        } catch (err) {
            console.error('Checkout error:', err);
            Swal.fire({
                title: 'Lỗi',
                text: 'Lỗi kết nối khi chuẩn bị thanh toán.',
                icon: 'error',
                confirmButtonColor: '#2563eb'
            });
            resetCheckoutBtn();
        }
    });

    function resetCheckoutBtn() {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Thanh Toán Qua VNPay';
    }
});
