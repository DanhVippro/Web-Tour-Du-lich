/**
 * manager_new.js — Dashboard redesign
 * API: GET /api/bookings, /api/tours, /api/statistics, /api/users
 */

const API = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    initDateTime();
    initCalendarModal();
    bindChat();
    bindSearch();

    await Promise.all([
        loadDashboardStats(),
        loadBookingCards(),
        loadUpcomingTours(),
        loadUsersModal(),
    ]);
});

/* ─── 1. Stat Cards ──────────────────────────────────────── */
async function loadDashboardStats() {
    try {
        const [statRes, tourRes] = await Promise.all([
            fetch(`${API}/statistics`),
            fetch(`${API}/tours`),
        ]);
        const stat = await statRes.json();
        const tours = await tourRes.json();

        const today = new Date().toISOString().split('T')[0];
        const upcoming = tours.filter(t => t.status === 'open' && t.departureDate >= today).length;
        const totalPax = tours.reduce((s, t) => s + (t.currentBookings || 0), 0);

        setEl('statBooking', stat.totalBookings ?? '—');
        setEl('statUpcoming', upcoming);
        setEl('statRevenue', stat.totalRevenue ? formatPrice(stat.totalRevenue) : '—');
        setEl('statPax', totalPax);

        // Phân tích modal
        setEl('ptRevenue', stat.totalRevenue ? formatPrice(stat.totalRevenue) : '—');
        setEl('ptPax', totalPax);
        const best = tours.reduce((a, b) => (a.currentBookings > b.currentBookings ? a : b), tours[0] || {});
        setEl('ptBestTour', best?.destination || '—');

        // Cũ — dùng cho manager.js gốc (updatePhanTich compat)
        updatePhanTich(stat, tours);

    } catch (e) {
        console.error('Stat error:', e);
    }
}

/* ─── 2. Booking Cards ───────────────────────────────────── */
async function loadBookingCards() {
    const container = document.getElementById('bookingList');
    if (!container) return;

    try {
        const [bookRes, tourRes] = await Promise.all([
            fetch(`${API}/bookings`),
            fetch(`${API}/tours`),
        ]);
        const bookings = await bookRes.json();
        const tours = await tourRes.json();
        const tourMap = Object.fromEntries(tours.map(t => [t.id, t]));

        container.innerHTML = '';

        if (!bookings.length) {
            container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:32px">Chưa có booking nào.</div>';
            return;
        }

        bookings.forEach(b => {
            const tour = tourMap[b.tourId] || {};
            const imgSrc = getTourImage(tour);
            const badge = getBookingBadge(b.status, tour);

            const card = document.createElement('div');
            card.className = 'booking-card';
            card.dataset.id = b.id;
            card.innerHTML = `
                <img src="${imgSrc}" alt="${tour.name || ''}" onerror="this.src='/data/img/Logo.png'">
                <div class="card-info">
                    <div class="card-tour-name">${tour.name || b.tourId}</div>
                    <div style="font-size:11px;color:var(--text-muted)">
                        <span style="color:var(--accent)">Mã: #${b.id}</span> &nbsp;|&nbsp;
                        <i class="bi bi-person"></i> ${b.customerName}
                    </div>
                    <div class="card-meta">
                        <span><i class="bi bi-geo-alt"></i>${tour.destination || '—'}</span>
                        <span><i class="bi bi-calendar2"></i>${formatDate(b.departureDate)}</span>
                        <span><i class="bi bi-people"></i>${tour.guide || '—'}</span>
                        <span><i class="bi bi-cash"></i>${formatPrice(tour.price)}/vé</span>
                    </div>
                </div>
                <div>${badge}</div>`;

            card.addEventListener('click', () => {
                window.location.href = 'bookingDetailManager.html?id=' + b.id;
            });

            container.appendChild(card);
        });

    } catch (e) {
        if (container) container.innerHTML = '<div style="color:#f87171;padding:20px;text-align:center">Không thể kết nối server.</div>';
        console.error('Booking error:', e);
    }
}

/* ─── 3. Upcoming Tours ──────────────────────────────────── */
async function loadUpcomingTours() {
    const container = document.getElementById('upcomingList');
    if (!container) return;

    try {
        const res = await fetch(`${API}/tours`);
        const tours = await res.json();
        const today = new Date().toISOString().split('T')[0];

        const upcoming = tours
            .filter(t => t.status === 'open' && t.departureDate >= today)
            .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
            .slice(0, 5);

        container.innerHTML = '';

        if (!upcoming.length) {
            container.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:24px">Không có tour sắp tới.</div>';
            return;
        }
        // chưa lấy ảnh đúng địa điểm
        upcoming.forEach(t => {
            const imgSrc = getTourImage(t);
            const card = document.createElement('div');
            card.className = 'upcoming-card';
            card.innerHTML = `
                <img src="${imgSrc}" alt="${t.destination}" onerror="this.src='/data/img/Logo.png'"> 
                <div class="upcoming-card-body">
                    <div class="upcoming-tour-name">${t.name}</div>
                    <div class="upcoming-meta">
                        <span><i class="bi bi-calendar2-range"></i>${formatDate(t.departureDate)}</span>
                        <span><i class="bi bi-people"></i>${t.currentBookings} khách</span>
                    </div>
                </div>`;
            container.appendChild(card);
        });

    } catch (e) {
        console.error('Upcoming error:', e);
    }
}

/* ─── 4. Users Modal ─────────────────────────────────────── */
async function loadUsersModal() {
    try {
        const res = await fetch(`${API}/users`);
        const users = await res.json();
        const tbody = document.getElementById('khachHangBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        users.forEach(u => {
            tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${u.fullname}</td>
                <td>${u.email}</td>
                <td>${u.phone || '—'}</td>
                <td><span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${u.role}</span></td>
            </tr>`);
        });
    } catch (e) { console.error('Users error:', e); }
}

/* ─── Search filter ──────────────────────────────────────── */
function bindSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', () => {
        const kw = input.value.toLowerCase().trim();
        document.querySelectorAll('.booking-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = (!kw || text.includes(kw)) ? '' : 'none';
        });
    });
}

/* ─── Helpers ────────────────────────────────────────────── */
function getBookingBadge(status, tour) {
    const pax = tour.currentBookings || 0;
    const max = tour.maxCapacity || '?';
    const cfg = {
        confirmed: { cls: 'badge-confirmed', icon: 'bi-check2', label: 'Xác nhận' },
        pending: { cls: 'badge-pending', icon: 'bi-hourglass-split', label: 'Chờ duyệt' },
        cancelled: { cls: 'badge-cancelled', icon: 'bi-x-circle', label: 'Đã hủy' },
    };
    const c = cfg[status] || { cls: 'badge-pending', icon: 'bi-question', label: status };
    return `<div class="badge-status ${c.cls}">
        <span><i class="bi ${c.icon} me-1"></i>${c.label}</span>
        <span><i class="bi bi-people"></i> ${pax}/${max}</span>
    </div>`;
}

function getTourImage(tour) {
    const dest = (tour.destination || '').toLowerCase();
    const imgMap = {
        'đà lạt': '/data/img/danhManager/Da-Lat.jpg',
        'phú quốc': '/data/img/danhManager/phu-quoc.jpg',
        'nha trang': '/data/img/danhManager/nha-trang.jpg',
        'đà nẵng': '/data/img/danhManager/da-nang.jpg',
        'sapa': '/data/img/danhManager/sapa.jpg',
        'hàn quốc': '/data/img/danhManager/han-quoc.jpg',
        'trung quốc': '/data/img/danhManager/thuong-hai.jpg',
    };
    for (const key in imgMap) { if (dest.includes(key)) return imgMap[key]; }
    return '/data/img/Logo.png';
}

function formatDate(d) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

function formatPrice(p) {
    if (!p) return '—';
    return Number(p).toLocaleString('vi-VN') + 'đ';
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

/* compat for manager_new calling updatePhanTich */
function updatePhanTich(stat, tours) { }

/* ─── DateTime ───────────────────────────────────────────── */
function initDateTime() {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    setEl('dayName', days[now.getDay()]);
    setEl('fullDate', `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`);
}

/* ─── Calendar ───────────────────────────────────────────── */
let _cur = new Date();
function initCalendarModal() {
    const modal = document.getElementById('lichTrinhModal');
    if (modal) modal.addEventListener('shown.bs.modal', renderCalendar);
}
function renderCalendar() {
    const y = _cur.getFullYear(), m = _cur.getMonth();
    setEl('monthYear', `Tháng ${m + 1} ${y}`);
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    grid.querySelectorAll('.date-cell').forEach(e => e.remove());
    const firstDay = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    for (let i = 0; i < firstDay; i++) grid.insertAdjacentHTML('beforeend', '<div class="date-cell empty"></div>');
    for (let d = 1; d <= total; d++) {
        const isT = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        grid.insertAdjacentHTML('beforeend', `<div class="date-cell ${isT ? 'today' : ''}">${d}</div>`);
    }
}
function render() { renderCalendar(); }
function prevMonth() { _cur.setMonth(_cur.getMonth() - 1); renderCalendar(); }
function nextMonth() { _cur.setMonth(_cur.getMonth() + 1); renderCalendar(); }

/* ─── Chat ───────────────────────────────────────────────── */
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
    div.innerHTML = `<p class="mb-0">${text}</p><small class="text-muted">${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>`;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
    input.value = '';
}

/* ─── Tour Modal ─────────────────────────────────────────── */
function openAdd() {
    setEl('tourModalTitle', 'Thêm Tour Mới');
    ['fTen', 'fDiaDiem', 'fNgay', 'fSoKhach', 'fSoKhachMax', 'fGia', 'fHdv', 'fMoTa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sel = document.getElementById('fTrangThai');
    if (sel) sel.value = 'open';
    const err = document.getElementById('formError');
    if (err) err.classList.add('d-none');
}

async function saveTour() {
    const name = document.getElementById('fTen')?.value.trim();
    const dest = document.getElementById('fDiaDiem')?.value.trim();
    const date = document.getElementById('fNgay')?.value;
    const max = parseInt(document.getElementById('fSoKhachMax')?.value) || 0;
    const gia = parseInt(document.getElementById('fGia')?.value) || 0;

    if (!name || !dest || !date || !max || !gia) {
        const err = document.getElementById('formError');
        if (err) { err.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc (*).'; err.classList.remove('d-none'); }
        return;
    }

    const payload = {
        id: dest.toLowerCase().replace(/\s+/g, '') + Date.now(),
        name, destination: dest, departureDate: date,
        currentBookings: parseInt(document.getElementById('fSoKhach')?.value) || 0,
        maxCapacity: max, price: gia,
        guide: document.getElementById('fHdv')?.value.trim(),
        status: document.getElementById('fTrangThai')?.value || 'open',
        description: document.getElementById('fMoTa')?.value.trim(),
    };

    try {
        const res = await fetch(`${API}/tours`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        bootstrap.Modal.getInstance(document.getElementById('tourModal'))?.hide();
        await Promise.all([loadDashboardStats(), loadUpcomingTours()]);
        showToast('Thêm tour thành công!');
    } catch (e) {
        const err = document.getElementById('formError');
        if (err) { err.textContent = 'Lưu thất bại: ' + e.message; err.classList.remove('d-none'); }
    }
}

function showToast(msg, color = 'success') {
    const t = document.createElement('div');
    t.className = `alert alert-${color} position-fixed bottom-0 end-0 m-3 shadow`;
    t.style.cssText = 'z-index:9999;min-width:260px;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}
