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
    let activeLayer = 1;

    const layer1 = document.querySelector(".layer1");
    const layer2 = document.querySelector(".layer2");

    layer1.style.backgroundImage = `url(${images[0]})`;

    setInterval(() => {
        index = (index + 1) % images.length;

        if (activeLayer === 1) {
            layer2.style.backgroundImage = `url(${images[index]})`;
            layer2.style.opacity = 1;
            layer1.style.opacity = 0;
            activeLayer = 2;
        } else {
            layer1.style.backgroundImage = `url(${images[index]})`;
            layer1.style.opacity = 1;
            layer2.style.opacity = 0;
            activeLayer = 1;
        }
    }, 3000);
});