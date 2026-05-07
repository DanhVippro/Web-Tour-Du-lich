
const tours = [
    {
        id: "phuquoc",
        ten: "Tour Phú Quốc 5N4Đ",
        img: "../../data/img/list-tour-gr/phuquoc.jpg",
        loTrinh: "Từ TP.HCM, 5 Tỉnh Miền Tây",
        khachSan: "4 Sao",
        phuongTien: "Ô tô + tàu",
        gia: "5.600.000",
        ngay: "13/05",
        tags: ["phú quốc", "miền tây", "biển"]
    },
    {
        id: "sapa",
        ten: "Tour SaPa 4N3Đ",
        img: "../../data/img/list-tour-gr/sapa.jpg",
        loTrinh: "Từ TP.HCM, 5 tỉnh Miền Bắc",
        khachSan: "5 Sao",
        phuongTien: "Ô tô",
        gia: "9.300.000",
        ngay: "13/05",
        tags: ["sapa", "miền bắc", "núi"]
    },
    {
        id: "nhatrang",
        ten: "Tour Nha Trang 2N3Đ",
        img: "../../data/img/list-tour-gr/vinpearl-nt.webp",
        loTrinh: "Từ Đà Nẵng, 3 Tỉnh Miền Trung",
        khachSan: "3 Sao",
        phuongTien: "Ô tô + tàu",
        gia: "4.650.000",
        ngay: "10/05",
        tags: ["nha trang", "miền trung", "biển"]
    },
    {
        id: "trungquoc",
        ten: "Tour Trung Quốc 4N4Đ",
        img: "../../data/img/list-tour-gr/china.jpg",
        loTrinh: "Huế - Quảng Đông - Vân Nam - Tứ Xuyên",
        khachSan: "4 Sao",
        phuongTien: "Máy Bay + Tàu",
        gia: "15.990.000",
        ngay: "13/05",
        tags: ["trung quốc", "nước ngoài", "châu á"]
    },
    {
        id: "hanquoc",
        ten: "Tour Hàn Quốc 6N5Đ",
        img: "../../data/img/list-tour-gr/hanquoc.webp",
        loTrinh: "Từ TP.HCM - Seoul - Busan - Incheon",
        khachSan: "5 Sao",
        phuongTien: "Tàu + Máy Bay",
        gia: "20.600.000",
        ngay: "18/05",
        tags: ["hàn quốc", "nước ngoài", "châu á"]
    },
    {
        id: "nhatban",
        ten: "Tour Nhật Bản 7N6Đ",
        img: "../../data/img/list-tour-gr/japan.webp",
        loTrinh: "Nghệ An - Tokyo - Osaka - Hokkaido",
        khachSan: "5 Sao",
        phuongTien: "Máy Bay + Tàu",
        gia: "25.680.000",
        ngay: "11/05",
        tags: ["nhật bản", "nước ngoài", "châu á"]
    }
];

const params = new URLSearchParams(window.location.search);
const tuKhoa = params.get("q")?.toLowerCase().trim() || "";

document.getElementById("tieu-de-kq").textContent =
    tuKhoa ? `Kết quả tìm kiếm cho: "${tuKhoa}"` : "Tất cả tour";


const ketQua = tuKhoa
    ? tours.filter(t =>
        t.ten.toLowerCase().includes(tuKhoa) ||
        t.loTrinh.toLowerCase().includes(tuKhoa) ||
        t.tags.some(tag => tag.includes(tuKhoa))
    )
    : tours;


const container = document.getElementById("ket-qua");

if (ketQua.length === 0) {
    container.innerHTML = `<p class="text-center text-muted mt-4">Không tìm thấy tour nào phù hợp </p>`;
} else {
    ketQua.forEach(tour => {
        container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <a class="text-decoration-none" href="../html/ChiTietTour.html?tour=${tour.id}">
                        <div class="card h-100">
                            <img class="card-img-top" src="${tour.img}" alt="${tour.ten}">
                            <div class="card-body">
                                <div class="card-body1">
                                    <h5 class="card-title">${tour.ten}</h5>
                                </div>
                                <div class="card-body2">
                                    <div class="card-body2-ct">
                                        <img class="img-ct" src="../../data/img/list-tour-gr/logo-vitri.png" alt="">
                                        <p>Lộ trình: <b>${tour.loTrinh}</b></p>
                                    </div>
                                    <div class="card-body2-ct">
                                        <img class="img-ct" src="../../data/img/list-tour-gr/logo-hotel.png" alt="">
                                        <p>Khách sạn: <b>${tour.khachSan}</b></p>
                                    </div>
                                    <div class="card-body2-ct">
                                        <img class="img-ct" src="../../data/img/list-tour-gr/logo-ptien.png" alt="">
                                        <p>Phương tiện: <b>${tour.phuongTien}</b></p>
                                    </div>
                                </div>
                                <div class="card-bottom">
                                    <h3 class="text1-card-bottom">${tour.gia} <small>đ</small></h3>
                                    <small class="text2-card-bottom">Khởi hành ngày ${tour.ngay}</small>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>`;
    });
}
