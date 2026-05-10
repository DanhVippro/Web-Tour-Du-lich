/**
 * sidebar.js — Dùng chung cho manager.html & dsTour.html
 */

document.addEventListener('DOMContentLoaded', () => {
    loadAdminInfo();
    bindAccountPopup();
});

/* ─── Lấy thông tin admin từ localStorage ───────────────── */
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
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Manager' : (user.role === 'manager' ? 'Manager' : 'User');
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;

    const popName = document.getElementById('popupName');
    const popEmail = document.getElementById('popupEmail');
    const popPhone = document.getElementById('popupPhone');
    const popRole = document.getElementById('popupRole');
    const popAvatar = document.getElementById('popupAvatar');

    if (popName) popName.textContent = user.fullname || user.name || '—';
    if (popEmail) popEmail.textContent = user.email || '—';
    if (popPhone) popPhone.textContent = user.phone || '—';
    if (popRole) popRole.textContent = user.role === 'admin' ? 'Quản trị viên' : (user.role === 'manager' ? 'Quản lý' : 'Khách hàng');
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

let _curMonth = new Date();

function initCalendarModal() {
    const modal = document.getElementById('lichTrinhModal');
    if (modal) modal.addEventListener('shown.bs.modal', renderCalendar);
}

function renderCalendar() {
    const y = _curMonth.getFullYear(), m = _curMonth.getMonth();
    const monthYear = document.getElementById('monthYear');
    const grid = document.getElementById('calGrid');
    if (!monthYear || !grid) return;
    monthYear.textContent = `Tháng ${m + 1} ${y}`;
    grid.querySelectorAll('.date-cell').forEach(e => e.remove());
    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    for (let i = 0; i < firstDay; i++)
        grid.insertAdjacentHTML('beforeend', '<div class="date-cell empty"></div>');
    for (let d = 1; d <= totalDays; d++) {
        const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        grid.insertAdjacentHTML('beforeend', `<div class="date-cell ${isToday ? 'today' : ''}">${d}</div>`);
    }
}

function render() { renderCalendar(); }
function prevMonth() { _curMonth.setMonth(_curMonth.getMonth() - 1); renderCalendar(); }
function nextMonth() { _curMonth.setMonth(_curMonth.getMonth() + 1); renderCalendar(); }

function bindChat() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement?.id === 'chatInput') sendMessage();
    });
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const chatList = document.getElementById('chatList');
    const text = input?.value.trim();
    if (!text || !chatList) return;
    const div = document.createElement('div');
    div.className = 'p-2 border rounded mb-2 bg-primary-subtle text-end';
    div.innerHTML = `<p class="mb-0">${text}</p>
        <small class="text-muted">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>`;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
    input.value = '';
}