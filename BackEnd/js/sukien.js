$(document).ready(function () {
    $("#HoTen").blur(function () {
        let ten = $(this).val().trim();

        if (ten == "") {
            $("#LoiDoHoTen").text("Không được rỗng");
        }
        else if (!/^([A-ZÀ-Ỹ][a-zà-ỹ]+(\s[A-ZÀ-Ỹ][a-zà-ỹ]+)+)$/.test(ten)) {
            $("#LoiDoHoTen").text("Viết hoa đầu mỗi từ, ít nhất 2 từ");
        }
        else {
            $("#LoiDoHoTen").text("");
        }
    });


    $("#dtEmail").blur(function () {
        let val = $(this).val().trim();

        let sdt = /^0\d{9}$/;
        let gmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

        if (val == "") {
            $("#LoiDodtEmail").text("Không được rỗng");
        }
        else if (!(sdt.test(val) || gmail.test(val))) {
            $("#LoiDodtEmail").text("Sai SĐT hoặc Gmail");
        }
        else {
            $("#LoiDodtEmail").text("");
        }
    });


    $("input[name='gioitinh']").change(function () {
        $("#LoiDogioitinh").text("");
    });


    $("#Tuoi").blur(function () {
        let ns = $(this).val();

        if (ns == "") {
            $("#LoiDoTuoi").text("Không được rỗng");
            return;
        }

        let today = new Date();
        let birth = new Date(ns);

        let age = today.getFullYear() - birth.getFullYear();
        let m = today.getMonth() - birth.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 16) {
            $("#LoiDoTuoi").text("Phải trên 16 tuổi");
        }
        else {
            $("#LoiDoTuoi").text("");
        }
    });


    $("#mk").blur(function () {
        let mk = $(this).val();

        if (mk == "") {
            $("#LoiDomk").text("Không được rỗng");
        }
        else if (!/[A-Z]/.test(mk)) {
            $("#LoiDomk").text("Phải có ít nhất 1 chữ hoa");
        }
        else {
            $("#LoiDomk").text("");
        }
    });


    $("#NLmk").blur(function () {
        let mk = $("#mk").val();
        let nlmk = $(this).val();

        if (nlmk == "") {
            $("#LoiDoNLmk").text("Không được rỗng");
        }
        else if (mk !== nlmk) {
            $("#LoiDoNLmk").text("Mật khẩu không khớp");
        }
        else {
            $("#LoiDoNLmk").text("");
        }
    });


    $("#formdk").submit(function (e) {
        e.preventDefault();

        $("#HoTen").blur();
        $("#dtEmail").blur();
        $("#Tuoi").blur();
        $("#mk").blur();
        $("#NLmk").blur();

        if (
            $("#LoiDoHoTen").text() ||
            $("#LoiDodtEmail").text() ||
            $("#LoiDoTuoi").text() ||
            $("#LoiDomk").text() ||
            $("#LoiDoNLmk").text()
        ) {
            alert("Còn lỗi!");
            return;
        }

        // check radio
        if (!$("input[name='gioitinh']:checked").val()) {
            $("#LoiDogioitinh").text("Chọn giới tính");
            return;
        }

        alert("Đăng ký thành công");
        this.submit();
    });
});

$("#formdn").submit(function (e) {
    e.preventDefault();

    let check = true;

    let dtEmaildn = $("#dtEmaildn").val().trim();
    let sdt = /^0\d{9}$/;
    let gmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!(sdt.test(dtEmaildn) || gmail.test(dtEmaildn))) {
        $("#LoiDotkDN").text("Email hoặc SĐT không đúng");
        check = false;
    } else {
        $("#LoiDotkDN").text("");
    }

    let mk = $("#mkdn").val();
    if (!/[A-Z]/.test(mk)) {
        $("#LoiDomkDN").text("Mật khẩu không chính xác");
        check = false;
    } else {
        $("#LoiDomkDN").text("");
    }

    if (check) {
        alert("Đăng nhập thành công");
        this.submit();
    }
});

