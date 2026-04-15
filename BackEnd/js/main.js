document.addEventListener("DOMContentLoaded", () => {
    const images = [
        "../../data/img/img-header2/hoi-an.pg.webp",
        "../../data/img/img-header2/Ha-Long.jpg",
        "../../data/img/img-header2/nghe-an.webp",
        "../../data/img/img-header2/thanh-pho-ho-chi-minh.jpg",
        "../../data/img/img-header2/phu-Yen.webp",
        "../../data/img/img-header2/sing-ga-po.jpg",
         "../../data/img/img-header2/uc.jpg",
    ];

    let index = 0;
    const header = document.querySelector(".header2");

    setInterval(() => {
        index = (index + 1) % images.length;
        header.style.backgroundImage = `url(${images[index]})`;
    }, 3000);
});