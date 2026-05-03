/**
 * dsTour.js — Quản lý danh sách Tour
 * Kết nối API: GET/POST/PUT/DELETE /api/tours
 *              GET /api/statistics
 */

const API = 'http://localhost:3000/api';

/* ─── State ─────────────────────────────────────────────── */
let allTours = [];   // toàn bộ tour từ server
let tourToDelete = null; // lưu id khi xác nhận xóa

/* ─── Khởi động ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadTours();
    bindSearch();
    bindStatusFilter();
});

/* ─── Load thống kê (header boxes) ──────────────────────── */
async function loadStatistics() {
    try {
        const res = await fetch(`${API}/statistics`);
        const stat = await res.json();
        setEl('statTotal', stat.totalTours);
        setEl('statOpen', stat.openTours);
        setEl('statFull', stat.fullTours);
    } catch (e) {
        console.error('Không lấy được thống kê:', e);
    }
}

/* ─── Load tất cả tour ───────────────────────────────────── */
async function loadTours() {
    try {
        const res = await fetch(`${API}/tours`);
        allTours = await res.json();
        renderTable(allTours);
    } catch (e) {
        showTableError('Không thể kết nối server. Hãy kiểm tra server.js đã chạy chưa.');
    }
}

/* ─── Render bảng ────────────────────────────────────────── */
function renderTable(tours) {
    const tbody = document.getElementById('tourTableBody');
    const empty = document.getElementById('emptyMsg');

    tbody.innerHTML = '';

    if (!tours || tours.length === 0) {
        empty.classList.remove('d-none');
        return;
    }
    empty.classList.add('d-none');

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

/* ─── Tìm kiếm (debounce 300ms) ─────────────────────────── */
function bindSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(applyFilters, 300);
    });
}

/* ─── Lọc theo trạng thái ───────────────────────────────── */
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

/* ─── Modal: MỞ THÊM MỚI ────────────────────────────────── */
function openAdd() {
    document.getElementById('tourModalTitle').textContent = 'Thêm Tour Mới';
    document.getElementById('tourId').value = '';
    clearForm();
    hideFormError();
}

/* ─── Modal: MỞ SỬA ─────────────────────────────────────── */
async function openEdit(id) {
    document.getElementById('tourModalTitle').textContent = 'Chỉnh sửa Tour';
    hideFormError();

    try {
        const res = await fetch(`${API}/tours/${id}`, { cache: "no-store" });
        const tour = await res.json();

        // ===== FIELD CƠ BẢN =====
        document.getElementById('tourId').value = tour.id;
        document.getElementById('fTen').value = tour.name || '';
        document.getElementById('fDiaDiem').value = tour.destination || '';
        document.getElementById('fNgay').value = tour.departureDate || '';

        document.getElementById('fSoKhach').value = tour.currentBookings ?? 0;
        document.getElementById('fSoKhachMax').value = tour.maxCapacity || '';
        document.getElementById('fGia').value = tour.price || '';

        document.getElementById('fHdv').value = tour.guide || '';
        document.getElementById('fTrangThai').value = tour.status || 'open';
        document.getElementById('fMoTa').value = tour.description || '';

        // ===== FIELD BẠN THIẾU =====
        document.getElementById('fLocation').value = tour.location || '';
        document.getElementById('fDuration').value = tour.duration || '';
        document.getElementById('fHotel').value = tour.hotel || '';
        document.getElementById('fTransport').value = tour.transport || '';
        document.getElementById('fRoute').value = tour.route || '';

        // images: array → string
        document.getElementById('fImages').value =
            Array.isArray(tour.images) ? tour.images.join(',') : '';

        // ===== MỞ MODAL =====
        new bootstrap.Modal(document.getElementById('tourModal')).show();

    } catch (e) {
        console.error(e);
        alert('Không tải được thông tin tour!');
    }
}

/* ─── Lưu tour (thêm mới / cập nhật) ───────────────────── */
async function saveTour() {
    const id = document.getElementById('tourId').value.trim();
    const name = document.getElementById('fTen').value.trim();
    const dest = document.getElementById('fDiaDiem').value.trim();
    const date = document.getElementById('fNgay').value;
    const max = parseInt(document.getElementById('fSoKhachMax').value) || 0;
    const gia = parseInt(document.getElementById('fGia').value) || 0;

    // Validate
    if (!name || !dest || !date || !max || !gia) {
        showFormError('Vui lòng điền đầy đủ các trường bắt buộc (*).');
        return;
    }

    const payload = {
        id: id || crypto.randomUUID(),

        name,
        destination: dest,
        location: document.getElementById('fLocation').value.trim() || "Chưa cập nhật",

        departureDate: date,
        duration: document.getElementById('fDuration').value.trim() || "Chưa cập nhật",

        price: gia,
        maxCapacity: max,
        currentBookings: parseInt(document.getElementById('fSoKhach').value) || 0,

        hotel: document.getElementById('fHotel').value.trim() || "3 Sao",
        transport: document.getElementById('fTransport').value.trim() || "Đang cập nhật",

        description: document.getElementById('fMoTa').value.trim(),

        guide: document.getElementById('fHdv').value.trim(),

        images: document.getElementById('fImages').value
            ? document.getElementById('fImages').value.split(',').map(i => i.trim())
            : ["default.jpg"],

        status: document.getElementById('fTrangThai').value,

        route: document.getElementById('fRoute').value.trim() || "Đang cập nhật"
    };

    try {
        let res;
        if (id) {
            // PUT — cập nhật
            res = await fetch(`${API}/tours/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            // POST — thêm mới (tạo id từ tên)
            payload.id = dest.toLowerCase().replace(/\s+/g, '') + Date.now();
            res = await fetch(`${API}/tours`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        if (!res.ok) throw new Error(await res.text());

        bootstrap.Modal.getInstance(document.getElementById('tourModal'))?.hide();
        await loadTours();
        await loadStatistics();
        showToast(id ? 'Cập nhật tour thành công!' : 'Thêm tour mới thành công!');
    } catch (e) {
        showFormError('Lưu thất bại: ' + e.message);
    }
}

/* ─── Modal: XÁC NHẬN XÓA ───────────────────────────────── */
function openDelete(id, name) {
    tourToDelete = id;
    document.getElementById('deleteTourName').textContent = name;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function confirmDelete() {
    if (!tourToDelete) return;
    try {
        const res = await fetch(`${API}/tours/${tourToDelete}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error('Xóa thất bại');

        bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
        tourToDelete = null;
        await loadTours();
        await loadStatistics();
        showToast('Đã xóa tour!', 'danger');
    } catch (e) {
        alert('Xóa thất bại: ' + e.message);
    }
}

/* ─── Helpers ────────────────────────────────────────────── */
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
    ['fTen', 'fDiaDiem', 'fNgay', 'fSoKhach', 'fSoKhachMax', 'fGia', 'fHdv', 'fMoTa'].forEach(id => {
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

/* Toast thông báo nhanh */
function showToast(msg, color = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${color} position-fixed bottom-0 end-0 m-3 shadow`;
    toast.style.cssText = 'z-index:9999;min-width:260px;animation:fadeIn .3s';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
}

/* ─── Calendar & Date (từ dsManager.js gốc) ─────────────── */
document.addEventListener('DOMContentLoaded', function () {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    const dayEl = document.getElementById('dayName');
    const dateEl = document.getElementById('fullDate');
    if (dayEl) dayEl.textContent = days[now.getDay()];
    if (dateEl) dateEl.textContent =
        `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`;
});

let cur = new Date();
function render() {
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
function prevMonth() { cur.setMonth(cur.getMonth() - 1); render(); }
function nextMonth() { cur.setMonth(cur.getMonth() + 1); render(); }

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('lichTrinhModal');
    if (modal) modal.addEventListener('shown.bs.modal', render);
});

/* Chat */
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
