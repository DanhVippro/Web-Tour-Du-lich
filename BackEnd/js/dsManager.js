/*calendar */
{let cur = new Date();

function render() {
  const y = cur.getFullYear(), m = cur.getMonth();
  document.getElementById('monthYear').textContent =
    `Tháng ${m + 1} ${y}`;

  const grid = document.getElementById('calGrid');
  grid.querySelectorAll('.date-cell').forEach(e => e.remove());

  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    grid.insertAdjacentHTML('beforeend', '<div class="date-cell"></div>');
  }
  for (let d = 1; d <= totalDays; d++) {
    const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    grid.insertAdjacentHTML('beforeend',
      `<div class="date-cell${isToday ? ' today' : ''}">${d}</div>`);
  }
}

function prevMonth() { cur.setMonth(cur.getMonth() - 1); render(); }
function nextMonth() { cur.setMonth(cur.getMonth() + 1); render(); }
render();
}
/*booking-card */
{
document.querySelectorAll(".booking-card").forEach(card => {
    card.addEventListener("click", function () {
        const id = this.getAttribute("data-id");

        // chuyển trang
        window.location.href = "bookingDetailManager.html?id=" + id;
    });
});
}