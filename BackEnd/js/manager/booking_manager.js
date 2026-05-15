
const BM_API = 'http://localhost:3000/api';

window._bmAllBookings = [];
window._bmTourMap = {};
let _bmActiveId = null;

async function loadBookingManager() {
    const tbody = document.getElementById('bmBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">
        <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...
    </td></tr>`;

    try {
        const [bookRes, tourRes] = await Promise.all([
            fetch(`${BM_API}/bookings`),
            fetch(`${BM_API}/tours`),
        ]);

        const bookings = await bookRes.json();
        const tours = await tourRes.json();

        window._bmAllBookings = bookings;

        window._bmTourMap = Object.fromEntries(
            tours.map(t => [t.id, t])
        );

        const totalCount = bookings.length;
        const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.totalPrice || 0), 0);
        const pendingCount = bookings.filter(b => b.status === 'pending').length;

        const totalCountEl = document.getElementById('bmTotalCount');
        const totalRevenueEl = document.getElementById('bmTotalRevenue');
        const pendingCountEl = document.getElementById('bmPendingCount');

        if (totalCountEl) totalCountEl.textContent = totalCount;
        if (totalRevenueEl) totalRevenueEl.textContent = formatPrice(revenue);
        if (pendingCountEl) pendingCountEl.textContent = pendingCount;

        // Render bảng
        if (!bookings.length) {
            tbody.innerHTML = `<td><td colspan="9" class="text-center text-muted py-4">Chưa có đơn đặt nào</td></tr>`;
            return;
        }

        renderBmTable(window._bmAllBookings);
        renderBmSummary(window._bmAllBookings);
    } catch (err) {
        console.error('Load booking error:', err);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
}

async function quickUpdateBookingStatus(id, status) {
    try {
        const res = await fetch(`${API}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        if (!res.ok) throw new Error('Cập nhật thất bại');
        showToast(status === 'confirmed' ? 'Đã xác nhận đơn!' : 'Đã hủy đơn!', status === 'confirmed' ? 'success' : 'danger');
        loadBookingManager();
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'danger');
    }
}

function applyBookingFilter() {
    const fromVal = document.getElementById('bmFrom')?.value;
    const toVal = document.getElementById('bmTo')?.value;
    const statusVal = document.getElementById('bmStatus')?.value || '';
    const searchVal = (document.getElementById('bmSearch')?.value || '').toLowerCase().trim();

    const activeQuick = document.querySelector('.bm-quick.active')?.dataset.filter || 'all';

    let filtered = [..._bmAllBookings];

    if (!fromVal && !toVal && activeQuick !== 'all') {
        const range = getQuickRange(activeQuick);
        filtered = filtered.filter(b => {
            const d = normalizeDate(
                b.bookingDate || b.departureDate
            );

            return (
                d >= normalizeDate(range.from) &&
                d <= normalizeDate(range.to)
            );
        });
    }

    if (fromVal) {
        filtered = filtered.filter(b => {
            const d = b.bookingDate || b.departureDate || '';
            return d >= normalizeDate(fromVal);
        });
    }
    if (toVal) {
        filtered = filtered.filter(b => {
            const d = b.bookingDate || b.departureDate || '';
            return d <= normalizeDate(toVal);
        });
    }

    if (statusVal) {
        filtered = filtered.filter(b => b.status === statusVal);
    }

    if (searchVal) {
        filtered = filtered.filter(b => {
            const name = (b.customerName || '').toLowerCase();
            const id = String(b.id || '').toLowerCase();
            const tour = String(
                _bmTourMap[b.tourId]?.name || ''
            ).toLowerCase();
            return name.includes(searchVal) || id.includes(searchVal) || tour.includes(searchVal);
        });
    }

    renderBmTable(filtered);
    renderBmSummary(filtered);
}

function getQuickRange(type) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (type === 'week') {
        const day = now.getDay();
        const mon = new Date(now);
        mon.setDate(now.getDate() - ((day + 6) % 7));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
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
function normalizeDate(dateStr) {
    if (!dateStr) return null;

    // yyyy-mm-dd
    if (dateStr.includes('-')) {
        return new Date(dateStr);
    }

    // dd/mm/yyyy
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(`${y}-${m}-${d}`);
    }

    return new Date(dateStr);
}

window.renderBmTable = function (bookings) {
    const tbody = document.getElementById('bmBody');
    const empty = document.getElementById('bmEmpty');
    if (!tbody) return;

    if (!bookings.length) {
        tbody.innerHTML = '';
        if (empty) empty.classList.remove('d-none');
        return;
    }
    if (empty) empty.classList.add('d-none');

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
                <small class="text-muted">${b.phone || ''}</small>
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

window.renderBmSummary = function (bookings) {
    const totalCountEl = document.getElementById('bmTotalCount');
    const totalRevenueEl = document.getElementById('bmTotalRevenue');
    const pendingCountEl = document.getElementById('bmPendingCount');

    if (totalCountEl) totalCountEl.textContent = bookings.length;
    const revenue = bookings
        .filter(b => b.status !== 'cancelled')
        .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
    if (totalRevenueEl) totalRevenueEl.textContent = formatBmPrice(revenue);
    if (pendingCountEl) pendingCountEl.textContent = bookings.filter(b => b.status === 'pending').length;
}

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
                <small class="text-muted">${b.email || '—'}</small><br>
                <small class="text-muted">${b.phone || '—'}</small>
            </div>
            <div class="col-md-6">
                <p class="mb-1 text-muted small"><i class="bi bi-credit-card me-1"></i>Căn cước công dân</p>
                <p class="mb-0">${b.cccd || '—'}</p>
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

    const el = document.getElementById('bmDetailModal');
    if (el) {
        const parentModal = bootstrap.Modal.getInstance(document.getElementById('donDatModal'));
        if (parentModal) parentModal.hide();
        setTimeout(() => {
            new bootstrap.Modal(el).show();
        }, 400);
    }
}

async function updateBookingStatus(newStatus) {
    if (!_bmActiveId) return;
    await _doUpdateStatus(_bmActiveId, newStatus);
    const detail = bootstrap.Modal.getInstance(document.getElementById('bmDetailModal'));
    if (detail) detail.hide();
    setTimeout(() => {
        new bootstrap.Modal(document.getElementById('donDatModal')).show();
        loadBookingManager();
    }, 400);
}

async function quickUpdateStatus(id, newStatus) {
    await _doUpdateStatus(id, newStatus);
    await loadBookingManager();
}

async function _doUpdateStatus(id, newStatus) {
    try {
        const res = await fetch(`${BM_API}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error(await res.text());
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

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.bm-quick').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bm-quick').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-outline-secondary');
            });
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-outline-secondary');
            const fromEl = document.getElementById('bmFrom');
            const toEl = document.getElementById('bmTo');
            if (fromEl) fromEl.value = '';
            if (toEl) toEl.value = '';
            applyBookingFilter();
        });
    });

    const searchEl = document.getElementById('bmSearch');
    if (searchEl) searchEl.addEventListener('input', applyBookingFilter);

    const statusEl = document.getElementById('bmStatus');
    if (statusEl) statusEl.addEventListener('change', applyBookingFilter);

    ['bmFrom', 'bmTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                document.querySelectorAll('.bm-quick').forEach(b => {
                    b.classList.remove('active');
                    b.classList.add('btn-outline-secondary');
                    b.classList.remove('btn-primary', 'btn-outline-primary');
                });
                applyBookingFilter();
            });
        }
    });
});

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

function showBmLoading() {
    const tbody = document.getElementById('bmBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...
        </td></tr>`;
    }
    const empty = document.getElementById('bmEmpty');
    if (empty) empty.classList.add('d-none');
}

function showBmToast(msg, color = 'success') {
    const t = document.createElement('div');
    t.className = `alert alert-${color} position-fixed bottom-0 end-0 m-3 shadow`;
    t.style.cssText = 'z-index:9999;min-width:260px;animation:fadeIn .2s ease';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}