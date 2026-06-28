import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const errorBox = document.getElementById('errorMessage');
    const passwordInput = document.getElementById('Password');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordInput = document.getElementById('ConfirmPassword');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

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

    // Toggle confirm password visibility
    if (confirmPasswordInput && confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', () => {
            const isPassword = confirmPasswordInput.type === 'password';
            confirmPasswordInput.type = isPassword ? 'text' : 'password';
            const icon = confirmPasswordToggle.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const firstName = document.getElementById('FirstName').value.trim();
        const lastName = document.getElementById('LastName').value.trim();
        const dienThoai = document.getElementById('DienThoai').value.trim();
        const email = document.getElementById('Email').value.trim();
        const password = document.getElementById('Password').value;
        const confirmPassword = document.getElementById('ConfirmPassword').value;
        const userType = form.querySelector('input[name="UserType"]:checked').value;

        if (password !== confirmPassword) {
            showError('Mật khẩu và xác nhận mật khẩu không khớp!');
            return;
        }

        const payload = {
            FirstName: firstName,
            LastName: lastName,
            DienThoai: dienThoai,
            Email: email,
            Password: password,
            ConfirmPassword: confirmPassword,
            UserType: userType
        };

        try {
            const res = await apiFetch('/signup', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res && res.ok) {
                const data = await res.json();
                if (data.success) {
                    window.location.href = '/index.html';
                } else {
                    showError(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                showError(errData.message || 'Số điện thoại hoặc email đã được sử dụng.');
            }
        } catch (err) {
            console.error('Signup error:', err);
            showError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        }
    });

    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
    }
});
