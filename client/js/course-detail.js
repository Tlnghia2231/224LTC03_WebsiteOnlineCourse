import { apiFetch } from './api.js';
import { formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        window.location.href = '/courses.html';
        return;
    }

    const heroInfo = document.getElementById('courseHeroInfo');
    const objectivesList = document.getElementById('objectivesList');
    const requirementsList = document.getElementById('requirementsList');
    const syllabusStats = document.getElementById('syllabusStats');
    const lessonsList = document.getElementById('lessonsList');
    const teacherProfile = document.getElementById('teacherProfileSection');
    const purchaseCard = document.getElementById('purchaseCard');

    try {
        // Fetch course detail from api
        const res = await apiFetch(`/student/coursedetail/${courseId}`);
        if (res && res.ok) {
            const data = await res.json();
            const course = data.course;
            
            // 1. Render Hero Info
            const updatedDate = new Date(course.ngayCapNhat).toLocaleDateString('vi-VN');
            heroInfo.innerHTML = `
                <span class="badge" style="background:#3b82f6; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">${course.monHoc}</span>
                <h1 style="font-size:2.2rem; font-weight:700; margin-top:10px; margin-bottom:15px; line-height:1.2;">${course.tieuDe}</h1>
                <p style="font-size:1.1rem; opacity:0.85; margin-bottom:20px; line-height:1.5;">${course.moTa || 'Chưa có mô tả chi tiết cho khóa học này.'}</p>
                <div class="course-meta" style="display:flex; gap:20px; font-size:0.9rem; opacity:0.8; flex-wrap:wrap;">
                    <span><i class="fas fa-user-tie"></i> Giảng viên: <strong>${course.maGiaoVienNavigation?.hoTen || 'Đội ngũ EduLearn'}</strong></span>
                    <span><i class="fas fa-calendar-alt"></i> Cập nhật gần nhất: ${updatedDate}</span>
                </div>
            `;

            // 2. Render Objectives (What you'll learn)
            if (course.mucTieuKhoaHocs && course.mucTieuKhoaHocs.length > 0) {
                objectivesList.innerHTML = course.mucTieuKhoaHocs.map(goal => `
                    <li style="display:flex; align-items:flex-start; gap:8px;">
                        <i class="fas fa-check" style="color:#22c55e; margin-top:3px; font-size:0.9rem;"></i>
                        <span style="font-size:0.95rem; color:#444;">${goal.noiDung}</span>
                    </li>
                `).join('');
            } else {
                objectivesList.innerHTML = `
                    <li style="display:flex; align-items:flex-start; gap:8px;">
                        <i class="fas fa-check" style="color:#22c55e; margin-top:3px; font-size:0.9rem;"></i>
                        <span style="font-size:0.95rem; color:#444;">Nắm vững kiến thức cốt lõi và các chuyên đề trọng tâm môn học</span>
                    </li>
                    <li style="display:flex; align-items:flex-start; gap:8px;">
                        <i class="fas fa-check" style="color:#22c55e; margin-top:3px; font-size:0.9rem;"></i>
                        <span style="font-size:0.95rem; color:#444;">Rèn luyện tư duy phản biện, phương pháp giải trắc nghiệm và tự luận nhanh</span>
                    </li>
                `;
            }

            // 3. Render Requirements
            if (course.yeuCauKhoaHocs && course.yeuCauKhoaHocs.length > 0) {
                requirementsList.innerHTML = course.yeuCauKhoaHocs.map(req => `
                    <li style="margin-bottom:8px;">${req.noiDung}</li>
                `).join('');
            } else {
                requirementsList.innerHTML = `
                    <li style="margin-bottom:8px;">Kiến thức cơ bản về bộ môn trong chương trình học phổ thông.</li>
                    <li style="margin-bottom:8px;">Máy tính hoặc điện thoại có kết nối internet để theo dõi video bài học.</li>
                `;
            }

            // 4. Render Lessons (Syllabus)
            const lessons = course.baiHocs || [];
            syllabusStats.innerHTML = `${lessons.length} bài học • Thời hạn học ${course.thoiHan || 365} ngày`;
            
            if (lessons.length > 0) {
                // Sort lessons by ThuTu
                lessons.sort((a, b) => a.thuTu - b.thuTu);
                lessonsList.innerHTML = lessons.map(lesson => `
                    <div class="lesson-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:#fff; border-bottom:1px solid #eee; font-size:0.95rem; color:#333;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="far fa-play-circle" style="color:#666;"></i>
                            <span>Bài ${lesson.thuTu}: ${lesson.tieuDe}</span>
                        </div>
                        <span style="color:#666; font-size:0.85rem;"><i class="far fa-clock"></i> Video</span>
                    </div>
                `).join('');
            } else {
                lessonsList.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Khóa học đang được cập nhật chương trình bài giảng.</div>';
            }

            // 5. Render Teacher Bio
            const teacher = course.maGiaoVienNavigation;
            if (teacher) {
                teacherProfile.innerHTML = `
                    <h3 style="margin-bottom:15px;">Thông tin giảng viên</h3>
                    <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
                        <img src="${teacher.duongDanAnhDaiDien || 'https://placehold.co/150x150?text=Avatar'}" alt="${teacher.hoTen}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:1px solid #ddd;">
                        <div style="flex:1; min-width:200px;">
                            <h4 style="margin:0 0 5px 0; font-size:1.1rem; color:#1e293b;">${teacher.hoTen}</h4>
                            <p style="margin:0 0 10px 0; font-size:0.85rem; color:#666;"><i class="fas fa-envelope"></i> ${teacher.email || ''} • <i class="fas fa-phone"></i> ${teacher.dienThoai || ''}</p>
                            <p style="margin:0; font-size:0.9rem; color:#444; line-height:1.5;">${teacher.gioiThieu || 'Đội ngũ giáo viên chuyên nghiệp nhiều năm kinh nghiệm ôn thi học sinh giỏi và luyện thi đại học.'}</p>
                        </div>
                    </div>
                `;
            }

            // 6. Render Purchase Sidebar Card
            setupPurchaseCard(course, data.inCourse);
        } else {
            heroInfo.innerHTML = '<div class="error">Không thể tải thông tin khóa học.</div>';
        }
    } catch (err) {
        console.error('Course details fetch error:', err);
        heroInfo.innerHTML = '<div class="error">Lỗi kết nối máy chủ.</div>';
    }

    function setupPurchaseCard(course, inCourseStatus) {
        let actionBtnHtml = '';
        
        if (inCourseStatus === 'inYourCourse') {
            actionBtnHtml = `
                <a href="/student/lesson-player.html?courseId=${course.maKhoaHoc}" class="btn btn-primary btn-block" style="text-align:center; padding:12px; display:block;">Vào Học Ngay</a>
            `;
        } else if (inCourseStatus === 'inYourCart') {
            actionBtnHtml = `
                <a href="/student/cart.html" class="btn btn-outline btn-block" style="text-align:center; padding:12px; display:block; border-color:var(--primary-color); color:var(--primary-color);">Vào Giỏ Hàng</a>
            `;
        } else {
            actionBtnHtml = `
                <button id="addToCartBtn" class="btn btn-primary btn-block" style="padding:12px;">Đăng Ký Khóa Học</button>
            `;
        }

        purchaseCard.innerHTML = `
            <div class="course-thumbnail" style="margin-bottom:20px; border-radius:8px; overflow:hidden; border:1px solid #ddd;">
                <img src="${course.duongDanAnhKhoaHoc || 'https://placehold.co/300x200?text=Course'}" alt="${course.tieuDe}" style="width:100%; height:auto; display:block;">
            </div>
            <div class="price-container" style="display:flex; align-items:baseline; gap:10px; margin-bottom:20px;">
                <span style="font-size:1.8rem; font-weight:700; color:#1e293b;">${formatPrice(course.giaKhoaHoc)}</span>
            </div>
            
            <div class="action-container" style="margin-bottom:25px;">
                ${actionBtnHtml}
            </div>

            <h4 style="margin-top:0; margin-bottom:12px; font-size:0.95rem; font-weight:600;">Khóa học này bao gồm:</h4>
            <ul class="features-list" style="list-style:none; padding:0; margin:0; font-size:0.9rem; color:#444; display:flex; flex-direction:column; gap:10px;">
                <li><i class="fas fa-file-video" style="width:20px; color:#666;"></i> Giáo án video chi tiết</li>
                <li><i class="fas fa-file-download" style="width:20px; color:#666;"></i> Tài liệu ôn thi tải về kèm theo</li>
                <li><i class="fas fa-infinity" style="width:20px; color:#666;"></i> Quyền truy cập trọn thời hạn</li>
                <li><i class="fas fa-mobile-alt" style="width:20px; color:#666;"></i> Học được trên máy tính và điện thoại</li>
            </ul>
        `;

        // Bind addToCart event
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', async () => {
                try {
                    // Check auth first by seeing if we get unauthorized
                    const res = await apiFetch(`/student/addtocart?maKhoaHoc=${course.maKhoaHoc}`, {
                        method: 'POST'
                    });

                    if (res && res.status === 401) {
                        window.location.href = '/signin.html';
                        return;
                    }

                    if (res && res.ok) {
                        const resData = await res.json();
                        if (resData.success) {
                            alert('Đã thêm khóa học vào giỏ hàng thành công!');
                            // Replace button with Go to Cart
                            const actionContainer = purchaseCard.querySelector('.action-container');
                            actionContainer.innerHTML = `
                                <a href="/student/cart.html" class="btn btn-outline btn-block" style="text-align:center; padding:12px; display:block; border-color:var(--primary-color); color:var(--primary-color);">Vào Giỏ Hàng</a>
                            `;
                        } else {
                            alert(resData.message || 'Lỗi khi thêm vào giỏ hàng.');
                        }
                    } else {
                        const err = await res.json().catch(() => ({}));
                        alert(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
                    }
                } catch (e) {
                    console.error('Cart add error:', e);
                    alert('Lỗi kết nối máy chủ.');
                }
            });
        }
    }
});
