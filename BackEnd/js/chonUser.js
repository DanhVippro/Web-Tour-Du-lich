// ===== GLOBAL SCOPE: gọi được từ onclick= trong HTML =====
function toggleMenu(e) {
    e.preventDefault();
    const menu = document.getElementById('user-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function closeMenu() {
    document.getElementById('user-menu').style.display = 'none';
}

// ===== DOCUMENT READY =====
$(document).ready(function () {

    // ----- Đóng menu khi click ra ngoài -----
    $(document).on('click', function (e) {
        const wrapper = document.querySelector('.logo-login');
        if (wrapper && !wrapper.contains(e.target)) {
            closeMenu();
        }
    });

    // ----- Đổi ảnh đại diện (event delegation vì nằm trong modal) -----
    $(document).on('change', '#avt-input', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            $('#avt-img').attr('src', ev.target.result);
        };
        reader.readAsDataURL(file);
    });

    // ----- Fix lệch màn hình khi mở modal -----
    function fixLayout() {
        document.body.style.setProperty('padding-right', '0px', 'important');
        document.body.style.setProperty('margin-right', '0px', 'important');
        document.body.style.setProperty('overflow-x', 'hidden', 'important');
    }

    const observer = new MutationObserver(fixLayout);
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class']
    });

    $('.modal').each(function () {
        const modal = this;
        ['show.bs.modal', 'shown.bs.modal', 'hide.bs.modal', 'hidden.bs.modal'].forEach(function (evt) {
            modal.addEventListener(evt, fixLayout);
        });
    });

});