//-----------lay du lieu tu localstorage-
let userLocal = JSON.parse(localStorage.getItem("users")) || [];
//--tk admin--
const adminExists = userLocal.some(u => u.userEmail === "admin@gmail.com");
if (!adminExists) {
    userLocal.push({
        userId: 0,
        userName: "Admin",
        userSDT: "0900000000",
        userEmail: "admin@gmail.com",
        userGioiTinh: "Nam",
        userNgaySinh: "2000-01-01",
        userPwd: "Admin123",
        isAdmin: true
    });
    localStorage.setItem("users", JSON.stringify(userLocal));
}

//-------------
$(document).ready(function () {
    $("#HoTen").blur(function () {
        let ten = $(this).val().trim();
        if (ten == "") {
            $("#LoiDoHoTen").text("Không được rỗng");
        } else if (!/^([A-ZÀ-Ỹ][a-zà-ỹ]*)(\s[A-ZÀ-Ỹ][a-zà-ỹ]*)+$/.test(ten)) {
            $("#LoiDoHoTen").text("Viết hoa đầu mỗi từ, ít nhất 2 từ");
        } else {
            $("#LoiDoHoTen").text("");
        }
    });

    $("#dtSDT").blur(function () {
        let val = $(this).val().trim();
        let sdt = /^0\d{9}$/;
        if (val == "") {
            $("#LoiSDT").text("Không được rỗng");
        } else if (!(sdt.test(val))) {
            $("#LoiSDT").text("SDT không đúng định dạng");
        } else {
            $("#LoiSDT").text("");
        }
    });

    $("#dtEmail").blur(function () {
        let val = $(this).val().trim();
        let gmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (val == "") {
            $("#LoiEmail").text("Không được rỗng");
        } else if (!(gmail.test(val))) {
            $("#LoiEmail").text("Gmail không đúng định dạng");
        } else {
            $("#LoiEmail").text("");
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
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 16) {
            $("#LoiDoTuoi").text("Phải trên 16 tuổi");
        } else {
            $("#LoiDoTuoi").text("");
        }
    });

    $("#mk").blur(function () {
        let mk = $(this).val();
        if (mk == "") {
            $("#LoiDomk").text("Không được rỗng");
        } else if (!/[A-Z]/.test(mk)) {
            $("#LoiDomk").text("Phải có ít nhất 1 chữ hoa");
        } else {
            $("#LoiDomk").text("");
        }
    });

    $("#NLmk").blur(function () {
        let mk = $("#mk").val();
        let nlmk = $(this).val();
        if (nlmk == "") {
            $("#LoiDoNLmk").text("Không được rỗng");
        } else if (mk !== nlmk) {
            $("#LoiDoNLmk").text("Mật khẩu không khớp");
        } else {
            $("#LoiDoNLmk").text("");
        }
    });

    // ===== ĐĂNG KÍ =====
    $("#formdk").submit(function (e) {
        e.preventDefault();

        $("#HoTen").blur();
        $("#dtSDT").blur();
        $("#dtEmail").blur();
        $("#Tuoi").blur();
        $("#mk").blur();
        $("#NLmk").blur();

        if (
            $("#LoiDoHoTen").text() ||
            $("#LoiSDT").text() ||
            $("#LoiEmail").text() ||
            $("#LoiDoTuoi").text() ||
            $("#LoiDomk").text() ||
            $("#LoiDoNLmk").text()
        ) {
            alert("Còn lỗi!");
            return;
        }

        if (!$("input[name='gioitinh']:checked").val()) {
            $("#LoiDogioitinh").text("Chọn giới tính");
            return;
        }

        const user = {
            userId: Math.ceil(Math.random() * 1000000),
            userName: $("#HoTen").val(),
            userSDT: $("#dtSDT").val(),
            userEmail: $("#dtEmail").val(),
            userGioiTinh: $("input[name='gioitinh']:checked").val(),
            userNgaySinh: $("#Tuoi").val(),
            userPwd: $("#mk").val()
        };
        userLocal.push(user);
        localStorage.setItem("users", JSON.stringify(userLocal));
        let modalDK = bootstrap.Modal.getInstance(document.getElementById('modaldk'));
        modalDK.hide();
        $("#formdk")[0].reset();
        showSuccess("Đăng ký thành công!", "Vui lòng đăng nhập để tiếp tục", 1800, function () {
            let modalLog = new bootstrap.Modal(document.getElementById('modalLog'));
            modalLog.show();
        });
    });

    // ===== ĐĂNG NHẬP =====
    $("#formdn").submit(function (e) {
        e.preventDefault();

        let email = $("#dtEmaildn").val().trim();
        let pwd = $("#mkdn").val();

        const findUser = userLocal.find(
            (user) => user.userEmail === email && user.userPwd === pwd
        );

        if (findUser) {
            $("#alertLogin").hide();
            let modalLog = bootstrap.Modal.getInstance(document.getElementById('modalLog'));
            if (modalLog) modalLog.hide();
            if (findUser.isAdmin) {
                showSuccess("Đăng nhập Admin!", "Đang vào trang quản trị...", 1800, function () {
                    window.location.href = "../html/manager/manager.html";
                });
            } else {
                showSuccess("Đăng nhập thành công!", "Chào mừng " + findUser.userName, 1800, function () {
                    window.location.href = "trangChu.html";
                });
            }
        } else {
            $("#alertLogin").css("display", "block");
        }
    });
});