import { apiFetch } from './api.js';
import { formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Disclaimer Modal Logic
    const disclaimerModal = document.getElementById('disclaimerModal');
    const acceptDisclaimerBtn = document.getElementById('acceptDisclaimerBtn');
    if (disclaimerModal && acceptDisclaimerBtn) {
        const isAccepted = localStorage.getItem('disclaimer_accepted');
        if (!isAccepted) {
            disclaimerModal.classList.remove('hidden');
        }
        acceptDisclaimerBtn.addEventListener('click', () => {
            disclaimerModal.classList.add('hidden');
            localStorage.setItem('disclaimer_accepted', 'true');
        });
    }

    const featuredGrid = document.getElementById('featuredCoursesGrid');
    const subjectsGrid = document.getElementById('subjectsGrid');

    try {
        const res = await apiFetch('/homepage');
        if (res && res.ok) {
            const data = await res.json();
            
            // 1. Render Featured Courses
            if (data.featuredCourses && data.featuredCourses.length > 0) {
                featuredGrid.innerHTML = data.featuredCourses.map(course => `
                    <a href="/course-detail.html?id=${course.maKhoaHoc}" class="course-card">
                        <div class="course-image">
                            <img src="${course.duongDanAnhKhoaHoc || 'https://placehold.co/300x200?text=Course'}" alt="${course.tieuDe}">
                            <span class="badge">${course.monHoc}</span>
                        </div>
                        <div class="course-content">
                            <h3>${course.tieuDe}</h3>
                            <p>${course.moTa || 'Chưa có mô tả ngắn'}</p>
                            <div class="course-meta">
                                <div class="meta-item">
                                    <i class="fas fa-clock"></i>
                                    <span>${course.thoiHan || 365} ngày</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-book-open"></i>
                                    <span>Bài giảng</span>
                                </div>
                                <div class="meta-item">
                                    <i class="fas fa-users"></i>
                                    <span>Học viên</span>
                                </div>
                            </div>
                        </div>
                        <div class="course-footer">
                            <div class="course-rating">
                                <div class="stars">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <span>(5.0)</span>
                            </div>
                            <div class="course-price">${formatPrice(course.giaKhoaHoc)}</div>
                        </div>
                    </a>
                `).join('');
            } else {
                featuredGrid.innerHTML = '<div class="no-data">Hiện tại chưa có khóa học nổi bật nào.</div>';
            }

            // 2. Render Subjects
            if (data.subjects && data.subjects.length > 0) {
                subjectsGrid.innerHTML = data.subjects.map(subject => `
                    <a href="/courses.html?subject=${encodeURIComponent(subject.subject)}" class="category-card">
                        <div class="category-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <h3>${subject.subject}</h3>
                        <p>${subject.count} khóa học</p>
                    </a>
                `).join('');
            } else {
                subjectsGrid.innerHTML = '<div class="no-data">Không có danh mục môn học nào.</div>';
            }
        } else {
            featuredGrid.innerHTML = '<div class="error">Không thể tải dữ liệu khóa học.</div>';
        }
    } catch (err) {
        console.error('Index load error:', err);
        featuredGrid.innerHTML = '<div class="error">Đã xảy ra lỗi khi kết nối máy chủ.</div>';
    }
});
