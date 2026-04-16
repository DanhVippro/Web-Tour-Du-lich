/*HIỂN THỊ NGÀY THÁNG*/

document.addEventListener("DOMContentLoaded", function () {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const now = new Date();

    const dayName = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const dayEl = document.getElementById('dayName');
    const dateEl = document.getElementById('fullDate');

    if (dayEl) dayEl.textContent = dayName;
    if (dateEl) dateEl.textContent = `${date} / ${month} / ${year}`;
});


/*CALENDAR */

let cur = new Date();
function render() {
    const y = cur.getFullYear();
    const m = cur.getMonth();

    const monthYear = document.getElementById('monthYear');
    const grid = document.getElementById('calGrid');

    if (!monthYear || !grid) return;
    monthYear.textContent = `Tháng ${m + 1} ${y}`;
    grid.querySelectorAll('.date-cell').forEach(e => e.remove());

    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    for (let i = 0; i < firstDay; i++) {
        grid.insertAdjacentHTML('beforeend', `<div class="date-cell empty"></div>`);
    }
    for (let d = 1; d <= totalDays; d++) {
        const isToday =
            d === today.getDate() &&
            m === today.getMonth() &&
            y === today.getFullYear();

        grid.insertAdjacentHTML(
            'beforeend',
            `<div class="date-cell ${isToday ? 'today' : ''}">${d}</div>`
        );
    }
}
// chuyển tháng
function prevMonth() {
    cur.setMonth(cur.getMonth() - 1);
    render();
}

function nextMonth() {
    cur.setMonth(cur.getMonth() + 1);
    render();
}


/* MODAL EVENT*/
// Khi mở modal -> render lịch
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById('lichTrinhModal');

    if (modal) {
        modal.addEventListener('shown.bs.modal', function () {
            render();
        });
    }
});

function sendMessage() {
    const input   = document.getElementById("chatInput");
    const chatList = document.getElementById("chatList");
    const text    = input?.value.trim();
    if (!text || !chatList) return;
 
    const div = document.createElement("div");
    div.className = "p-2 border rounded mb-2 bg-primary-subtle text-end";
    div.innerHTML = `<p class="mb-0">${text}</p><small class="text-muted">${new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</small>`;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
    input.value = "";
}
document.addEventListener("keydown", e => {
    if (e.key === "Enter" && document.activeElement?.id === "chatInput") sendMessage();
});

//BOOKING CARD CLICK
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".booking-card").forEach(card => {
        card.addEventListener("click", function () {
            const id = this.getAttribute("data-id");

            if (id) {
                window.location.href = "bookingDetailManager.html?id=" + id;
            }
        });
    });
});