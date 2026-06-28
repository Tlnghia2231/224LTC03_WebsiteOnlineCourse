import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');

    if (!courseId) {
        window.location.href = '/student/my-learning.html';
        return;
    }

    const video = document.getElementById('lessonVideo');
    const lessonTitle = document.getElementById('lessonTitle');
    const courseName = document.getElementById('courseName');
    const instructorName = document.getElementById('instructorName');
    const sidebarTitle = document.getElementById('sidebarCourseTitle');
    const sidebarList = document.getElementById('sidebarLessonsList');

    let allLessons = [];
    let currentActiveIndex = 0;

    try {
        const res = await apiFetch(`/student/lessonplayer/${courseId}`);
        if (res && res.ok) {
            const data = await res.json();
            
            sidebarTitle.textContent = data.course.tieuDe;
            if (courseName) {
                courseName.innerHTML = `<strong>Tên khóa học:</strong> ${data.course.tieuDe}`;
            }
            if (instructorName) {
                instructorName.innerHTML = `<strong>Giảng viên:</strong> ${data.course.maGiaoVienNavigation?.hoTen || 'EduLearn'}`;
            }
            
            allLessons = data.lessons || [];

            if (allLessons.length > 0) {
                // Sắp xếp bài học
                allLessons.sort((a, b) => a.thuTu - b.thuTu);
                
                // Render danh sách bài học sử dụng các class của giao diện mới
                sidebarList.innerHTML = allLessons.map((lesson, index) => `
                    <div class="player-lesson-item" data-index="${index}">
                        <div class="player-lesson-item-left">
                            <i class="far fa-circle pending-icon"></i>
                            <span class="player-lesson-item-title">Bài ${lesson.thuTu}: ${lesson.tieuDe}</span>
                        </div>
                        <div class="player-lesson-item-status-icon"></div>
                    </div>
                `).join('');

                // Gắn sự kiện click
                const items = sidebarList.querySelectorAll('.player-lesson-item');
                items.forEach(item => {
                    item.addEventListener('click', () => {
                        const idx = parseInt(item.getAttribute('data-index'), 10);
                        playLesson(idx);
                    });
                });

                // Phát bài học đầu tiên mặc định
                playLesson(0);
            } else {
                sidebarList.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.7;">Khóa học chưa có bài giảng nào.</div>';
                lessonTitle.textContent = 'Khóa học chưa có bài giảng nào';
            }
        } else {
            alert('Không có quyền truy cập khóa học này hoặc không tìm thấy.');
            window.location.href = '/student/my-learning.html';
        }
    } catch (e) {
        console.error('Lesson player fetch error:', e);
    }

    function playLesson(index) {
        if (index < 0 || index >= allLessons.length) return;
        
        currentActiveIndex = index;
        const lesson = allLessons[index];

        // Cập nhật video nguồn và phát
        video.src = lesson.linkVideo;
        video.load();
        video.play().catch(e => console.log('Autoplay blocked by browser:', e));

        // Cập nhật tiêu đề bài học
        lessonTitle.textContent = `Bài ${lesson.thuTu}: ${lesson.tieuDe}`;

        // Làm nổi bật bài học hiện tại và hiển thị trạng thái checkmark cho bài học trước
        const items = sidebarList.querySelectorAll('.player-lesson-item');
        items.forEach((item, idx) => {
            const leftIcon = item.querySelector('.player-lesson-item-left i');
            const rightStatus = item.querySelector('.player-lesson-item-status-icon');
            
            item.classList.remove('active');
            
            if (idx === index) {
                // Bài học đang học
                item.classList.add('active');
                if (leftIcon) {
                    leftIcon.className = 'fas fa-play-circle active-icon';
                }
                if (rightStatus) {
                    rightStatus.innerHTML = '';
                }
            } else if (idx < index) {
                // Bài học đã hoàn thành trước đó
                if (leftIcon) {
                    leftIcon.className = 'fas fa-check-circle completed-icon';
                }
                if (rightStatus) {
                    rightStatus.innerHTML = '<i class="fas fa-check-circle completed"></i>';
                }
            } else {
                // Bài học kế tiếp
                if (leftIcon) {
                    leftIcon.className = 'far fa-circle pending-icon';
                }
                if (rightStatus) {
                    rightStatus.innerHTML = '';
                }
            }
        });
    }
});
