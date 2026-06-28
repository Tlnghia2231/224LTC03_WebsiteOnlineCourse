import { apiFetch } from './api.js';
import { formatPrice } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('courseTableBody');
    const searchInput = document.getElementById('courseSearch');
    const sortSelect = document.getElementById('sortSelect');
    
    // Modal elements
    const modal = document.getElementById('courseModal');
    const form = document.getElementById('courseForm');
    const formMode = document.getElementById('formMode');
    const modalTitle = document.getElementById('modalTitle');
    const maKhoaHocGroup = document.getElementById('maKhoaHocGroup');
    const modalAlert = document.getElementById('modalAlert');
    const teacherSelect = document.getElementById('MaGiaoVien');
    
    const addBtn = document.getElementById('addCourseBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const saveBtn = document.getElementById('saveCourseBtn');

    let allCourses = [];
    let teachers = [];

    // Load Teachers first for dropdowns
    await loadTeachers();
    // Load Courses list
    await loadCourses();

    async function loadTeachers() {
        try {
            const res = await apiFetch('/admin/giaoviens');
            if (res && res.ok) {
                teachers = await res.json();
                teacherSelect.innerHTML = '<option value="">Chọn giảng viên...</option>' + 
                    teachers.map(t => `<option value="${t.maGiaoVien}">${t.hoTen} (${t.maGiaoVien})</option>`).join('');
            }
        } catch (e) {
            console.error('Failed to load teachers:', e);
        }
    }

    async function loadCourses() {
        try {
            const sortOrder = sortSelect.value;
            const search = searchInput.value.trim();
            
            let query = `?sortOrder=${sortOrder}`;
            if (search) {
                query += `&searchString=${encodeURIComponent(search)}`;
            }

            const res = await apiFetch(`/admin/khoahocs${query}`);
            if (res && res.ok) {
                allCourses = await res.json();
                renderTable(allCourses);
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Lỗi khi tải danh sách khóa học.</td></tr>';
            }
        } catch (e) {
            console.error('Error loading courses:', e);
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Lỗi kết nối máy chủ.</td></tr>';
        }
    }

    function renderTable(courses) {
        if (courses.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Không tìm thấy khóa học nào.</td></tr>';
            return;
        }

        tableBody.innerHTML = courses.map(course => `
            <tr>
                <td><strong>${course.maKhoaHoc}</strong></td>
                <td><img src="${course.duongDanAnhKhoaHoc || 'https://placehold.co/300x200?text=Course'}" alt="Thumb" style="width: 50px; height: auto; border-radius: 4px; border: 1px solid #ddd;"></td>
                <td><span style="font-weight: 600; color: #1e293b;">${course.tieuDe}</span></td>
                <td><span class="badge-subject">${course.monHoc}</span></td>
                <td><strong>${formatPrice(course.giaKhoaHoc)}</strong></td>
                <td>${course.thoiHan || 365}</td>
                <td>${course.maGiaoVienNavigation?.hoTen || course.maGiaoVien}</td>
                <td style="text-align: center;">
                    <div class="action-btns" style="justify-content: center;">
                        <a href="/admin/lessons.html?courseId=${course.maKhoaHoc}" class="btn btn-outline" style="padding: 5px 10px; font-size: 0.8rem;" title="Quản lý bài giảng">
                            <i class="fas fa-video"></i> Bài học
                        </a>
                        <button class="btn btn-text btn-edit" data-id="${course.maKhoaHoc}" style="padding: 5px 10px; font-size: 0.8rem; color: #3b82f6;" title="Sửa khóa học">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-text btn-delete" data-id="${course.maKhoaHoc}" style="padding: 5px 10px; font-size: 0.8rem; color: #ef4444;" title="Xóa khóa học">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind Action buttons
        tableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editCourse(btn.getAttribute('data-id')));
        });
        tableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteCourse(btn.getAttribute('data-id')));
        });
    }

    // Modal Control Bindings
    addBtn.addEventListener('click', () => {
        form.reset();
        formMode.value = 'create';
        modalTitle.textContent = 'Thêm Khóa Học Mới';
        maKhoaHocGroup.style.display = 'block';
        document.getElementById('MaKhoaHoc').required = true;
        modalAlert.style.display = 'none';
        modal.style.display = 'flex';
    });

    const closeModal = () => {
        modal.style.display = 'none';
    };
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Filter Listeners
    searchInput.addEventListener('input', loadCourses);
    sortSelect.addEventListener('change', loadCourses);

    // Edit course trigger
    async function editCourse(id) {
        try {
            const res = await apiFetch(`/admin/khoahocs/${id}`);
            if (res && res.ok) {
                const course = await res.json();
                
                form.reset();
                formMode.value = 'edit';
                modalTitle.textContent = `Chỉnh Sửa Khóa Học: ${course.tieuDe}`;
                
                // Hide MaKhoaHoc group on Edit because ID is key and immutable
                maKhoaHocGroup.style.display = 'none';
                document.getElementById('MaKhoaHoc').required = false;
                
                // Populate fields
                document.getElementById('MaKhoaHoc').value = course.maKhoaHoc;
                document.getElementById('TieuDe').value = course.tieuDe;
                document.getElementById('MonHoc').value = course.monHoc;
                document.getElementById('MoTa').value = course.moTa || '';
                document.getElementById('GiaKhoaHoc').value = course.giaKhoaHoc;
                document.getElementById('ThoiHan').value = course.thoiHan;
                document.getElementById('MaGiaoVien').value = course.maGiaoVien;
                
                modalAlert.style.display = 'none';
                modal.style.display = 'flex';
            }
        } catch (e) {
            console.error('Failed to load course for edit:', e);
        }
    }

    // Delete course trigger
    async function deleteCourse(id) {
        if (confirm(`Bạn có chắc chắn muốn xóa khóa học mã ${id}? Hành động này sẽ xóa toàn bộ bài học đính kèm.`)) {
            try {
                const res = await apiFetch(`/admin/khoahocs/${id}`, { method: 'DELETE' });
                if (res && res.ok) {
                    await loadCourses();
                } else {
                    const err = await res.json().catch(() => ({}));
                    alert(err.message || 'Xóa khóa học thất bại.');
                }
            } catch (e) {
                console.error('Failed to delete course:', e);
            }
        }
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';
        modalAlert.style.display = 'none';

        const mode = formMode.value;
        const id = document.getElementById('MaKhoaHoc').value.trim();

        const formData = new FormData();
        formData.append('MaKhoaHoc', id);
        formData.append('TieuDe', document.getElementById('TieuDe').value.trim());
        formData.append('MonHoc', document.getElementById('MonHoc').value.trim());
        formData.append('MoTa', document.getElementById('MoTa').value.trim());
        formData.append('GiaKhoaHoc', document.getElementById('GiaKhoaHoc').value);
        formData.append('ThoiHan', document.getElementById('ThoiHan').value);
        formData.append('MaGiaoVien', document.getElementById('MaGiaoVien').value);

        const imgFile = document.getElementById('AnhKhoaHoc').files[0];
        if (imgFile) {
            formData.append('AnhKhoaHoc', imgFile);
        }

        try {
            let res;
            if (mode === 'create') {
                res = await apiFetch('/admin/khoahocs', {
                    method: 'POST',
                    body: formData
                });
            } else {
                res = await apiFetch(`/admin/khoahocs/${id}`, {
                    method: 'PUT',
                    body: formData
                });
            }

            if (res && res.ok) {
                closeModal();
                await loadCourses();
            } else {
                const err = await res.json().catch(() => ({}));
                showModalError(err.message || 'Đã xảy ra lỗi khi lưu thông tin.');
            }
        } catch (err) {
            console.error('Save course error:', err);
            showModalError('Không thể kết nối đến máy chủ.');
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
