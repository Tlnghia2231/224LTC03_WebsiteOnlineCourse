import { apiFetch } from './api.js';
import { formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    const coursesGrid = document.getElementById('coursesGrid');
    const subjectList = document.getElementById('subjectFilterList');
    const searchInput = document.getElementById('searchInput');

    let allCourses = [];
    let selectedSubject = '';
    let searchQuery = '';

    // Read initial filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get('subject');
    if (subjectParam) {
        selectedSubject = decodeURIComponent(subjectParam);
    }

    try {
        const res = await apiFetch('/student/coursepage');
        if (res && res.ok) {
            const data = await res.json();
            allCourses = data.featuredCourses || [];
            
            // 1. Populate Subject Filters
            if (data.subjects && data.subjects.length > 0) {
                const subjectItemsHtml = data.subjects.map(sub => `
                    <li style="margin-bottom: 10px;">
                        <a href="#" class="subject-link ${selectedSubject === sub.subject ? 'active' : ''}" data-subject="${sub.subject}" style="text-decoration: none; color: #555; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center;">
                            <span>${sub.subject}</span>
                            <span style="font-size: 0.8rem; background: #eee; padding: 2px 6px; border-radius: 10px; color: #666;">${sub.count}</span>
                        </a>
                    </li>
                `).join('');
                
                subjectList.innerHTML += subjectItemsHtml;
            }

            // Bind click handlers to subject links
            bindSubjectClickHandlers();

            // 2. Initial Render
            renderCourses();
        } else {
            coursesGrid.innerHTML = '<div class="error">Không thể tải danh sách khóa học.</div>';
        }
    } catch (err) {
        console.error('Courses fetch error:', err);
        coursesGrid.innerHTML = '<div class="error">Lỗi kết nối máy chủ.</div>';
    }

    // Bind search inputs
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderCourses();
    });

    function bindSubjectClickHandlers() {
        const links = subjectList.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                links.forEach(l => l.classList.remove('active'));
                
                link.classList.add('active');
                selectedSubject = link.getAttribute('data-subject') || '';
                renderCourses();
            });
        });
    }

    function renderCourses() {
        // Filter in-memory
        const filtered = allCourses.filter(course => {
            const matchesSubject = !selectedSubject || course.monHoc === selectedSubject;
            const matchesSearch = !searchQuery || 
                                  course.tieuDe.toLowerCase().includes(searchQuery) ||
                                  (course.moTa && course.moTa.toLowerCase().includes(searchQuery));
            return matchesSubject && matchesSearch;
        });

        if (filtered.length > 0) {
            coursesGrid.innerHTML = filtered.map(course => `
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
            coursesGrid.innerHTML = '<div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">Không tìm thấy khóa học nào phù hợp.</div>';
        }
    }
});
