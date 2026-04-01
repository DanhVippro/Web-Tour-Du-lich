const images = ["../../data/img/giới thiệu/pexels-dqnguyen15-19578157.jpg",
  "../../data/img/giới thiệu/pexels-maxed-raw-527582413-27421515.jpg",
  "../../data/img/giới thiệu/pexels-nhavan-35151125.jpg",
  "../../data/img/giới thiệu/pexels-qui-nguyen-7862521-32303442.jpg",
  "../../data/img/giới thiệu/pexels-zsuzsa-zsuzsa-127738300-31387030.jpg"
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
