function openImagePicker(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const input = document.getElementById('imageUploadInput');
    const modal = document.getElementById('tourModal');
    const bsModal = bootstrap.Modal.getInstance(modal);

    const preventModalClose = (e) => e.stopImmediatePropagation();
    modal.addEventListener('hide.bs.modal', preventModalClose, true);

    const cleanup = () => {
        setTimeout(() => {
            modal.removeEventListener('hide.bs.modal', preventModalClose, true);
        }, 500);
        window.removeEventListener('focus', cleanup);
    };
    window.addEventListener('focus', cleanup, { once: true });

    input.click();
}

async function handleImageUpload(input) {

    const files = input.files;

    if (!files || !files.length) return;

    const preview = document.getElementById('imagePreview');
    const fImages = document.getElementById('fImages');

    let uploadedUrls = [];

    for (const file of files) {

        const formData = new FormData();
        formData.append('image', file);

        try {

            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.url) {

                uploadedUrls.push(data.url);

                const img = document.createElement('img');

                img.src = data.url;

                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '12px';
                img.style.border = '2px solid #ddd';

                preview.appendChild(img);
            }

        } catch (err) {

            console.error('Upload thất bại:', err);

        }
    }

    const oldVal = fImages.value
        ? fImages.value.split(',')
        : [];

    const finalImages = [...oldVal, ...uploadedUrls];

    fImages.value = finalImages.join(',');

    input.value = '';
}

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
function getQuickRange(type) {
    const now = new Date();
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
function applyBookingFilter() {

    if (!window._bmAllBookings) return;

    const fromVal = document.getElementById('bmFrom')?.value || '';
    const toVal = document.getElementById('bmTo')?.value || '';
    const statusVal = document.getElementById('bmStatus')?.value || '';

    const searchVal = (
        document.getElementById('bmSearch')?.value || ''
    ).toLowerCase().trim();

    let filtered = [...window._bmAllBookings];

    // ===== QUICK FILTER =====
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