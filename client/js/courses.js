import { apiFetch } from './api.js';
import { formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    const coursesGrid = document.getElementById('coursesGrid');
    const subjectList = document.getElementById('subjectFilterList');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('paginationContainer');

    let currentPage = 1;
    let totalPages = 1;
    const pageSize = 6;
    let selectedSubject = '';
    let searchQuery = '';

    // Read initial filters from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get('subject');
    if (subjectParam) {
        selectedSubject = decodeURIComponent(subjectParam);
    }

    // Initial load
    await fetchCourses(true); // pass true to load subjects list once

    // Bind search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchCourses();
        }, 400); // 400ms debounce to prevent API thrashing
    });

    async function fetchCourses(loadSubjects = false) {
        coursesGrid.innerHTML = '<div class="loading" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">Đang tải danh sách khóa học...</div>';
        
        try {
            const endpoint = `/student/coursepage?page=${currentPage}&pageSize=${pageSize}&subject=${encodeURIComponent(selectedSubject)}&search=${encodeURIComponent(searchQuery)}`;
            const res = await apiFetch(endpoint);
            if (res && res.ok) {
                const data = await res.json();
                
                currentPage = data.currentPage || 1;
                totalPages = data.totalPages || 1;
                
                // 1. Populate Subject Filters (only once or on initial load)
                if (loadSubjects && data.subjects && data.subjects.length > 0) {
                    const subjectItemsHtml = data.subjects.map(sub => `
                        <li style="margin-bottom: 10px;">
                            <a href="#" class="subject-link ${selectedSubject === sub.subject ? 'active' : ''}" data-subject="${sub.subject}" style="text-decoration: none; color: #555; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center;">
                                <span>${sub.subject}</span>
                                <span style="font-size: 0.8rem; background: #eee; padding: 2px 6px; border-radius: 10px; color: #666;">${sub.count}</span>
                            </a>
                        </li>
                    `).join('');
                    
                    subjectList.innerHTML += subjectItemsHtml;
                    bindSubjectClickHandlers();
                }

                // 2. Render Courses
                renderCourses(data.featuredCourses || []);

                // 3. Render Pagination
                renderPagination();
            } else {
                coursesGrid.innerHTML = '<div class="error" style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;">Không thể tải danh sách khóa học.</div>';
            }
        } catch (err) {
            console.error('Courses fetch error:', err);
            coursesGrid.innerHTML = '<div class="error" style="grid-column: 1/-1; text-align: center; padding: 40px; color: red;">Lỗi kết nối máy chủ.</div>';
        }
    }

    function bindSubjectClickHandlers() {
        const links = subjectList.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                links.forEach(l => l.classList.remove('active'));
                
                link.classList.add('active');
                selectedSubject = link.getAttribute('data-subject') || '';
                currentPage = 1; // reset page on filter change
                fetchCourses();
            });
        });
    }

    function renderCourses(courses) {
        if (courses.length > 0) {
            coursesGrid.innerHTML = courses.map(course => `
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

    function renderPagination() {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';
        
        // Prev button
        html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        // Next button
        html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;

        paginationContainer.innerHTML = html;

        // Bind clicks
        const buttons = paginationContainer.querySelectorAll('.pagination-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled') || btn.classList.contains('active')) return;
                const page = parseInt(btn.getAttribute('data-page'), 10);
                currentPage = page;
                fetchCourses();
                
                // Scroll window to top of course grid smoothly
                window.scrollTo({
                    top: coursesGrid.offsetTop - 120,
                    behavior: 'smooth'
                });
            });
        });
    }
});
