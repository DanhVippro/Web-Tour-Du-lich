// ============================================================
//  timkiem.js  –  Tìm kiếm tour từ API server (localhost:3000)
//  Lấy toàn bộ GET /api/tours rồi lọc phía client
// ============================================================

const API_BASE = "http://localhost:3000/api";

function formatPrice(price) {
    if (!price && price !== 0) return "Đang cập nhật";
    return Number(price).toLocaleString("vi-VN") + " đ";
}

function formatDate(dateStr) {
    if (!dateStr) return "Đang cập nhật";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

function statusBadge(status) {
    if (status === "full") return `<span class="badge bg-danger">Hết chỗ</span>`;
    if (status === "cancel") return `<span class="badge bg-secondary">Đã hủy</span>`;
    return `<span class="badge bg-success">Còn chỗ</span>`;
}

function slotsLeft(tour) {
    const left = (tour.maxCapacity || 0) - (tour.currentBookings || 0);
    return left > 0 ? left : 0;
}

function renderTours(tours) {
    const container = document.getElementById("ket-qua");

    if (!tours || tours.length === 0) {
        container.innerHTML = `<p class="text-center text-muted mt-4">Không tìm thấy tour nào phù hợp 😔</p>`;
        return;
    }

    container.innerHTML = tours.map(tour => {
        const imgSrc = tour.img || "../../data/img/Logo.png";
        const disabled = tour.status === "full" || tour.status === "cancel";
        const linkOpen = disabled ? `<div>` : `<a class="text-decoration-none" href="../html/Dattour.html?tour=${tour.id}">`;
        const linkClose = disabled ? `</div>` : `</a>`;
        const cardStyle = disabled ? "opacity:.6; cursor:not-allowed;" : "cursor:pointer;";

        return `
        <div class="col-md-4 mb-4">
            ${linkOpen}
            <div class="card h-100" style="${cardStyle}">
                <div style="position:relative;">
                    <img class="card-img-top" src="${imgSrc}"
                         alt="${tour.name}"
                         style="height:200px; object-fit:cover;"
                         onerror="this.src='../../data/img/Logo.png'">
                    <div style="position:absolute; top:10px; right:10px;">
                        ${statusBadge(tour.status)}
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-body1">
                        <h5 class="card-title">${tour.name}</h5>
                    </div>
                    <div class="card-body2">
                        <div class="card-body2-ct">
                            <img class="img-ct" src="../../data/img/list-tour-gr/logo-vitri.png" alt="">
                            <p>Lộ trình: <b>${tour.route || tour.location || "Đang cập nhật"}</b></p>
                        </div>
                        <div class="card-body2-ct">
                            <img class="img-ct" src="../../data/img/list-tour-gr/logo-hotel.png" alt="">
                            <p>Khách sạn: <b>${tour.hotel || "Đang cập nhật"}</b></p>
                        </div>
                        <div class="card-body2-ct">
                            <img class="img-ct" src="../../data/img/list-tour-gr/logo-ptien.png" alt="">
                            <p>Phương tiện: <b>${tour.transport || "Đang cập nhật"}</b></p>
                        </div>
                        <div class="card-body2-ct">
                            <img class="img-ct" src="../../data/img/list-tour-gr/logo-vitri.png" alt="">
                            <p>Còn lại: <b>${slotsLeft(tour)} chỗ</b></p>
                        </div>
                    </div>
                    <div class="card-bottom">
                        <h3 class="text1-card-bottom">${formatPrice(tour.price)}</h3>
                        <small class="text2-card-bottom">Khởi hành ngày ${formatDate(tour.departureDate)}</small>
                    </div>
                </div>
            </div>
            ${linkClose}
        </div>`;
    }).join("");
}

async function main() {
    const params = new URLSearchParams(window.location.search);
    const tuKhoa = params.get("q")?.trim().toLowerCase() || "";
    const tieuDe = document.getElementById("tieu-de-kq");
    const container = document.getElementById("ket-qua");

    tieuDe.textContent = tuKhoa
        ? `Kết quả tìm kiếm cho: "${params.get("q").trim()}"`
        : "Tất cả tour";

    container.innerHTML = `
        <div class="text-center w-100 py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Đang tải danh sách tour...</p>
        </div>`;

    try {
        // Luôn dùng GET /api/tours, lọc ở client để tránh lỗi route server
        const res = await fetch(`${API_BASE}/tours`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let tours = await res.json();

        // Lọc bỏ dữ liệu test / rác
        tours = tours.filter(t =>
            t.name &&
            t.destination &&
            t.destination.length < 50
        );

        // Lọc theo từ khóa nếu có
        if (tuKhoa) {
            tours = tours.filter(t =>
                t.name.toLowerCase().includes(tuKhoa) ||
                t.destination.toLowerCase().includes(tuKhoa) ||
                (t.location || "").toLowerCase().includes(tuKhoa) ||
                (t.route || "").toLowerCase().includes(tuKhoa) ||
                (t.transport || "").toLowerCase().includes(tuKhoa)
            );
        }

        renderTours(tours);

    } catch (err) {
        console.error("Lỗi khi tải tour:", err);
        container.innerHTML = `
            <div class="text-center w-100 py-5">
                <p class="text-danger">⚠️ Không thể kết nối đến server. Vui lòng kiểm tra lại!</p>
                <small class="text-muted">${err.message}</small>
            </div>`;
    }
}

main();