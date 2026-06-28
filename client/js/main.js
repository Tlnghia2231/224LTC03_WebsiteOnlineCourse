import { apiFetch } from './api.js';
import Swal from 'sweetalert2';

let isAuthenticated = false;

// Global currency formatting helper
export function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Check session on page load
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Render common Header and Footer structures
    setupHeaderFooter();

    // 2. Fetch User session
    try {
        const res = await apiFetch('/auth/me');
        if (res && res.ok) {
            const data = await res.json();
            updateHeaderForUser(data);
        }
    } catch (e) {
        console.error('Failed to fetch user state:', e);
    }
});

// Create HTML structure for Header and Footer dynamically to avoid repeating them in every file
function setupHeaderFooter() {
    const header = document.querySelector('.site-header');
    if (header) {
        const isStudentArea = window.location.pathname.includes('/student/') ||
            window.location.pathname.includes('my-learning') ||
            window.location.pathname.includes('my-cart') ||
            window.location.pathname.includes('profile') ||
            window.location.pathname.includes('lesson-player');

        const homeUrl = isStudentArea ? '/index.html' : '/index.html';

        header.innerHTML = `
            <div class="container">
                <div class="header-content">
                    <a href="${homeUrl}" class="logo">
                        <img width="auto" height="40" src="/Image/Logo.png" alt="EduLearn Logo" class="logo-badge">
                    </a>

                    <nav class="main-nav">
                        <ul>
                            <li><a href="/courses.html" id="nav-courses">Khóa Học</a></li>
                            <li><a href="/student/my-learning.html" id="nav-mylearning">Khóa học của tôi</a></li>
                            <li><a href="/help.html" id="nav-help">Trợ giúp</a></li>
                            <li><a href="/contact.html" id="nav-contact">Liên Hệ</a></li>
                        </ul>
                    </nav>

                    <div class="header-actions" id="headerActions">
                        <a href="/signin.html" class="btn btn-text">Đăng nhập</a>
                        <a href="/signup.html" class="btn btn-primary">Đăng ký</a>
                    </div>

                    <div class="mobile-actions">
                        <button id="menuToggle" class="icon-button" aria-label="Toggle Menu" style="background:transparent; border:none; cursor:pointer;">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Highlight active link
        const currentPath = window.location.pathname;
        if (currentPath.includes('courses.html')) {
            header.querySelector('#nav-courses')?.classList.add('active');
        } else if (currentPath.includes('my-learning.html')) {
            header.querySelector('#nav-mylearning')?.classList.add('active');
        } else if (currentPath.includes('help.html')) {
            header.querySelector('#nav-help')?.classList.add('active');
        } else if (currentPath.includes('contact.html')) {
            header.querySelector('#nav-contact')?.classList.add('active');
        }

        // Intercept clicks on My Learning when not logged in
        const myLearningLink = header.querySelector('#nav-mylearning');
        if (myLearningLink) {
            myLearningLink.addEventListener('click', (e) => {
                if (!isAuthenticated) {
                    e.preventDefault();
                    Swal.fire({
                        title: 'Yêu cầu đăng nhập',
                        text: 'Bạn phải đăng nhập để xem các khóa học đã mua.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#2563eb',
                        cancelButtonColor: '#475569',
                        confirmButtonText: 'Đăng nhập',
                        cancelButtonText: 'Đóng'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/signin.html';
                        }
                    });
                }
            });
        }

        // Hamburger Menu Toggle
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = header.querySelector('.main-nav');
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
        }
    }

    const footer = document.querySelector('.site-footer');
    if (footer) {
        footer.innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <p class="copyright">© 2025 EduLearn. All rights reserved.</p>
                    <div class="footer-links">
                        <a href="/terms.html">Terms</a>
                        <a href="/privacy.html">Privacy</a>
                        <a href="/contact.html">Contact</a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Update Header according to Authentication State
function updateHeaderForUser(session) {
    const container = document.getElementById('headerActions');
    if (!container) return;

    if (session.isAuthenticated && session.userInfo) {
        isAuthenticated = true; // Update global state
        const user = session.userInfo;

        let cartHtml = '';
        if (user.role === 'Student') {
            cartHtml = `
                <a href="/student/cart.html" class="icon-button cart-button" style="margin-right: 15px; position: relative;">
                    <i class="fas fa-shopping-cart" style="font-size: 1.2rem;"></i>
                    <span class="sr-only">Giỏ hàng</span>
                </a>
            `;
        }

        container.innerHTML = `
            ${cartHtml}
            <div class="user-dropdown" style="position: relative; display: inline-block;">
                <button class="user-avatar" id="userDropdownToggle" style="background:none; border:none; display:flex; align-items:center; cursor:pointer; gap: 8px;">
                    <img src="${user.avatarUrl}" alt="Avatar" class="avatar-img" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                    <span class="user-name" style="font-weight:600; color:var(--text-color);">${user.userName}</span>
                    <i class="fas fa-chevron-down dropdown-arrow" style="font-size:0.8rem; opacity:0.7;"></i>
                </button>

                <div class="dropdown-menu" id="userDropdownMenu" style="position:absolute; right:0; top:45px; background:white; min-width:240px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); border:1px solid #eee; z-index:1000; padding: 10px 0;">
                    <div class="dropdown-header" style="padding: 10px 20px; display:flex; align-items:center; gap: 12px;">
                        <img src="${user.avatarUrl}" alt="Avatar" class="dropdown-avatar" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                        <div class="dropdown-user-info" style="display:flex; flex-direction:column;">
                            <h4 style="margin:0; font-size:0.95rem; font-weight:600;">${user.userName}</h4>
                            <p style="margin:0; font-size:0.8rem; color:#666;">${user.email || 'Học sinh'}</p>
                        </div>
                    </div>
                    <div class="dropdown-divider" style="height:1px; background:#eee; margin:8px 0;"></div>
                    
                    ${user.role === 'Admin' ? `
                        <a href="/admin/dashboard.html" class="dropdown-item" style="display:flex; align-items:center; gap:10px; padding: 10px 20px; color:#333; text-decoration:none; font-size:0.9rem;">
                            <i class="fas fa-chart-line" style="color:var(--primary-color); width:16px;"></i>
                            <span>Trang quản trị</span>
                        </a>
                    ` : `
                        <a href="/student/profile.html" class="dropdown-item" style="display:flex; align-items:center; gap:10px; padding: 10px 20px; color:#333; text-decoration:none; font-size:0.9rem;">
                            <i class="fas fa-user" style="color:var(--primary-color); width:16px;"></i>
                            <span>Thông tin cá nhân</span>
                        </a>
                        <a href="/student/feedback.html" class="dropdown-item" style="display:flex; align-items:center; gap:10px; padding: 10px 20px; color:#333; text-decoration:none; font-size:0.9rem;">
                            <i class="fas fa-comment-alt" style="color:var(--primary-color); width:16px;"></i>
                            <span>Hòm thư góp ý</span>
                        </a>
                    `}
                    
                    <div class="dropdown-divider" style="height:1px; background:#eee; margin:8px 0;"></div>
                    <a href="#" id="logoutButton" class="dropdown-item logout" style="display:flex; align-items:center; gap:10px; padding: 10px 20px; color:#e53e3e; text-decoration:none; font-size:0.9rem;">
                        <i class="fas fa-sign-out-alt" style="width:16px;"></i>
                        <span>Đăng xuất</span>
                    </a>
                </div>
            </div>
        `;

        // Toggle User Dropdown
        const toggleBtn = document.getElementById('userDropdownToggle');
        const menu = document.getElementById('userDropdownMenu');
        if (toggleBtn && menu) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('show');
                const arrow = toggleBtn.querySelector('.dropdown-arrow');
                if (arrow) {
                    arrow.classList.toggle('rotated');
                }
            });
            document.addEventListener('click', () => {
                menu.classList.remove('show');
                const arrow = toggleBtn.querySelector('.dropdown-arrow');
                if (arrow) {
                    arrow.classList.remove('rotated');
                }
            });
        }

        // Handle Logout
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const logoutRes = await apiFetch('/signout', { method: 'POST' });
                    if (logoutRes && logoutRes.ok) {
                        window.location.href = '/signin.html';
                    }
                } catch (err) {
                    console.error('Logout error:', err);
                }
            });
        }
    }
}
