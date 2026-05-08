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
    bindKhSearch();

    // Khi mở modal Khách hàng → load data
    document.getElementById('khachHangModal')
        ?.addEventListener('show.bs.modal', loadUsersModal);

    // Khi mở modal Phân tích → load data thật
    document.getElementById('phanTichModal')
        ?.addEventListener('show.bs.modal', loadPhanTich);

    await Promise.all([
        loadDashboardStats(),
        loadBookingCards(),
        loadUpcomingTours(),
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
let _allUsers = [];

async function loadUsersModal() {
    const tbody = document.getElementById('khachHangBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải...</td></tr>`;

    try {
        // Dùng endpoint admin để lấy đầy đủ kể cả password
        const res = await fetch(`${API}/users/admin`);
        _allUsers = await res.json();
        renderUsersTable(_allUsers);
        setEl('khTotalCount', _allUsers.length);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">
            <i class="bi bi-wifi-off me-2"></i>Không thể kết nối server</td></tr>`;
        console.error('Users error:', e);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('khachHangBody');
    const empty = document.getElementById('khEmpty');
    if (!tbody) return;

    if (!users.length) {
        tbody.innerHTML = '';
        empty?.classList.remove('d-none');
        return;
    }
    empty?.classList.add('d-none');

    tbody.innerHTML = users.map(u => {
        const roleCls = u.role === 'admin' ? 'bg-danger' : 'bg-primary';
        const roleLabel = u.role === 'admin' ? 'Admin' : 'Khách';
        const canDelete = u.role !== 'admin';
        return `<tr>
            <td>
                <div class="fw-semibold">${u.fullname || '—'}</div>
                <small class="text-muted">#${u.id}</small>
            </td>
            <td>${u.email || '—'}</td>
            <td>${u.phone || '—'}</td>
            <td>
                <span class="font-monospace" style="font-size:12px;background:#f1f3f5;padding:2px 8px;border-radius:4px;letter-spacing:.5px">
                    ${u.password || '—'}
                </span>
            </td>
            <td><span class="badge ${roleCls}">${roleLabel}</span></td>
            <td class="text-center">
                ${canDelete
                ? `<button class="btn btn-sm btn-outline-danger" title="Xóa" onclick="deleteUser(${u.id},'${escHtml(u.fullname)}')">
                        <i class="bi bi-trash"></i>
                       </button>`
                : `<span class="text-muted small">—</span>`
            }
            </td>
        </tr>`;
    }).join('');
}

function bindKhSearch() {
    const input = document.getElementById('khSearch');
    if (!input) return;
    input.addEventListener('input', () => {
        const kw = input.value.toLowerCase().trim();
        const filtered = !kw ? _allUsers : _allUsers.filter(u =>
            (u.fullname || '').toLowerCase().includes(kw) ||
            (u.email || '').toLowerCase().includes(kw) ||
            (u.phone || '').toLowerCase().includes(kw)
        );
        renderUsersTable(filtered);
        setEl('khTotalCount', filtered.length);
    });
}

async function deleteUser(id, name) {
    if (!confirm(`Xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
        const res = await fetch(`${API}/users/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json();
            return showToast(err.error || 'Xóa thất bại', 'danger');
        }
        showToast(`Đã xóa tài khoản "${name}"`, 'success');
        await loadUsersModal();
    } catch (e) {
        showToast('Lỗi kết nối server', 'danger');
        console.error(e);
    }
}

function escHtml(str) {
    return String(str || '').replace(/'/g, "\'").replace(/"/g, '&quot;');
}

/* ─── 5. Phân tích Modal ────────────────────────────────── */
let _ptChartRevenue = null;
let _ptChartStatus = null;

async function loadPhanTich() {
    try {
        const [statRes, tourRes, bookRes] = await Promise.all([
            fetch(`${API}/statistics`),
            fetch(`${API}/tours`),
            fetch(`${API}/bookings`),
        ]);
        const stat = await statRes.json();
        const tours = await tourRes.json();
        const bookings = await bookRes.json();

        // ── KPI ──
        const totalPax = tours.reduce((s, t) => s + (t.currentBookings || 0), 0);
        const avgFill = tours.length
            ? Math.round(tours.reduce((s, t) => s + (t.currentBookings / (t.maxCapacity || 1)), 0) / tours.length * 100)
            : 0;
        const best = [...tours].sort((a, b) => (b.currentBookings || 0) - (a.currentBookings || 0))[0] || {};

        setEl('ptRevenue', stat.totalRevenue ? formatPrice(stat.totalRevenue) : '—');
        setEl('ptBestTour', best.name || best.destination || '—');
        setEl('ptPax', totalPax);
        setEl('ptFillRate', avgFill + '%');

        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setEl('ptLastUpdate', `Cập nhật lúc ${now}`);

        // ── Revenue by tour (bar chart) ──
        const revenueMap = {};
        bookings.forEach(b => {
            if (b.status !== 'cancelled')
                revenueMap[b.tourId] = (revenueMap[b.tourId] || 0) + (b.totalPrice || 0);
        });
        const tourMap = Object.fromEntries(tours.map(t => [t.id, t]));
        const revEntries = Object.entries(revenueMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        const revLabels = revEntries.map(([id]) => tourMap[id]?.destination || id);
        const revData = revEntries.map(([, v]) => v);

        const ctxRev = document.getElementById('ptChartRevenue');
        if (ctxRev) {
            if (_ptChartRevenue) _ptChartRevenue.destroy();
            _ptChartRevenue = new Chart(ctxRev, {
                type: 'bar',
                data: {
                    labels: revLabels,
                    datasets: [{
                        label: 'Doanh thu (đ)',
                        data: revData,
                        backgroundColor: [
                            '#7c3aed', '#2dd4bf', '#f59e0b', '#ef4444',
                            '#3b82f6', '#10b981', '#f97316', '#8b5cf6'
                        ],
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            ticks: {
                                callback: v => (v / 1000000).toFixed(0) + 'M'
                            }
                        }
                    }
                }
            });
        }

        // ── Booking status (doughnut) ──
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;
        const pending = bookings.filter(b => b.status === 'pending').length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;

        const ctxStatus = document.getElementById('ptChartStatus');
        if (ctxStatus) {
            if (_ptChartStatus) _ptChartStatus.destroy();
            _ptChartStatus = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Xác nhận', 'Chờ duyệt', 'Đã hủy'],
                    datasets: [{
                        data: [confirmed, pending, cancelled],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } }
                    },
                    cutout: '65%',
                }
            });
        }

        // ── Tour rank table ──
        const ranked = [...tours].sort((a, b) => (b.currentBookings || 0) - (a.currentBookings || 0));
        const tbody = document.getElementById('ptTourRankBody');
        if (tbody) {
            tbody.innerHTML = ranked.map((t, i) => {
                const fill = t.maxCapacity ? Math.round(t.currentBookings / t.maxCapacity * 100) : 0;
                const barColor = fill >= 90 ? '#ef4444' : fill >= 60 ? '#f59e0b' : '#10b981';
                return `<tr>
                    <td><span class="badge bg-secondary-subtle text-secondary">${i + 1}</span></td>
                    <td class="fw-semibold" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.name}">${t.name}</td>
                    <td>${t.destination}</td>
                    <td>${t.currentBookings || 0}</td>
                    <td>${t.maxCapacity || '—'}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="progress flex-grow-1" style="height:6px;width:70px">
                                <div class="progress-bar" style="width:${fill}%;background:${barColor}"></div>
                            </div>
                            <small>${fill}%</small>
                        </div>
                    </td>
                    <td class="text-success fw-semibold">${formatPrice(t.price)}</td>
                </tr>`;
            }).join('');
        }

    } catch (e) {
        console.error('PhanTich error:', e);
    }
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