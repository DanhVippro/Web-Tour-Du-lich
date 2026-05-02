/**
 * manager.js — Dashboard chính
 * Kết nối API: GET /api/bookings, /api/tours, /api/statistics, /api/users
 */

const API = 'http://localhost:3000/api';

/* ─── Khởi động ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
    initDateTime();
    initCalendar();
    bindChat();
    bindBookingCardClick();

    await Promise.all([
        loadDashboardStats(),
        loadBookingCards(),
        loadUpcomingTours(),
        loadUsersModal(),
    ]);
});

/* ─── 1. Thống kê header ─────────────────────────────────── */
async function loadDashboardStats() {
    try {
        const [statRes, tourRes] = await Promise.all([
            fetch(`${API}/statistics`),
            fetch(`${API}/tours`),
        ]);
        const stat  = await statRes.json();
        const tours = await tourRes.json();

        // "Total Booking" = tổng bookings
        setHTML('.content-welcome:nth-child(1)', `Total Booking : <strong>${stat.totalBookings}</strong>`);

        // "Upcoming Tours" = số tour status open có ngày khởi hành >= hôm nay
        const today    = new Date().toISOString().split('T')[0];
        const upcoming = tours.filter(t => t.status === 'open' && t.departureDate >= today).length;
        // Chọn phần tử thứ 2
        const boxes = document.querySelectorAll('.content-welcome');
        if (boxes[0]) boxes[0].innerHTML = `Total Booking : <strong>${stat.totalBookings}</strong>`;
        if (boxes[1]) boxes[1].innerHTML = `Upcoming Tours : <strong>${upcoming}</strong>`;

        // Modal Phân tích
        updatePhanTich(stat, tours);
    } catch (e) {
        console.error('Không lấy được thống kê:', e);
    }
}

/* ─── 2. Cập nhật modal Phân tích ───────────────────────── */
function updatePhanTich(stat, tours) {
    // Doanh thu
    const revenueEl = document.querySelector('#phanTichModal .text-success');
    if (revenueEl) revenueEl.textContent = formatPrice(stat.totalRevenue);

    // Tour bán chạy = tour có currentBookings nhiều nhất
    const best = tours.reduce((a, b) => (a.currentBookings > b.currentBookings ? a : b), tours[0]);
    const bestEl = document.querySelector('#phanTichModal h5');
    if (bestEl && best) bestEl.textContent = best.destination;

    // Khách hàng = tổng currentBookings các tour
    const totalPax = tours.reduce((s, t) => s + (t.currentBookings || 0), 0);
    const paxEls   = document.querySelectorAll('#phanTichModal h4');
    // paxEls[1] là "Khách hàng mới"
    if (paxEls[1]) paxEls[1].textContent = totalPax;
}

/* ─── 3. Booking Cards (left panel) ─────────────────────── */
async function loadBookingCards() {
    try {
        const [bookRes, tourRes] = await Promise.all([
            fetch(`${API}/bookings`),
            fetch(`${API}/tours`),
        ]);
        const bookings = await bookRes.json();
        const tours    = await tourRes.json();
        const tourMap  = Object.fromEntries(tours.map(t => [t.id, t]));

        const container = document.querySelector('.booking-scroll');
        if (!container) return;
        container.innerHTML = '';

        if (!bookings.length) {
            container.innerHTML = '<div class="text-center text-muted py-4">Chưa có booking nào.</div>';
            return;
        }

        bookings.forEach(b => {
            const tour   = tourMap[b.tourId] || {};
            const badge  = getBookingBadge(b.status, tour);
            const imgSrc = getTourImage(tour);
            const card = `
            <div class="card border-0 shadow-sm rounded-4 booking-card" data-id="${b.id}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center gap-2">
                            <div>
                                <img src="${imgSrc}" style="width:100px;aspect-ratio:4/3;object-fit:cover;border-radius:8px" alt="">
                            </div>
                            <div>
                                <div class="fw-bold" style="color:#4a1a7a;font-size:14px">
                                    ${tour.name || b.tourId}
                                </div>
                                <div style="font-size:11px;color:#9a5ab8">Mã: #${b.id}</div>
                                <div style="font-size:11px;color:#6a3a8a">
                                    <i class="bi bi-person me-1"></i>${b.customerName}
                                </div>
                            </div>
                        </div>
                        ${badge}
                    </div>
                    <div class="border-top pt-2 mt-1 d-flex flex-wrap gap-3" style="font-size:12px;color:#6a3a8a">
                        <span><i class="bi bi-geo-alt me-1"></i>${tour.destination || '—'}</span>
                        <span><i class="bi bi-calendar2 me-1"></i>Khởi hành: ${formatDate(b.departureDate)}</span>
                        <span><i class="bi bi-people me-1"></i>HDV: ${tour.guide || '—'}</span>
                        <span><i class="bi bi-cash me-1"></i>${formatPrice(tour.price)}/vé</span>
                    </div>
                </div>
            </div>`;
            container.insertAdjacentHTML('beforeend', card);
        });

        // Re-bind click sau khi render
        bindBookingCardClick();
    } catch (e) {
        console.error('Không lấy được booking:', e);
    }
}

/* ─── 4. Upcoming Tours (right panel) ───────────────────── */
async function loadUpcomingTours() {
    try {
        const res   = await fetch(`${API}/tours`);
        const tours = await res.json();
        const today = new Date().toISOString().split('T')[0];

        const upcoming = tours
            .filter(t => t.status === 'open' && t.departureDate >= today)
            .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
            .slice(0, 4);

        const container = document.querySelector('.col-lg-4 .d-flex.flex-column');
        if (!container) return;
        container.innerHTML = '';

        if (!upcoming.length) {
            container.innerHTML = '<div class="text-muted small text-center py-3">Không có tour sắp tới.</div>';
            return;
        }

        upcoming.forEach(t => {
            const imgSrc = getTourImage(t);
            container.insertAdjacentHTML('beforeend', `
            <div class="card border-0 rounded-4 overflow-hidden shadow-sm">
                <div class="tour-thumb">
                    <img src="${imgSrc}" style="width:100%;height:110px;object-fit:cover" alt="${t.destination}">
                </div>
                <div class="card-body py-2 px-3" style="background:#e8b4f8">
                    <div class="fw-bold small" style="color:#4a1a7a">${t.name}</div>
                    <div class="d-flex justify-content-between" style="font-size:11px;color:#9a5ab8">
                        <span><i class="bi bi-calendar2-range me-1"></i>${formatDate(t.departureDate)}</span>
                        <span><i class="bi bi-people me-1"></i>${t.currentBookings} khách</span>
                    </div>
                </div>
            </div>`);
        });
    } catch (e) {
        console.error('Không lấy được upcoming tours:', e);
    }
}

/* ─── 5. Modal Khách hàng ────────────────────────────────── */
async function loadUsersModal() {
    try {
        const res   = await fetch(`${API}/users`);
        const users = await res.json();

        const tbody = document.querySelector('#khachHangModal tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        users.forEach(u => {
            tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${u.fullname}</td>
                <td>${u.email}</td>
                <td>${u.phone || '—'}</td>
                <td>
                    <span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${u.role}</span>
                </td>
            </tr>`);
        });
    } catch (e) {
        console.error('Không lấy được users:', e);
    }
}

/* ─── Booking card click → chi tiết ─────────────────────── */
function bindBookingCardClick() {
    document.querySelectorAll('.booking-card').forEach(card => {
        card.style.cursor = 'pointer';
        // Tránh bind nhiều lần
        card.replaceWith(card.cloneNode(true));
    });
    document.querySelectorAll('.booking-card').forEach(card => {
        card.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            if (id) window.location.href = 'bookingDetailManager.html?id=' + id;
        });
    });
}

/* ─── Helpers ────────────────────────────────────────────── */
function getBookingBadge(status, tour) {
    const pax   = tour.currentBookings || 0;
    const max   = tour.maxCapacity || '?';
    const label = { confirmed: 'Xác nhận', pending: 'Chờ duyệt', cancelled: 'Đã hủy' }[status] || status;
    const cls   = { confirmed: 'bg-success-subtle text-success', pending: 'bg-warning-subtle text-warning', cancelled: 'bg-danger-subtle text-danger' }[status] || 'bg-secondary-subtle text-secondary';
    const icon  = { confirmed: 'bi-check2', pending: 'bi-hourglass-split', cancelled: 'bi-x' }[status] || 'bi-question';
    return `
    <span class="badge rounded-pill ${cls} px-3 py-2 d-flex flex-column align-items-center gap-1">
        <span><i class="bi ${icon} me-1"></i>${label}</span>
        <span><i class="bi bi-people me-1"></i>${pax}/${max}</span>
    </span>`;
}

/* Placeholder ảnh dựa vào tên điểm đến */
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
    for (const key in imgMap) {
        if (dest.includes(key)) return imgMap[key];
    }
    return '/data/img/Logo.png';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function formatPrice(price) {
    if (!price) return '—';
    return Number(price).toLocaleString('vi-VN') + 'đ';
}

function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
}

/* ─── Ngày giờ ───────────────────────────────────────────── */
function initDateTime() {
    const days = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
    const now  = new Date();
    const dayEl  = document.getElementById('dayName');
    const dateEl = document.getElementById('fullDate');
    if (dayEl)  dayEl.textContent  = days[now.getDay()];
    if (dateEl) dateEl.textContent =
        `${String(now.getDate()).padStart(2,'0')} / ${String(now.getMonth()+1).padStart(2,'0')} / ${now.getFullYear()}`;
}

/* ─── Calendar ───────────────────────────────────────────── */
let cur = new Date();

function initCalendar() {
    const modal = document.getElementById('lichTrinhModal');
    if (modal) modal.addEventListener('shown.bs.modal', render);
}

function render() {
    const y = cur.getFullYear(), m = cur.getMonth();
    const monthYear = document.getElementById('monthYear');
    const grid      = document.getElementById('calGrid');
    if (!monthYear || !grid) return;
    monthYear.textContent = `Tháng ${m+1} ${y}`;
    grid.querySelectorAll('.date-cell').forEach(e => e.remove());
    const firstDay  = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m+1, 0).getDate();
    const today     = new Date();
    for (let i = 0; i < firstDay; i++) grid.insertAdjacentHTML('beforeend','<div class="date-cell empty"></div>');
    for (let d = 1; d <= totalDays; d++) {
        const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        grid.insertAdjacentHTML('beforeend', `<div class="date-cell ${isToday ? 'today' : ''}">${d}</div>`);
    }
}

function prevMonth() { cur.setMonth(cur.getMonth()-1); render(); }
function nextMonth() { cur.setMonth(cur.getMonth()+1); render(); }

/* ─── Chat ───────────────────────────────────────────────── */
function bindChat() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement?.id === 'chatInput') sendMessage();
    });
}

function sendMessage() {
    const input    = document.getElementById('chatInput');
    const chatList = document.getElementById('chatList');
    const text     = input?.value.trim();
    if (!text || !chatList) return;
    const div = document.createElement('div');
    div.className = 'p-2 border rounded mb-2 bg-primary-subtle text-end';
    div.innerHTML = `<p class="mb-0">${text}</p><small class="text-muted">${new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</small>`;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
    input.value = '';
}

/* ─── Modal: Add/Edit Tour (dùng chung ở cả 2 trang) ─────── */
function openAdd() {
    const title = document.getElementById('tourModalTitle');
    if (title) title.textContent = 'Thêm Tour Mới';
    ['fTen','fDiaDiem','fNgay','fSoKhach','fSoKhachMax','fGia','fHdv','fMoTa'].forEach(id => {
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
    const max  = parseInt(document.getElementById('fSoKhachMax')?.value) || 0;
    const gia  = parseInt(document.getElementById('fGia')?.value) || 0;

    if (!name || !dest || !date || !max || !gia) {
        const err = document.getElementById('formError');
        if (err) { err.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc (*).'; err.classList.remove('d-none'); }
        return;
    }

    const payload = {
        id:              dest.toLowerCase().replace(/\s+/g,'') + Date.now(),
        name,
        destination:     dest,
        departureDate:   date,
        currentBookings: parseInt(document.getElementById('fSoKhach')?.value) || 0,
        maxCapacity:     max,
        price:           gia,
        guide:           document.getElementById('fHdv')?.value.trim(),
        status:          document.getElementById('fTrangThai')?.value || 'open',
        description:     document.getElementById('fMoTa')?.value.trim(),
    };

    try {
        const res = await fetch(`${API}/tours`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    const toast = document.createElement('div');
    toast.className = `alert alert-${color} position-fixed bottom-0 end-0 m-3 shadow`;
    toast.style.cssText = 'z-index:9999;min-width:260px;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}
