import { apiFetch } from './api.js';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', async () => {
    const feedbackForm = document.getElementById('feedbackForm');
    const nameInput = document.getElementById('feedbackName');
    const emailInput = document.getElementById('feedbackEmail');
    const subjectInput = document.getElementById('feedbackSubject');
    const contentInput = document.getElementById('feedbackContent');

    // 1. Fetch Student profile to prefill name & email
    try {
        const res = await apiFetch('/student/profile');
        if (res && res.ok) {
            const data = await res.json();

            nameInput.value = data.hoTen || '';
            emailInput.value = data.email || '';
        } else {
            // If profile cannot be loaded (not logged in), prompt login
            Swal.fire({
                title: 'Yêu cầu đăng nhập',
                text: 'Vui lòng đăng nhập để gửi ý kiến đóng góp.',
                icon: 'warning',
                confirmButtonColor: '#2563eb'
            }).then(() => {
                window.location.href = '/signin.html';
            });
        }
    } catch (e) {
        console.error('Failed to load student profile for feedback:', e);
        Swal.fire({
            title: 'Lỗi',
            text: 'Không thể tải thông tin cá nhân. Vui lòng tải lại trang.',
            icon: 'error',
            confirmButtonColor: '#2563eb'
        });
    }

    // 2. Handle feedback form submission
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const subject = subjectInput.value.trim();

        Swal.fire({
            title: 'Đã gửi ý kiến đóng góp!',
            text: `Cảm ơn ${name}! Ý kiến góp ý của bạn đã được ghi nhận. Ban quản trị EduLearn sẽ xem xét và phản hồi sớm nhất có thể.`,
            icon: 'success',
            confirmButtonColor: '#2563eb'
        });

        // Reset subject and content only, keep profile data prefilled
        subjectInput.value = '';
        contentInput.value = '';
    });
});
