/**
 * dsTour.js — Quản lý danh sách Tour
 */

const API = 'http://localhost:3000/api';

let allTours = [];
let tourToDelete = null;
let _allUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof initDateTime === 'function') initDateTime();
    if (typeof initCalendarModal === 'function') initCalendarModal();
    if (typeof bindChat === 'function') bindChat();

    // Khởi tạo các modal
    const khachHangModal = document.getElementById('khachHangModal');
    if (khachHangModal) {
        khachHangModal.addEventListener('show.bs.modal', loadUsersModal);
    }

    const phanTichModal = document.getElementById('phanTichModal');
    if (phanTichModal) {
        phanTichModal.addEventListener('show.bs.modal', loadPhanTich);
    }

    loadStatistics();
    loadTours();
    bindSearch();
    bindStatusFilter();
});

async function loadStatistics() {
    try {
        const res = await fetch(`${API}/statistics`);
        const stat = await res.json();
        const totalEl = document.getElementById('statTotal');
        if (totalEl) totalEl.textContent = stat.totalTours;
    } catch (e) {
        console.error('Không lấy được thống kê:', e);
    }
}

async function loadTours() {
    try {
        const res = await fetch(`${API}/tours`);
        allTours = await res.json();
        renderTable(allTours);
    } catch (e) {
        showTableError('Không thể kết nối server. Hãy kiểm tra server.js đã chạy chưa.');
    }
}

function renderTable(tours) {
    const tbody = document.getElementById('tourTableBody');
    const empty = document.getElementById('emptyMsg');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (!tours || tours.length === 0) {
        if (empty) empty.classList.remove('d-none');
        return;
    }
    if (empty) empty.classList.add('d-none');

    tours.forEach(t => {
        const statusBadge = getStatusBadge(t.status);
        const row = `
        <tr>
            <td><span class="fw-semibold text-secondary small">${t.id.toUpperCase()}</span></td>
            <td>
                <div class="fw-semibold" style="color:#4a1a7a;max-width:220px">${t.name}</div>
                <div class="text-muted small">${t.duration || ''}</div>
            </td>
            <td>
                <i class="bi bi-geo-alt-fill me-1 text-danger"></i>${t.destination}
                <div class="text-muted small">${t.location || ''}</div>
            </td>
            <td>${formatDate(t.departureDate)}</td>
            <td>
                <div class="d-flex align-items-center gap-1">
                    <div class="progress flex-grow-1" style="height:6px;width:80px">
                        <div class="progress-bar bg-primary" style="width:${getPercent(t)}%"></div>
                    </div>
                    <small>${t.currentBookings}/${t.maxCapacity}</small>
                </div>
            </td>
            <td class="fw-semibold text-success">${formatPrice(t.price)}</td>
            <td>${t.guide || '<span class="text-muted">—</span>'}</td>
            <td>${statusBadge}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary me-1"
                    title="Sửa" onclick="openEdit('${t.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger"
                    title="Xóa" onclick="openDelete('${t.id}','${escHtml(t.name)}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

function bindSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(applyFilters, 300);
    });
}

function bindStatusFilter() {
    const sel = document.getElementById('status');
    if (!sel) return;
    sel.addEventListener('change', applyFilters);
}

function applyFilters() {
    const keyword = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const status = document.getElementById('status')?.value || '';

    const filtered = allTours.filter(t => {
        const matchKw = !keyword ||
            t.name.toLowerCase().includes(keyword) ||
            t.destination.toLowerCase().includes(keyword) ||
            (t.location || '').toLowerCase().includes(keyword) ||
            t.id.toLowerCase().includes(keyword);
        const matchSt = !status || t.status === status;
        return matchKw && matchSt;
    });
    renderTable(filtered);
}

function openAdd() {
    const titleEl = document.getElementById('tourModalTitle');
    if (titleEl) titleEl.textContent = 'Thêm Tour Mới';
    const idEl = document.getElementById('tourId');
    if (idEl) idEl.value = '';
    clearForm();
    hideFormError();
}

async function openEdit(id) {
    const titleEl = document.getElementById('tourModalTitle');
    if (titleEl) titleEl.textContent = 'Chỉnh sửa Tour';
    hideFormError();

    try {
        const res = await fetch(`${API}/tours/${id}`, { cache: "no-store" });
        const tour = await res.json();

        const tourIdEl = document.getElementById('tourId');
        const fTenEl = document.getElementById('fTen');
        const fDiaDiemEl = document.getElementById('fDiaDiem');
        const fNgayEl = document.getElementById('fNgay');
        const fSoKhachEl = document.getElementById('fSoKhach');
        const fSoKhachMaxEl = document.getElementById('fSoKhachMax');
        const fGiaEl = document.getElementById('fGia');
        const fHdvEl = document.getElementById('fHdv');
        const fTrangThaiEl = document.getElementById('fTrangThai');
        const fMoTaEl = document.getElementById('fMoTa');
        const fLocationEl = document.getElementById('fLocation');
        const fDurationEl = document.getElementById('fDuration');
        const fHotelEl = document.getElementById('fHotel');
        const fTransportEl = document.getElementById('fTransport');
        const fRouteEl = document.getElementById('fRoute');
        const fImagesEl = document.getElementById('fImages');

        if (tourIdEl) tourIdEl.value = tour.id;
        if (fTenEl) fTenEl.value = tour.name || '';
        if (fDiaDiemEl) fDiaDiemEl.value = tour.destination || '';
        if (fNgayEl) fNgayEl.value = tour.departureDate || '';
        if (fSoKhachEl) fSoKhachEl.value = tour.currentBookings ?? 0;
        if (fSoKhachMaxEl) fSoKhachMaxEl.value = tour.maxCapacity || '';
        if (fGiaEl) fGiaEl.value = tour.price || '';
        if (fHdvEl) fHdvEl.value = tour.guide || '';
        if (fTrangThaiEl) fTrangThaiEl.value = tour.status || 'open';
        if (fMoTaEl) fMoTaEl.value = tour.description || '';
        if (fLocationEl) fLocationEl.value = tour.location || '';
        if (fDurationEl) fDurationEl.value = tour.duration || '';
        if (fHotelEl) fHotelEl.value = tour.hotel || '';
        if (fTransportEl) fTransportEl.value = tour.transport || '';
        if (fRouteEl) fRouteEl.value = tour.route || '';
        if (fImagesEl) fImagesEl.value = Array.isArray(tour.images) ? tour.images.join(',') : '';

        new bootstrap.Modal(document.getElementById('tourModal')).show();
    } catch (e) {
        console.error(e);
        alert('Không tải được thông tin tour!');
    }
}

async function saveTour() {
    const id = document.getElementById('tourId')?.value.trim() || '';
    const name = document.getElementById('fTen')?.value.trim() || '';
    const dest = document.getElementById('fDiaDiem')?.value.trim() || '';
    const date = document.getElementById('fNgay')?.value || '';
    const max = parseInt(document.getElementById('fSoKhachMax')?.value) || 0;
    const gia = parseInt(document.getElementById('fGia')?.value) || 0;

    if (!name || !dest || !date || !max || !gia) {
        showFormError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
        return;
    }

    const payload = {
        id: id || (dest.toLowerCase().replace(/\s+/g, '') + Date.now()),
        name,
        destination: dest,
        location: document.getElementById('fLocation')?.value.trim() || "Chưa cập nhật",
        departureDate: date,
        duration: document.getElementById('fDuration')?.value.trim() || "Chưa cập nhật",
        price: gia,
        maxCapacity: max,
        currentBookings: parseInt(document.getElementById('fSoKhach')?.value) || 0,
        hotel: document.getElementById('fHotel')?.value.trim() || "3 Sao",
        transport: document.getElementById('fTransport')?.value.trim() || "Đang cập nhật",
        description: document.getElementById('fMoTa')?.value.trim() || "",
        guide: document.getElementById('fHdv')?.value.trim() || "",
        images: document.getElementById('fImages')?.value ? document.getElementById('fImages').value.split(',').map(i => i.trim()) : ["default.jpg"],
        status: document.getElementById('fTrangThai')?.value || 'open',
        route: document.getElementById('fRoute')?.value.trim() || "Đang cập nhật"
    };

    try {
        let res;
        if (id) {
            res = await fetch(`${API}/tours/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            res = await fetch(`${API}/tours`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (!res.ok) throw new Error(await res.text());

        const modal = bootstrap.Modal.getInstance(document.getElementById('tourModal'));
        if (modal) modal.hide();
        await loadTours();
        await loadStatistics();
        showToast(id ? 'Cập nhật tour thành công!' : 'Thêm tour mới thành công!');
    } catch (e) {
        showFormError('Lưu thất bại: ' + e.message);
    }
}

function openDelete(id, name) {
    tourToDelete = id;
    const deleteNameEl = document.getElementById('deleteTourName');
    if (deleteNameEl) deleteNameEl.textContent = name;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function confirmDelete() {
    if (!tourToDelete) return;
    try {
        const res = await fetch(`${API}/tours/${tourToDelete}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error('Xóa thất bại');

        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (modal) modal.hide();
        tourToDelete = null;
        await loadTours();
        await loadStatistics();
        showToast('Đã xóa tour!', 'danger');
    } catch (e) {
        alert('Xóa thất bại: ' + e.message);
    }
}

// ==================== KHÁCH HÀNG MODAL ====================
async function loadUsersModal() {
    const tbody = document.getElementById('khachHangBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải...</td></tr>`;

    try {
        const res = await fetch(`${API}/users/admin`);
        _allUsers = await res.json();
        renderUsersTable(_allUsers);
        const totalEl = document.getElementById('khTotalCount');
        if (totalEl) totalEl.textContent = _allUsers.length;
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
        if (empty) empty.classList.remove('d-none');
        return;
    }
    if (empty) empty.classList.add('d-none');

    tbody.innerHTML = users.map(u => {
        const roleCls = u.role === 'admin' ? 'bg-danger' : (u.role === 'manager' ? 'bg-warning' : 'bg-primary');
        const roleLabel = u.role === 'admin' ? 'Admin' : (u.role === 'manager' ? 'Manager' : 'Khách');
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

// ==================== PHÂN TÍCH MODAL ====================
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

        // KPI
        const totalPax = tours.reduce((s, t) => s + (t.currentBookings || 0), 0);
        const avgFill = tours.length
            ? Math.round(tours.reduce((s, t) => s + (t.currentBookings / (t.maxCapacity || 1)), 0) / tours.length * 100)
            : 0;
        const best = [...tours].sort((a, b) => (b.currentBookings || 0) - (a.currentBookings || 0))[0] || {};

        const revenueEl = document.getElementById('ptRevenue');
        const bestTourEl = document.getElementById('ptBestTour');
        const paxEl = document.getElementById('ptPax');
        const fillRateEl = document.getElementById('ptFillRate');
        const lastUpdateEl = document.getElementById('ptLastUpdate');

        if (revenueEl) revenueEl.textContent = stat.totalRevenue ? formatPrice(stat.totalRevenue) : '—';
        if (bestTourEl) bestTourEl.textContent = best.name || best.destination || '—';
        if (paxEl) paxEl.textContent = totalPax;
        if (fillRateEl) fillRateEl.textContent = avgFill + '%';

        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (lastUpdateEl) lastUpdateEl.textContent = `Cập nhật lúc ${now}`;

        // Revenue by tour
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
                        backgroundColor: ['#7c3aed', '#2dd4bf', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#f97316', '#8b5cf6'],
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { ticks: { callback: v => (v / 1000000).toFixed(0) + 'M' } } }
                }
            });
        }

        // Booking status
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
                    datasets: [{ data: [confirmed, pending, cancelled], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } }, cutout: '65%' }
            });
        }

        // Tour rank table
        const ranked = [...tours].sort((a, b) => (b.currentBookings || 0) - (a.currentBookings || 0));
        const rankBody = document.getElementById('ptTourRankBody');
        if (rankBody) {
            rankBody.innerHTML = ranked.map((t, i) => {
                const fill = t.maxCapacity ? Math.round(t.currentBookings / t.maxCapacity * 100) : 0;
                const barColor = fill >= 90 ? '#ef4444' : fill >= 60 ? '#f59e0b' : '#10b981';
                return `<tr>
                    <td><span class="badge bg-secondary-subtle text-secondary">${i + 1}</span></td>
                    <td class="fw-semibold" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.name}">${t.name}</td>
                    <td>${t.destination}</td>
                    <td>${t.currentBookings || 0}</td>
                    <td>${t.maxCapacity || '—'}</td>
                    <td><div class="d-flex align-items-center gap-2"><div class="progress flex-grow-1" style="height:6px;width:70px"><div class="progress-bar" style="width:${fill}%;background:${barColor}"></div></div><small>${fill}%</small></div></td>
                    <td class="text-success fw-semibold">${formatPrice(t.price)}</td>
                </tr>`;
            }).join('');
        }

    } catch (e) {
        console.error('PhanTich error:', e);
        const rankBody = document.getElementById('ptTourRankBody');
        if (rankBody) rankBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Lỗi tải dữ liệu: ${e.message}</td></tr>`;
    }
}

// ==================== HELPERS ====================
function getStatusBadge(status) {
    const map = {
        open: '<span class="badge badge-open">Đang mở</span>',
        full: '<span class="badge badge-full">Đã đầy</span>',
        cancel: '<span class="badge badge-cancel">Đã hủy</span>',
    };
    return map[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function getPercent(t) {
    if (!t.maxCapacity) return 0;
    return Math.min(100, Math.round((t.currentBookings / t.maxCapacity) * 100));
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function formatPrice(price) {
    if (!price) return '—';
    return price.toLocaleString('vi-VN') + 'đ';
}

function escHtml(str) {
    return String(str).replace(/'/g, "\\'");
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function clearForm() {
    ['fTen', 'fDiaDiem', 'fNgay', 'fSoKhach', 'fSoKhachMax', 'fGia', 'fHdv', 'fMoTa', 'fLocation', 'fDuration', 'fHotel', 'fTransport', 'fRoute', 'fImages'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sel = document.getElementById('fTrangThai');
    if (sel) sel.value = 'open';
}

function showFormError(msg) {
    const el = document.getElementById('formError');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('d-none');
}

function hideFormError() {
    const el = document.getElementById('formError');
    if (el) el.classList.add('d-none');
}

function showTableError(msg) {
    const tbody = document.getElementById('tourTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">${msg}</td></tr>`;
}

function showToast(msg, color = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${color} position-fixed bottom-0 end-0 m-3 shadow`;
    toast.style.cssText = 'z-index:9999;min-width:260px;animation:fadeIn .3s';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

// Calendar
document.addEventListener('DOMContentLoaded', function () {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    const dayEl = document.getElementById('dayName');
    const dateEl = document.getElementById('fullDate');
    if (dayEl) dayEl.textContent = days[now.getDay()];
    if (dateEl) dateEl.textContent = `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`;
});

let cur = new Date();
function renderCalendar() {
    const y = cur.getFullYear(), m = cur.getMonth();
    const monthYear = document.getElementById('monthYear');
    const grid = document.getElementById('calGrid');
    if (!monthYear || !grid) return;
    monthYear.textContent = `Tháng ${m + 1} ${y}`;
    grid.querySelectorAll('.date-cell').forEach(e => e.remove());
    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    for (let i = 0; i < firstDay; i++) grid.insertAdjacentHTML('beforeend', '<div class="date-cell empty"></div>');
    for (let d = 1; d <= totalDays; d++) {
        const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
        grid.insertAdjacentHTML('beforeend', `<div class="date-cell ${isToday ? 'today' : ''}">${d}</div>`);
    }
}
function prevMonth() { cur.setMonth(cur.getMonth() - 1); renderCalendar(); }
function nextMonth() { cur.setMonth(cur.getMonth() + 1); renderCalendar(); }

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('lichTrinhModal');
    if (modal) modal.addEventListener('shown.bs.modal', renderCalendar);
});

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
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.activeElement?.id === 'chatInput') sendMessage();
});