import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');

    if (!courseId) {
        window.location.href = '/admin/courses.html';
        return;
    }

    const tableBody = document.getElementById('lessonTableBody');
    const courseHeader = document.getElementById('courseTitleHeader');
    const subHeader = document.getElementById('courseSubHeader');
    
    // Modal elements
    const modal = document.getElementById('lessonModal');
    const form = document.getElementById('lessonForm');
    const formMode = document.getElementById('formMode');
    const modalTitle = document.getElementById('modalTitle');
    const maBaiHocInput = document.getElementById('MaBaiHoc');
    const modalAlert = document.getElementById('modalAlert');
    const videoInput = document.getElementById('VideoFile');
    const videoLabel = document.getElementById('videoLabel');
    
    const addBtn = document.getElementById('addLessonBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const saveBtn = document.getElementById('saveLessonBtn');

    let courseData = null;
    let lessons = [];

    await loadLessons();

    async function loadLessons() {
        try {
            const res = await apiFetch(`/admin/baihocs?maKhoaHoc=${courseId}`);
            if (res && res.ok) {
                courseData = await res.json();
                courseHeader.textContent = `Bài học: ${courseData.tieuDeKhoaHoc}`;
                lessons = courseData.danhSachBaiHoc || [];
                subHeader.textContent = `Quản lý và tải lên video bài giảng (${lessons.length} bài học)`;
                renderTable(lessons);
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Lỗi khi tải chương trình học.</td></tr>';
            }
        } catch (e) {
            console.error('Error loading lessons:', e);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Lỗi kết nối máy chủ.</td></tr>';
        }
    }

    function renderTable(lessonsList) {
        if (lessonsList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">Khóa học này chưa có bài học nào.</td></tr>';
            return;
        }

        // Sort lessons by ThuTu
        lessonsList.sort((a, b) => a.thuTu - b.thuTu);

        tableBody.innerHTML = lessonsList.map(lesson => `
            <tr>
                <td><strong>Bài ${lesson.thuTu}</strong></td>
                <td><span style="font-weight: 600; color: #1e293b;">${lesson.tieuDe}</span></td>
                <td><code>${lesson.maBaiHoc}</code></td>
                <td>
                    <a href="${lesson.linkVideo}" target="_blank" style="text-decoration: none; color: var(--primary-color); font-weight: 500;">
                        <i class="fas fa-play"></i> Xem video bài giảng
                    </a>
                </td>
                <td style="text-align: center;">
                    <div class="action-btns" style="justify-content: center;">
                        <button class="btn btn-text btn-edit" data-id="${lesson.maBaiHoc}" style="padding: 5px 10px; font-size: 0.8rem; color: #3b82f6;" title="Sửa bài học">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-text btn-delete" data-id="${lesson.maBaiHoc}" style="padding: 5px 10px; font-size: 0.8rem; color: #ef4444;" title="Xóa bài học">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind Actions
        tableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editLesson(btn.getAttribute('data-id')));
        });
        tableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteLesson(btn.getAttribute('data-id')));
        });
    }

    // Modal Add Bindings
    addBtn.addEventListener('click', () => {
        form.reset();
        formMode.value = 'create';
        modalTitle.textContent = 'Thêm Bài Học Mới';
        
        // Auto calculate next order
        let nextOrder = 1;
        if (lessons.length > 0) {
            nextOrder = Math.max(...lessons.map(l => l.thuTu)) + 1;
        }
        document.getElementById('ThuTu').value = nextOrder;
        
        videoInput.required = true;
        videoLabel.innerHTML = 'Video bài giảng <span style="color:red;">*</span>';
        
        modalAlert.style.display = 'none';
        modal.style.display = 'flex';
    });

    const closeModal = () => {
        modal.style.display = 'none';
    };
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Edit Lesson Trigger
    async function editLesson(id) {
        try {
            const res = await apiFetch(`/admin/baihocs/${id}`);
            if (res && res.ok) {
                const lesson = await res.json();
                
                form.reset();
                formMode.value = 'edit';
                modalTitle.textContent = `Chỉnh Sửa Bài Học: ${lesson.tieuDe}`;
                
                maBaiHocInput.value = lesson.maBaiHoc;
                document.getElementById('TieuDe').value = lesson.tieuDe;
                document.getElementById('ThuTu').value = lesson.thuTu;
                
                videoInput.required = false; // Optional on edit
                videoLabel.textContent = 'Thay đổi video bài giảng (nếu có)';
                
                modalAlert.style.display = 'none';
                modal.style.display = 'flex';
            }
        } catch (e) {
            console.error('Failed to load lesson for edit:', e);
        }
    }

    // Delete Lesson Trigger
    async function deleteLesson(id) {
        if (confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
            try {
                const res = await apiFetch(`/admin/baihocs/${id}`, { method: 'DELETE' });
                if (res && res.ok) {
                    await loadLessons();
                } else {
                    const err = await res.json().catch(() => ({}));
                    alert(err.message || 'Xóa bài học thất bại.');
                }
            } catch (e) {
                console.error('Delete lesson error:', e);
            }
        }
    }

    // Form Submit (Create/Update)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang tải lên...';
        modalAlert.style.display = 'none';

        const mode = formMode.value;
        const id = maBaiHocInput.value;

        const formData = new FormData();
        formData.append('MaKhoaHoc', courseId);
        formData.append('TieuDe', document.getElementById('TieuDe').value.trim());
        formData.append('ThuTu', document.getElementById('ThuTu').value);
        
        if (mode === 'edit') {
            formData.append('MaBaiHoc', id);
        }

        const videoFile = videoInput.files[0];
        if (videoFile) {
            formData.append('videoFile', videoFile);
        }

        try {
            let res;
            if (mode === 'create') {
                res = await apiFetch('/admin/baihocs', {
                    method: 'POST',
                    body: formData
                });
            } else {
                res = await apiFetch(`/admin/baihocs/${id}`, {
                    method: 'PUT',
                    body: formData
                });
            }

            if (res && res.ok) {
                closeModal();
                await loadLessons();
            } else {
                const err = await res.json().catch(() => ({}));
                showModalError(err.message || 'Đã xảy ra lỗi khi lưu bài học.');
            }
        } catch (err) {
            console.error('Save lesson error:', err);
            showModalError('Không thể kết nối đến máy chủ hoặc lỗi upload dung lượng lớn.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Lưu lại';
        }
    });

    function showModalError(message) {
        modalAlert.textContent = message;
        modalAlert.style.display = 'block';
    }
});
