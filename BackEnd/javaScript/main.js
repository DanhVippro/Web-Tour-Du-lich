document.addEventListener("DOMContentLoaded", () => {
    const images = [
        "../../data/img/hoi-an.pg.webp",
        "../../data/img/Ha-Long.jpg",
        "../../data/img/nghe-an.webp",
        "../../data/img/thanh-pho-ho-chi-minh.jpg",
        "../../data/img/phu-Yen.webp"
        
    ];

    let index = 0;
    const header = document.querySelector(".header2");

    setInterval(() => {
        index = (index + 1) % images.length;
        header.style.backgroundImage = `url(${images[index]})`;
    }, 3000);
});