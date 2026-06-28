import { apiFetch } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const courses = document.getElementById('statCourses');
    const students = document.getElementById('statStudents');
    const teachers = document.getElementById('statTeachers');

    try {
        const res = await apiFetch('/admin/dashboard');
        if (res && res.ok) {
            const data = await res.json();
            courses.textContent = data.soLuongKhoaHoc;
            students.textContent = data.soLuongHocVien;
            teachers.textContent = data.soLuongGiaoVien;
        } else {
            console.error('Failed to load dashboard stats.');
        }
    } catch (e) {
        console.error('Dashboard load error:', e);
    }
});
