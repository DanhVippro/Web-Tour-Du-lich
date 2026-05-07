/**
 * booking_manager.js — Quản lý Đơn đặt Tour
 * Tính năng:
 *   - Tải dữ liệu thật từ /api/bookings + /api/tours
 *   - Lọc: Tất cả | Tuần này | Tháng này | Năm này | Khoảng ngày tùy chọn
 *   - Lọc theo trạng thái (confirmed / pending / cancelled)
 *   - Tìm kiếm theo tên khách / mã booking
 *   - Cập nhật trạng thái đơn (Xác nhận / Hủy) → PUT /api/bookings/:id
 *   - Tóm tắt: tổng đơn, doanh thu, chờ duyệt
 */

const BM_API = 'http://localhost:3000/api';

let _bmAllBookings = [];   // raw data từ server
let _bmTourMap = {};    // { tourId: tourObject }
let _bmActiveId = null;  // booking đang mở trong detail modal

/* ═══════════════════════════════════════════════════
   ENTRY — gọi khi mở modal Quản lý Đơn đặt
═══════════════════════════════════════════════════ */
async function loadBookingManager() {
    showBmLoading();
    try {
        const [bookRes, tourRes] = await Promise.all([
            fetch(`${BM_API}/bookings`),
            fetch(`${BM_API}/tours`),
        ]);

        if (!bookRes.ok || !tourRes.ok) throw new Error('Server lỗi');

        _bmAllBookings = await bookRes.json();
        const tours = await tourRes.json();
        _bmTourMap = Object.fromEntries(tours.map(t => [t.id, t]));

        // Cập nhật thời gian làm mới
        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setElBm('bmLastUpdate', `Cập nhật lúc ${now}`);

        // Render với bộ lọc hiện tại
        applyBookingFilter();

    } catch (err) {
        console.error('BookingManager error:', err);
        const tbody = document.getElementById('bmBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">
                <i class="bi bi-wifi-off me-2"></i>Không thể kết nối server: ${err.message}
            </td></tr>`;
        }
    }
}

/* ═══════════════════════════════════════════════════
   FILTER — áp dụng toàn bộ bộ lọc
═══════════════════════════════════════════════════ */
function applyBookingFilter() {
    const fromVal = document.getElementById('bmFrom')?.value;
    const toVal = document.getElementById('bmTo')?.value;
    const statusVal = document.getElementById('bmStatus')?.value || '';
    const searchVal = (document.getElementById('bmSearch')?.value || '').toLowerCase().trim();

    // Xác định khoảng ngày từ quick-filter nếu chưa nhập range thủ công
    const activeQuick = document.querySelector('.bm-quick.active')?.dataset.filter || 'all';

    let filtered = [..._bmAllBookings];

    // ── 1. Quick date filter (chỉ dùng nếu không có từ/đến thủ công) ──
    if (!fromVal && !toVal && activeQuick !== 'all') {
        const range = getQuickRange(activeQuick);
        filtered = filtered.filter(b => {
            const d = b.bookingDate || b.departureDate || '';
            return d >= range.from && d <= range.to;
        });
    }

    // ── 2. Manual date range ──
    if (fromVal) {
        filtered = filtered.filter(b => {
            const d = b.bookingDate || b.departureDate || '';
            return d >= fromVal;
        });
    }
    if (toVal) {
        filtered = filtered.filter(b => {
            const d = b.bookingDate || b.departureDate || '';
            return d <= toVal;
        });
    }

    // ── 3. Status ──
    if (statusVal) {
        filtered = filtered.filter(b => b.status === statusVal);
    }

    // ── 4. Search (mã booking / tên khách) ──
    if (searchVal) {
        filtered = filtered.filter(b => {
            const name = (b.customerName || '').toLowerCase();
            const id = (b.id || '').toLowerCase();
            const tour = (_bmTourMap[b.tourId]?.name || '').toLowerCase();
            return name.includes(searchVal) || id.includes(searchVal) || tour.includes(searchVal);
        });
    }

    renderBmTable(filtered);
    renderBmSummary(filtered);
}

/* ═══════════════════════════════════════════════════
   QUICK RANGE helper
═══════════════════════════════════════════════════ */
function getQuickRange(type) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (type === 'week') {
        const day = now.getDay(); // 0=CN
        const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return { from: mon.toISOString().split('T')[0], to: sun.toISOString().split('T')[0] };
    }
    if (type === 'month') {
        const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { from, to: last.toISOString().split('T')[0] };
    }
    if (type === 'year') {
        return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
    }
    return { from: '2000-01-01', to: '2099-12-31' };
}

/* ═══════════════════════════════════════════════════
   RENDER TABLE
═══════════════════════════════════════════════════ */
function renderBmTable(bookings) {
    const tbody = document.getElementById('bmBody');
    const empty = document.getElementById('bmEmpty');
    if (!tbody) return;

    if (!bookings.length) {
        tbody.innerHTML = '';
        empty?.classList.remove('d-none');
        return;
    }
    empty?.classList.add('d-none');

    // Sắp xếp mới nhất trước
    const sorted = [...bookings].sort((a, b) => {
        const da = a.bookingDate || a.departureDate || '';
        const db = b.bookingDate || b.departureDate || '';
        return db.localeCompare(da);
    });

    tbody.innerHTML = sorted.map(b => {
        const tour = _bmTourMap[b.tourId] || {};
        const tickets = (b.adultTickets || 0) + (b.childTickets || 0);
        const { cls, label } = getBmStatusBadge(b.status);

        return `<tr data-id="${b.id}" style="cursor:pointer" onclick="openBmDetail('${b.id}')">
            <td><span class="fw-semibold text-primary">#${b.id}</span></td>
            <td>
                <div class="fw-semibold">${b.customerName || '—'}</div>
                <small class="text-muted">${b.customerPhone || b.phone || ''}</small>
            </td>
            <td>
                <div>${tour.name || b.tourId || '—'}</div>
                <small class="text-muted"><i class="bi bi-geo-alt"></i> ${tour.destination || ''}</small>
            </td>
            <td>${formatBmDate(b.bookingDate)}</td>
            <td>${formatBmDate(b.departureDate || tour.departureDate)}</td>
            <td class="text-center">
                <span class="badge bg-secondary-subtle text-secondary border">${tickets} vé</span>
            </td>
            <td class="fw-semibold text-success">${formatBmPrice(b.totalPrice)}</td>
            <td><span class="badge ${cls} px-2 py-1">${label}</span></td>
            <td>
                <div class="d-flex gap-1" onclick="event.stopPropagation()">
                    <button class="btn btn-xs btn-outline-success" title="Xác nhận"
                        onclick="quickUpdateStatus('${b.id}','confirmed')">
                        <i class="bi bi-check2"></i>
                    </button>
                    <button class="btn btn-xs btn-outline-danger" title="Hủy"
                        onclick="quickUpdateStatus('${b.id}','cancelled')">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

/* ═══════════════════════════════════════════════════
   RENDER SUMMARY CHIPS
═══════════════════════════════════════════════════ */
function renderBmSummary(bookings) {
    setElBm('bmTotalCount', bookings.length);
    const revenue = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
    setElBm('bmTotalRevenue', formatBmPrice(revenue));
    setElBm('bmPendingCount', bookings.filter(b => b.status === 'pending').length);
}

/* ═══════════════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════════════ */
function openBmDetail(id) {
    _bmActiveId = id;
    const b = _bmAllBookings.find(x => x.id == id);
    if (!b) return;
    const tour = _bmTourMap[b.tourId] || {};
    const { cls, label } = getBmStatusBadge(b.status);
    const tickets = (b.adultTickets || 0) + (b.childTickets || 0);

    const body = document.getElementById('bmDetailBody');
    if (body) {
        body.innerHTML = `
        <div class="row g-3">
            <div class="col-6">
                <p class="mb-1 text-muted small">Mã đơn</p>
                <p class="fw-bold text-primary">#${b.id}</p>
            </div>
            <div class="col-6 text-end">
                <span class="badge ${cls} px-3 py-2 fs-6">${label}</span>
            </div>

            <div class="col-12"><hr class="my-0"></div>

            <div class="col-md-6">
                <p class="mb-1 text-muted small"><i class="bi bi-person me-1"></i>Khách hàng</p>
                <p class="fw-semibold mb-0">${b.customerName || '—'}</p>
                <small class="text-muted">${b.customerEmail || b.email || '—'}</small><br>
                <small class="text-muted">${b.customerPhone || b.phone || '—'}</small>
            </div>
            <div class="col-md-6">
                <p class="mb-1 text-muted small"><i class="bi bi-map me-1"></i>Tour</p>
                <p class="fw-semibold mb-0">${tour.name || b.tourId || '—'}</p>
                <small class="text-muted">${tour.destination || '—'}</small>
            </div>

            <div class="col-md-4">
                <p class="mb-1 text-muted small"><i class="bi bi-calendar-check me-1"></i>Ngày đặt</p>
                <p class="mb-0">${formatBmDate(b.bookingDate)}</p>
            </div>
            <div class="col-md-4">
                <p class="mb-1 text-muted small"><i class="bi bi-airplane me-1"></i>Ngày khởi hành</p>
                <p class="mb-0">${formatBmDate(b.departureDate || tour.departureDate)}</p>
            </div>
            <div class="col-md-4">
                <p class="mb-1 text-muted small"><i class="bi bi-people me-1"></i>Số vé</p>
                <p class="mb-0">
                    ${b.adultTickets || 0} người lớn
                    ${b.childTickets ? ` + ${b.childTickets} trẻ em` : ''}
                    <strong>(${tickets} vé)</strong>
                </p>
            </div>

            <div class="col-12">
                <p class="mb-1 text-muted small"><i class="bi bi-cash-coin me-1"></i>Tổng tiền</p>
                <p class="fs-5 fw-bold text-success mb-0">${formatBmPrice(b.totalPrice)}</p>
            </div>

            ${b.note ? `<div class="col-12">
                <p class="mb-1 text-muted small">Ghi chú</p>
                <p class="mb-0 fst-italic">${b.note}</p>
            </div>` : ''}
        </div>`;
    }

    // Hiện detail modal
    const el = document.getElementById('bmDetailModal');
    if (el) {
        // Đóng donDatModal trước
        const parentModal = bootstrap.Modal.getInstance(document.getElementById('donDatModal'));
        if (parentModal) parentModal.hide();
        setTimeout(() => {
            new bootstrap.Modal(el).show();
        }, 400);
    }
}

/* ═══════════════════════════════════════════════════
   UPDATE STATUS — từ detail modal
═══════════════════════════════════════════════════ */
async function updateBookingStatus(newStatus) {
    if (!_bmActiveId) return;
    await _doUpdateStatus(_bmActiveId, newStatus);

    // Đóng detail modal, mở lại donDat modal
    const detail = bootstrap.Modal.getInstance(document.getElementById('bmDetailModal'));
    if (detail) detail.hide();
    setTimeout(() => {
        new bootstrap.Modal(document.getElementById('donDatModal')).show();
        loadBookingManager();
    }, 400);
}

/* ═══════════════════════════════════════════════════
   QUICK UPDATE — từ nút trong table
═══════════════════════════════════════════════════ */
async function quickUpdateStatus(id, newStatus) {
    await _doUpdateStatus(id, newStatus);
    await loadBookingManager(); // reload ngay
}

async function _doUpdateStatus(id, newStatus) {
    try {
        const res = await fetch(`${BM_API}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error(await res.text());

        // Cập nhật local cache
        const idx = _bmAllBookings.findIndex(b => b.id == id);
        if (idx !== -1) _bmAllBookings[idx].status = newStatus;

        showBmToast(
            newStatus === 'confirmed' ? '✅ Đã xác nhận đơn!' : '❌ Đã hủy đơn!',
            newStatus === 'confirmed' ? 'success' : 'danger'
        );
    } catch (err) {
        console.error('Update status error:', err);
        showBmToast('Cập nhật thất bại: ' + err.message, 'danger');
    }
}

/* ═══════════════════════════════════════════════════
   QUICK-FILTER BUTTON EVENTS
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Quick filter toggle
    document.querySelectorAll('.bm-quick').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bm-quick').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline-secondary');
            });
            btn.classList.add('active', 'btn-outline-primary');
            btn.classList.remove('btn-outline-secondary');

            // Xóa range thủ công khi chọn quick filter
            if (document.getElementById('bmFrom')) document.getElementById('bmFrom').value = '';
            if (document.getElementById('bmTo')) document.getElementById('bmTo').value = '';

            applyBookingFilter();
        });
    });

    // Live search
    document.getElementById('bmSearch')?.addEventListener('input', applyBookingFilter);
    document.getElementById('bmStatus')?.addEventListener('change', applyBookingFilter);

    // Khi nhập ngày → bỏ active quick filter
    ['bmFrom', 'bmTo'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            document.querySelectorAll('.bm-quick').forEach(b => {
                b.classList.remove('active');
                b.classList.add('btn-outline-secondary');
                b.classList.remove('btn-primary', 'btn-outline-primary');
            });
        });
    });
});

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
function getBmStatusBadge(status) {
    const map = {
        confirmed: { cls: 'bg-success text-white', label: '✓ Xác nhận' },
        pending: { cls: 'bg-warning text-dark', label: '⏳ Chờ duyệt' },
        cancelled: { cls: 'bg-danger text-white', label: '✕ Đã hủy' },
    };
    return map[status] || { cls: 'bg-secondary text-white', label: status || '—' };
}

function formatBmDate(d) {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
}

function formatBmPrice(p) {
    if (p === undefined || p === null || p === '') return '—';
    return Number(p).toLocaleString('vi-VN') + 'đ';
}

function setElBm(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function showBmLoading() {
    const tbody = document.getElementById('bmBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...
        </td></tr>`;
    }
    document.getElementById('bmEmpty')?.classList.add('d-none');
}

function showBmToast(msg, color = 'success') {
    const t = document.createElement('div');
    t.className = `alert alert-${color} position-fixed bottom-0 end-0 m-3 shadow`;
    t.style.cssText = 'z-index:9999;min-width:260px;animation:fadeIn .2s ease';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}