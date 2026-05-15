
document.addEventListener('DOMContentLoaded', () => {
    loadAdminInfo();
    bindAccountPopup();
});

async function loadAdminInfo() {
    let user = null;

    const stored = localStorage.getItem('currentUser');
    if (stored) {
        try { user = JSON.parse(stored); } catch { }
    }

    if (!user) {
        try {
            const res = await fetch('http://localhost:3000/api/users');
            const users = await res.json();
            user = users.find(u => u.role === 'admin') || users[0];
        } catch (e) {
            console.error('Không thể tải user:', e);
        }
    }

    if (!user) return;

    const nameEl = document.getElementById('sidebarName');
    const roleEl = document.getElementById('sidebarRole');
    const avatarEl = document.getElementById('sidebarAvatar');

    if (nameEl) nameEl.textContent = user.fullname || user.name || 'Admin';
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'User' : 'Manager';
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;

    const popName = document.getElementById('popupName');
    const popEmail = document.getElementById('popupEmail');
    const popPhone = document.getElementById('popupPhone');
    const popRole = document.getElementById('popupRole');
    const popAvatar = document.getElementById('popupAvatar');

    if (popName) popName.textContent = user.fullname || user.name || 'Admin';
    if (popEmail) popEmail.textContent = user.email || 'admin@gmail.com';
    if (popPhone) popPhone.textContent = user.phone || '0988888888';
    if (popRole) popRole.textContent = user.role === 'admin' ? 'Khách hàng' : 'Quản trị viên'
    if (popAvatar && user.avatar) popAvatar.src = user.avatar;
}

function bindAccountPopup() {
    const trigger = document.getElementById('accountTrigger');
    const popup = document.getElementById('accountPopup');
    if (!trigger || !popup) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !popup.contains(e.target)) {
            popup.classList.remove('show');
        }
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    window.location.href = '/FrontEnd/html/login.html';
}

function initDateTime() {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    const dayEl = document.getElementById('dayName');
    const dateEl = document.getElementById('fullDate');
    if (dayEl) dayEl.textContent = days[now.getDay()];
    if (dateEl) dateEl.textContent = `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`;
}

