import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('myCoursesGrid');
    const successAlert = document.getElementById('paymentSuccessAlert');

    // Parse URL params for payment messages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        successAlert.style.display = 'block';
    }

    try {
        const res = await apiFetch('/student/mylearning');
        if (res && res.ok) {
            const data = await res.json();
            
            if (data.featuredCourses && data.featuredCourses.length > 0) {
                grid.innerHTML = data.featuredCourses.map(course => `
                    <div class="course-card" style="background:white; border:1px solid #eee; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                        <div class="course-image" style="position:relative;">
                            <img src="${course.duongDanAnhKhoaHoc || 'https://placehold.co/300x200?text=Course'}" alt="${course.tieuDe}" style="width:100%; height:auto; display:block;">
                            <span class="badge" style="position:absolute; top:12px; left:12px; background:var(--primary-color); color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;">${course.monHoc}</span>
                        </div>
                        <div class="course-content" style="padding:20px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                            <div>
                                <h3 style="margin:0 0 10px 0; font-size:1.1rem; font-weight:600; color:#1e293b; line-height:1.4;">${course.tieuDe}</h3>
                                <p style="margin:0 0 15px 0; font-size:0.85rem; color:#666;"><i class="fas fa-chalkboard-teacher"></i> Giảng viên: ${course.maGiaoVienNavigation?.hoTen || 'EduLearn'}</p>
                            </div>
                            
                            <a href="/student/lesson-player.html?courseId=${course.maKhoaHoc}" class="btn btn-primary" style="text-align:center; display:block; padding:10px; font-size:0.9rem;">Học Ngay</a>
                        </div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = `
                    <div class="no-courses" style="grid-column:1/-1; text-align:center; padding:50px; background:white; border-radius:8px; border:1px solid #eee;">
                        <i class="fas fa-book-open" style="font-size:3rem; color:#ccc; margin-bottom:15px;"></i>
                        <h3>Kho học tập trống</h3>
                        <p style="color:#666; margin-bottom:20px;">Bạn chưa đăng ký khóa học nào trên hệ thống.</p>
                        <a href="/courses.html" class="btn btn-primary">Tìm khóa học ngay</a>
                    </div>
                `;
            }
        } else {
            grid.innerHTML = '<div class="error">Không thể tải danh sách khóa học. Vui lòng đăng nhập lại.</div>';
        }
    } catch (e) {
        console.error('My learning fetch error:', e);
        grid.innerHTML = '<div class="error">Lỗi kết nối máy chủ.</div>';
    }
});
