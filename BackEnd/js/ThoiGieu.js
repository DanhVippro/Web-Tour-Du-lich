
const images = [
  "../../data/img/giới thiệu/1.jpg",
  "../../data/img/giới thiệu/2.jpg",
  "../../data/img/giới thiệu/3.jpg",
  "../../data/img/giới thiệu/4.jpg",
  "../../data/img/giới thiệu/5.jpg",
  "../../data/img/giới thiệu/6.jpg",
  "../../data/img/giới thiệu/7.jpg",
  "../../data/img/giới thiệu/8.jpg",
  "../../data/img/giới thiệu/9.jpg",
  "../../data/img/giới thiệu/10.jpg",
];

images.forEach(src => {
  const img = new Image();
  img.src = src;
});

let index = 0;
let current = 0;
const bg1 = document.querySelector(".bg1");
const bg2 = document.querySelector(".bg2");

bg1.style.backgroundImage = `url('${images[0]}')`;
bg1.style.opacity = "1";
bg2.style.opacity = "0";

function preloadNext() {
  const nextIndex = (index + 1) % images.length;
  const img = new Image();
  img.src = images[nextIndex];
}

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

  preloadNext(); 
}

setInterval(changeBackground, 5000);
