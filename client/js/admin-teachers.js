import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('teacherTableBody');
    
    // Modal elements
    const modal = document.getElementById('teacherModal');
    const form = document.getElementById('teacherForm');
    const formMode = document.getElementById('formMode');
    const modalTitle = document.getElementById('modalTitle');
    const maGiaoVienGroup = document.getElementById('maGiaoVienGroup');
    const modalAlert = document.getElementById('modalAlert');
    
    const addBtn = document.getElementById('addTeacherBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const saveBtn = document.getElementById('saveTeacherBtn');

    let teachersList = [];

    await loadTeachers();

    async function loadTeachers() {
        try {
            const res = await apiFetch('/admin/giaoviens');
            if (res && res.ok) {
                teachersList = await res.json();
                renderTable(teachersList);
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi khi tải danh sách giáo viên.</td></tr>';
            }
        } catch (e) {
            console.error('Error loading teachers:', e);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Lỗi kết nối máy chủ.</td></tr>';
        }
    }

    function renderTable(list) {
        if (list.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Không có giáo viên nào trên hệ thống.</td></tr>';
            return;
        }

        tableBody.innerHTML = list.map(t => `
            <tr>
                <td><strong>${t.maGiaoVien}</strong></td>
                <td><img src="${t.duongDanAnhDaiDien || 'https://placehold.co/150x150?text=Avatar'}" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd;"></td>
                <td><span style="font-weight: 600; color: #1e293b;">${t.hoTen}</span></td>
                <td>${t.email}</td>
                <td><code>${t.dienThoai}</code></td>
                <td><div style="max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${t.gioiThieu || ''}">${t.gioiThieu || 'Chưa có giới thiệu'}</div></td>
                <td style="text-align: center;">
                    <div class="action-btns" style="justify-content: center;">
                        <button class="btn btn-text btn-edit" data-id="${t.maGiaoVien}" style="padding: 5px 10px; font-size: 0.8rem; color: #3b82f6;" title="Sửa thông tin">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-text btn-delete" data-id="${t.maGiaoVien}" style="padding: 5px 10px; font-size: 0.8rem; color: #ef4444;" title="Xóa giáo viên">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind Action buttons
        tableBody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editTeacher(btn.getAttribute('data-id')));
        });
        tableBody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteTeacher(btn.getAttribute('data-id')));
        });
    }

    // Modal Control Bindings
    addBtn.addEventListener('click', () => {
        form.reset();
        formMode.value = 'create';
        modalTitle.textContent = 'Thêm Giáo Viên Mới';
        maGiaoVienGroup.style.display = 'block';
        document.getElementById('MaGiaoVien').disabled = false;
        document.getElementById('MaGiaoVien').required = true;
        modalAlert.style.display = 'none';
        modal.style.display = 'flex';
    });

    const closeModal = () => {
        modal.style.display = 'none';
    };
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Edit teacher trigger
    async function editTeacher(id) {
        try {
            const res = await apiFetch(`/admin/giaoviens/${id}`);
            if (res && res.ok) {
                const t = await res.json();
                
                form.reset();
                formMode.value = 'edit';
                modalTitle.textContent = `Chỉnh Sửa Giáo Viên: ${t.hoTen}`;
                
                // Keep ID group but disable field on Edit because ID is key
                maGiaoVienGroup.style.display = 'none';
                document.getElementById('MaGiaoVien').required = false;
                
                // Populate fields
                document.getElementById('MaGiaoVien').value = t.maGiaoVien;
                document.getElementById('HoTen').value = t.hoTen;
                document.getElementById('Email').value = t.email;
                document.getElementById('DienThoai').value = t.dienThoai;
                document.getElementById('GioiThieu').value = t.gioiThieu || '';
                
                modalAlert.style.display = 'none';
                modal.style.display = 'flex';
            }
        } catch (e) {
            console.error('Failed to load teacher for edit:', e);
        }
    }

    // Delete teacher trigger
    async function deleteTeacher(id) {
        if (confirm(`Bạn có chắc chắn muốn xóa giáo viên mã ${id}?`)) {
            try {
                const res = await apiFetch(`/admin/giaoviens/${id}`, { method: 'DELETE' });
                if (res && res.ok) {
                    await loadTeachers();
                } else {
                    const err = await res.json().catch(() => ({}));
                    alert(err.message || 'Xóa giáo viên thất bại.');
                }
            } catch (e) {
                console.error('Failed to delete teacher:', e);
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
        const id = document.getElementById('MaGiaoVien').value.trim();

        const formData = new FormData();
        formData.append('MaGiaoVien', id);
        formData.append('HoTen', document.getElementById('HoTen').value.trim());
        formData.append('Email', document.getElementById('Email').value.trim());
        formData.append('DienThoai', document.getElementById('DienThoai').value.trim());
        formData.append('GioiThieu', document.getElementById('GioiThieu').value.trim());

        const imgFile = document.getElementById('AnhDaiDien').files[0];
        if (imgFile) {
            formData.append('AnhDaiDien', imgFile);
        }

        try {
            let res;
            if (mode === 'create') {
                res = await apiFetch('/admin/giaoviens', {
                    method: 'POST',
                    body: formData
                });
            } else {
                res = await apiFetch(`/admin/giaoviens/${id}`, {
                    method: 'PUT',
                    body: formData
                });
            }

            if (res && res.ok) {
                closeModal();
                await loadTeachers();
            } else {
                const err = await res.json().catch(() => ({}));
                showModalError(err.message || 'Đã xảy ra lỗi khi lưu thông tin.');
            }
        } catch (err) {
            console.error('Save teacher error:', err);
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
