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
let current = 0; 
const bg1 = document.querySelector(".bg1");
const bg2 = document.querySelector(".bg2");


bg1.style.backgroundImage = `url('${images[0]}')`;
bg1.style.opacity = "1";
bg2.style.opacity = "0";

function changeBackground() {
  index = (index + 1) % images.length;

  if (current === 0) {
    bg2.style.backgroundImage = `url('${images[index]}')`;
    bg2.style.opacity = "1"; 
    bg1.style.opacity = "0";
    current = 1;
  } else {
    bg1.style.backgroundImage = `url('${images[index]}')`;
    bg1.style.opacity = "1";
    bg2.style.opacity = "0";
    current = 0;
  }
}

setInterval(changeBackground, 5000);