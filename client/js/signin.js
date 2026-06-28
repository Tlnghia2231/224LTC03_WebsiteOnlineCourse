import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const errorBox = document.getElementById('errorMessage');
    const authCard = document.getElementById('authCard');
    const studentRadio = document.getElementById('student');
    const adminRadio = document.getElementById('admin');
    const passwordInput = document.getElementById('Password');
    const passwordToggle = document.getElementById('passwordToggle');

    // Toggle Role admin-mode classes
    if (studentRadio && adminRadio && authCard) {
        studentRadio.addEventListener('change', () => {
            if (studentRadio.checked) {
                authCard.classList.remove('admin-mode');
            }
        });
        adminRadio.addEventListener('change', () => {
            if (adminRadio.checked) {
                authCard.classList.add('admin-mode');
            }
        });
    }

    // Toggle password visibility
    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            const icon = passwordToggle.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const userType = form.querySelector('input[name="UserType"]:checked').value;
        const dienThoai = document.getElementById('DienThoai').value.trim();
        const password = document.getElementById('Password').value;
        const rememberMe = document.getElementById('RememberMe').checked;

        const payload = {
            UserType: userType,
            DienThoai: dienThoai,
            Password: password,
            RememberMe: rememberMe
        };

        try {
            const res = await apiFetch('/signin', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res && res.ok) {
                const data = await res.json();
                if (data.success) {
                    if (data.userType === 'admin') {
                        window.location.href = '/admin/dashboard.html';
                    } else {
                        window.location.href = '/index.html';
                    }
                } else {
                    showError(data.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                showError(errData.message || 'Số điện thoại hoặc mật khẩu không chính xác.');
            }
        } catch (err) {
            console.error('Login error:', err);
            showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        }
    });

    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
    }
});
