

let currentQuickFilter = 'all';

function setQuickFilter(filter) {
    currentQuickFilter = filter;
    document.querySelectorAll('.bm-quick').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-secondary');
    });
    const activeBtn = document.querySelector(`.bm-quick[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'btn-primary');
        activeBtn.classList.remove('btn-outline-secondary');
    } else {
        const firstBtn = document.querySelector('.bm-quick');
        if (firstBtn) {
            firstBtn.classList.add('active', 'btn-primary');
            firstBtn.classList.remove('btn-outline-secondary');
        }
    }

    document.getElementById('bmFrom').value = '';
    document.getElementById('bmTo').value = '';

    applyBookingFilter();
}

function onDateRangeChange() {
    currentQuickFilter = 'custom';
    document.querySelectorAll('.bm-quick').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-secondary');
    });
    applyBookingFilter();
}
function applyBookingFilter() {

    if (!window._bmAllBookings) return;

    const fromVal = document.getElementById('bmFrom')?.value || '';
    const toVal = document.getElementById('bmTo')?.value || '';
    const statusVal = document.getElementById('bmStatus')?.value || '';

    const searchVal = (
        document.getElementById('bmSearch')?.value || ''
    ).toLowerCase().trim();

    let filtered = [...window._bmAllBookings];

    if (
        !fromVal &&
        !toVal &&
        currentQuickFilter !== 'custom' &&
        currentQuickFilter !== 'all'
    ) {

        const range = getQuickRange(currentQuickFilter);

        filtered = filtered.filter(b => {

            const rawDate =
                b.bookingDate ||
                b.departureDate ||
                '';

            if (!rawDate) return false;

            const d = new Date(rawDate)
                .toISOString()
                .split('T')[0];

            return d >= range.from && d <= range.to;
        });
    }

    // ===== Tu DATE =====
    if (fromVal) {

        filtered = filtered.filter(b => {

            const rawDate =
                b.bookingDate ||
                b.departureDate ||
                '';

            if (!rawDate) return false;

            const d = new Date(rawDate)
                .toISOString()
                .split('T')[0];

            return d >= fromVal;
        });
    }

    // ===== Toi DATE =====
    if (toVal) {

        filtered = filtered.filter(b => {

            const rawDate =
                b.bookingDate ||
                b.departureDate ||
                '';

            if (!rawDate) return false;

            const d = new Date(rawDate)
                .toISOString()
                .split('T')[0];

            return d <= toVal;
        });
    }

    // ===== STATUS =====
    if (statusVal) {

        filtered = filtered.filter(b =>
            (b.status || '') === statusVal
        );
    }

    // ===== SEARCH =====
    if (searchVal) {

        filtered = filtered.filter(b => {

            const name =
                String(b.customerName || '')
                    .toLowerCase();

            const id =
                String(b.id || '')
                    .toLowerCase();

            const tourName =
                String(
                    window._bmTourMap?.[b.tourId]?.name || ''
                ).toLowerCase();

            return (
                name.includes(searchVal) ||
                id.includes(searchVal) ||
                tourName.includes(searchVal)
            );
        });
    }
    if (typeof renderBmTable === 'function') {
        renderBmTable(filtered);
    }

    if (typeof renderBmSummary === 'function') {
        renderBmSummary(filtered);
    }
}