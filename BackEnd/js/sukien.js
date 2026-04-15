document.getElementById("formdk").addEventListener("submit", function (e) {
    e.preventDefault();

    let check = true;

    let HoTen = document.getElementById("HoTen").value.trim();
    if (!/^([A-ZÀ-Ỹ][a-zà-ỹ]+(\s[A-ZÀ-Ỹ][a-zà-ỹ]+)*)$/.test(HoTen)) {
        document.getElementById("LoiDoHoTen").innerText = "Viết hoa đầu mỗi từ";
        check = false;
    } else {
        document.getElementById("LoiDoHoTen").innerText = "";
    }

    let dtEmail = document.getElementById("dtEmail").value.trim();
    let sdt = /^0\d{9}$/;
    let gmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!(sdt.test(dtEmail) || gmail.test(dtEmail))) {
        document.getElementById("LoiDodtEmail")
            .innerText = "Nhập SĐT (10 số bắt đầu từ 0) hoặc (Gmail dạng abc@gmail.com)";
        check = false;
    } else {
        document.getElementById("LoiDodtEmail").innerText = "";
    }

    let gioitinh = document.querySelector('input[name="gioitinh"]:checked');
    if (!gioitinh) {
        document.getElementById("LoiDogioitinh").innerText = "Phải chọn giới tính";
        check = false;
    } else {
        document.getElementById("LoiDogioitinh").innerText = "";
    }

    let ngaySinh = document.getElementById("Tuoi").value;
    if (ngaySinh === "") {
        document.getElementById("LoiDoTuoi").innerText = "Chọn ngày sinh";
        check = false;
    } else {
        let today = new Date();
        let birth = new Date(ngaySinh);
        let age = today.getFullYear() - birth.getFullYear();

        if (
            age < 16 ||
            (age === 16 &&
                (today.getMonth() < birth.getMonth() ||
                    (today.getMonth() === birth.getMonth() &&
                        today.getDate() < birth.getDate())))
        ) {
            document.getElementById("LoiDoTuoi").innerText = "Phải trên 16 tuổi";
            check = false;
        } else {
            document.getElementById("LoiDoTuoi").innerText = "";
        }
    }

    let mk = document.getElementById("mk").value;
    if (!/[A-Z]/.test(mk)) {
        document.getElementById("LoiDomk").innerText = "Phải có ít nhất 1 chữ hoa";
        check = false;
    } else {
        document.getElementById("LoiDomk").innerText = "";
    }

    let nlmk = document.getElementById("NLmk").value;
    if (mk !== nlmk) {
        document.getElementById("LoiDoNLmk").innerText = "Mật khẩu không khớp";
        check = false;
    } else {
        document.getElementById("LoiDoNLmk").innerText = "";
    }

    if (check) {
        alert("Đăng ký thành công ");
        this.submit();
    }
});

document.getElementById("formdn").addEventListener("submit", function (e) {
    e.preventDefault();

    let check = true;

    let dtEmaildn = document.getElementById("dtEmaildn").value.trim();
    let sdt = /^0\d{9}$/;
    let gmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!(sdt.test(dtEmaildn) || gmail.test(dtEmaildn))) {
        document.getElementById("LoiDotkDN")
            .innerText = "Email hoặc số điện thoại không đúng";
        check = false;
    } else {
        document.getElementById("LoiDotkDN").innerText = "";
    }
    let mk = document.getElementById("mkdn").value;
    if (!/[A-Z]/.test(mk)) {
        document.getElementById("LoiDomkDN").innerText = "Mật khẩu không chính xác";
        check = false;
    } else {
        document.getElementById("LoiDomkDN").innerText = "";
    }
    if (check) {
        alert("Đăng nhập thành công ");
        this.submit();
    }
});

