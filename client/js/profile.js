import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('profileForm');
    const avatarInput = document.getElementById('AvatarFile');
    const avatarImg = document.getElementById('profileAvatarImg');
    const nameTitle = document.getElementById('profileNameTitle');
    const statusMsg = document.getElementById('statusMessage');
    const saveBtn = document.getElementById('saveProfileBtn');

    // Load initial student details
    try {
        const res = await apiFetch('/student/profile');
        if (res && res.ok) {
            const data = await res.json();
            
            // Populate titles
            nameTitle.textContent = data.hoTen || 'Học sinh';
            if (data.duongDanAnhDaiDien) {
                avatarImg.src = data.duongDanAnhDaiDien;
            }

            // Populate form
            document.getElementById('HoTen').value = data.hoTen || '';
            document.getElementById('Email').value = data.email || '';
            document.getElementById('DienThoai').value = data.dienThoai || '';
            document.getElementById('GioiTinh').value = data.gioiTinh || 'Nam';
            document.getElementById('DiaChi').value = data.diaChi || '';

            // Handle date format (YYYY-MM-DDTHH:MM:SS -> YYYY-MM-DD)
            if (data.ngaySinh) {
                const dateOnly = data.ngaySinh.split('T')[0];
                document.getElementById('NgaySinh').value = dateOnly;
            }
        }
    } catch (e) {
        console.error('Profile fetch error:', e);
        showStatus('Lỗi tải thông tin hồ sơ.', 'danger');
    }

    // Avatar preview handler
    avatarInput.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Form submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';
        statusMsg.style.display = 'none';

        const formData = new FormData();
        formData.append('HoTen', document.getElementById('HoTen').value.trim());
        formData.append('Email', document.getElementById('Email').value.trim());
        formData.append('DienThoai', document.getElementById('DienThoai').value.trim());
        formData.append('GioiTinh', document.getElementById('GioiTinh').value);
        formData.append('DiaChi', document.getElementById('DiaChi').value.trim());
        
        const dob = document.getElementById('NgaySinh').value;
        if (dob) {
            formData.append('NgaySinh', dob);
        }

        const avatarFile = avatarInput.files[0];
        if (avatarFile) {
            formData.append('AvatarFile', avatarFile);
        }

        try {
            const res = await apiFetch('/student/profile', {
                method: 'POST',
                body: formData
            });

            if (res && res.ok) {
                const data = await res.json();
                if (data.success) {
                    showStatus('Cập nhật hồ sơ thành công!', 'success');
                    nameTitle.textContent = data.hoTen;
                    
                    // Reload main header to reflect avatar changes
                    const headerRes = await apiFetch('/auth/me');
                    if (headerRes && headerRes.ok) {
                        const headerData = await headerRes.json();
                        // Re-render layout actions
                        const userMenu = document.getElementById('userDropdownToggle');
                        if (userMenu && headerData.isAuthenticated) {
                            userMenu.querySelector('.avatar-img').src = headerData.userInfo.avatarUrl;
                            userMenu.querySelector('.user-name').textContent = headerData.userInfo.userName;
                        }
                    }
                } else {
                    showStatus(data.message || 'Cập nhật hồ sơ thất bại.', 'danger');
                }
            } else {
                const err = await res.json().catch(() => ({}));
                showStatus(err.message || 'Đã xảy ra lỗi khi lưu thông tin.', 'danger');
            }
        } catch (err) {
            console.error('Profile save error:', err);
            showStatus('Không thể kết nối đến máy chủ.', 'danger');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Lưu thay đổi';
        }
    });

    function showStatus(msg, type) {
        statusMsg.textContent = msg;
        statusMsg.className = `alert alert-${type}`;
        statusMsg.style.display = 'block';
    }
});
