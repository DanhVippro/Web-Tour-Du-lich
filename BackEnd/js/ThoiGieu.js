
const bgImages = [
    "../../data/img/giới thiệu/1.jpg", "../../data/img/giới thiệu/2.jpg",
    "../../data/img/giới thiệu/3.jpg", "../../data/img/giới thiệu/4.jpg",
    "../../data/img/giới thiệu/5.jpg", "../../data/img/giới thiệu/6.jpg",
    "../../data/img/giới thiệu/7.jpg", "../../data/img/giới thiệu/8.jpg",
    "../../data/img/giới thiệu/9.jpg", "../../data/img/giới thiệu/10.jpg",
];
bgImages.forEach(src => { const i = new Image(); i.src = src; });
let bgIdx = 0, bgCur = 0;
const bg1 = document.querySelector(".bg1");
const bg2 = document.querySelector(".bg2");
bg1.style.backgroundImage = `url('${bgImages[0]}')`;
bg1.style.opacity = "1"; bg2.style.opacity = "0";
function changeBackground() {
    bgIdx = (bgIdx + 1) % bgImages.length;
    if (bgCur === 0) {
        bg2.style.backgroundImage = `url('${bgImages[bgIdx]}')`;
        bg2.style.opacity = "1"; bg1.style.opacity = "0"; bgCur = 1;
    } else {
        bg1.style.backgroundImage = `url('${bgImages[bgIdx]}')`;
        bg1.style.opacity = "1"; bg2.style.opacity = "0"; bgCur = 0;
    }
}
setInterval(changeBackground, 5000);
//////////
const members = [
    {
        name: "Trần Thành Danh", initials: "TD", color: "#4a90d9",
        img: "../../data/img/giới thiệu/Danh.jpg",
        imgBig: "../../data/img/giới thiệu/Danh.jpg",
        imgStyle: "width:200px; margin-top:0px; position: relative; top:10px;  ",
        mssv: "24676291", dob: "05-04-2006", home: "Quảng Ngãi",
        edu: "Đại học Công Nghiệp TP.HCM (IUH)", desc: '"Đẹp trai nhất vũ trụ"'
    },

    {
        name: "Trần Quốc Tây", initials: "QT", color: "#e87040",
        img: "../../data/img/giới thiệu/qTay.png",
        imgBig: "../../data/img/giới thiệu/qTay.png",
        imgStyle: "width:220px; margin-top:0px;",
        mssv: "24660371", dob: "08-06-2005", home: "Phú Yên",
        edu: "Đại học Công Nghiệp TP.HCM (IUH)", desc: '"Có hết tất cả những gì các bạn có"'
    },

    {
        name: "Trương Chánh Tân", initials: "CT", color: "#5cb85c",
        img: "../../data/img/giới thiệu/Chánh Tân.jpeg",
        imgBig: "../../data/img/giới thiệu/Chánh Tân.jpeg",
        imgStyle: "width:200px; margin-top:0px;",
        mssv: "24685301", dob: "07-10-2005", home: "Đồng Tháp",
        edu: "Đại học Công Nghiệp TP.HCM (IUH)", desc: '"Tốt bụng, hài hước, yêu cái đẹp"'
    },

    {
        name: "Phan Nhựt Tân", initials: "NT", color: "#9b59b6",
        img: "../../data/img/giới thiệu/Nhựt Tân.jpg",
        imgBig: "../../data/img/giới thiệu/Nhựt Tân.jpg",
        imgStyle: "width:200px; margin-top:0px;",
        mssv: "24661761", dob: "13-10-2006", home: "Long An",
        edu: "Đại học Công Nghiệp TP.HCM (IUH)", desc: '"Thành viên bí ẩn của nhóm"'
    },

    {
        name: "Nguyễn Duy Minh", initials: "DM", color: "#e74c8b",
        img: "../../data/img/giới thiệu/minh.jpg",
        imgBig: "../../data/img/giới thiệu/minh.jpg",
        imgStyle: "width:200px; margin-top:0px;",
        mssv: "24685971", dob: "15-09-2006", home: "Gia Lai",
        edu: "Đại học Công Nghiệp TP.HCM (IUH)", desc: '"Đẹp trai, tốt bụng"'
    },
];


const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('wheelSvg');
const N = members.length;

const CX = 20;
const CY = 290;
const R = 220;
const ACTIVE_DEG = 0;
const SPREAD = 150;
const STEP = SPREAD / (N - 1);

// ── Giới hạn cuộn ──
const ROT_MIN = -(SPREAD / 2);
const ROT_MAX = (SPREAD / 2);

let rotation = 0;
let targetRot = 0;
let animId = null;
let activeIdx = -1;

function clamp(v) { return Math.max(ROT_MIN, Math.min(ROT_MAX, v)); }
function baseAngleDeg(i) { return ACTIVE_DEG + (i - (N - 1) / 2) * STEP; }
function currentAngleDeg(i) { return baseAngleDeg(i) + rotation; }

function buildStatic() {
    // Cung tròn nền
    const a0 = (ACTIVE_DEG - SPREAD / 2) * Math.PI / 180;
    const a1 = (ACTIVE_DEG + SPREAD / 2) * Math.PI / 180;
    const x0 = CX + R * Math.cos(a0), y0 = CY + R * Math.sin(a0);
    const x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
    const arc = document.createElementNS(NS, 'path');
    arc.setAttribute('d', `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    arc.setAttribute('stroke-width', '2');
    arc.setAttribute('stroke-dasharray', '5 5');
    svg.appendChild(arc);

    // Trục ngang mờ
    const ax = document.createElementNS(NS, 'line');
    ax.setAttribute('x1', CX); ax.setAttribute('y1', CY - R - 20);
    ax.setAttribute('x2', CX); ax.setAttribute('y2', CY + R + 20);
    ax.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    ax.setAttribute('stroke-width', '1');
    svg.appendChild(ax);

    // Pivot dot
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', CX); dot.setAttribute('cy', CY); dot.setAttribute('r', '8');
    dot.setAttribute('fill', '#7eb8ff');
    svg.appendChild(dot);

    // Đường ngang từ pivot sang phải
    const ln = document.createElementNS(NS, 'line');
    ln.setAttribute('x1', CX + 10); ln.setAttribute('y1', CY);
    ln.setAttribute('x2', CX + 55); ln.setAttribute('y2', CY);
    ln.setAttribute('stroke', '#7eb8ff'); ln.setAttribute('stroke-width', '2');
    ln.setAttribute('opacity', '0.5');
    svg.appendChild(ln);

    // Mũi tên tam giác chỉ sang PHẢI
    const tri = document.createElementNS(NS, 'polygon');
    tri.setAttribute('points', `${CX + 52},${CY - 11} ${CX + 86},${CY} ${CX + 52},${CY + 11}`);
    tri.setAttribute('fill', '#7eb8ff');
    tri.setAttribute('opacity', '0.85');
    svg.appendChild(tri);

    // Group avatar (luôn ở trên cùng)
    const ag = document.createElementNS(NS, 'g');
    ag.id = 'avatarGroup';
    svg.appendChild(ag);
}

function renderAvatars() {
    const grp = document.getElementById('avatarGroup');
    grp.innerHTML = '';

    members.forEach((m, i) => {
        const angleDeg = currentAngleDeg(i);
        const angleRad = angleDeg * Math.PI / 180;
        const ax = CX + R * Math.cos(angleRad);
        const ay = CY + R * Math.sin(angleRad);

        // Tính khoảng cách tới góc 0° (điểm active)
        const norm = ((angleDeg % 360) + 360) % 360;
        const dist = Math.min(Math.abs(norm - 0), Math.abs(norm - 360), 360 - Math.abs(norm - 0));
        const dFromZero = Math.min(Math.abs(norm), 360 - Math.abs(norm));
        const isActive = dFromZero < 15;
        const cr = isActive ? 42 : 28;

        const g = document.createElementNS(NS, 'g');
        g.setAttribute('transform', `translate(${ax.toFixed(1)},${ay.toFixed(1)})`);
        g.style.cursor = 'pointer';

        // Vầng sáng khi active
        if (isActive) {
            const glow = document.createElementNS(NS, 'circle');
            glow.setAttribute('r', cr + 9);
            glow.setAttribute('fill', 'none');
            glow.setAttribute('stroke', 'rgba(126,184,255,0.3)');
            glow.setAttribute('stroke-width', '8');
            g.appendChild(glow);
        }

        // Clip path
        const clipId = `cp${i}_${Date.now()}`;
        const defs = document.createElementNS(NS, 'defs');
        const clip = document.createElementNS(NS, 'clipPath');
        clip.setAttribute('id', clipId);
        const cc = document.createElementNS(NS, 'circle');
        cc.setAttribute('r', cr);
        clip.appendChild(cc); defs.appendChild(clip); g.appendChild(defs);

        // Nền màu avatar
        const bgc = document.createElementNS(NS, 'circle');
        bgc.setAttribute('r', cr);
        bgc.setAttribute('fill', m.color);
        bgc.setAttribute('stroke', isActive ? '#fff' : 'rgba(255,255,255,0.3)');
        bgc.setAttribute('stroke-width', isActive ? '3' : '1.5');
        g.appendChild(bgc);

        // Ảnh thành viên (SVG thuần, không cần thư viện)
        const img = document.createElementNS(NS, 'image');
        img.setAttribute('href', m.img);
        img.setAttribute('x', -cr); img.setAttribute('y', -cr);
        img.setAttribute('width', cr * 2); img.setAttribute('height', cr * 2);
        img.setAttribute('clip-path', `url(#${clipId})`);
        img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        g.appendChild(img);

        // Chữ tắt fallback (ẩn, hiện khi ảnh lỗi)
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'central');
        txt.setAttribute('fill', 'rgba(255,255,255,0)');
        txt.setAttribute('font-size', isActive ? '15' : '11');
        txt.setAttribute('font-weight', '700');
        txt.setAttribute('font-family', 'sans-serif');
        txt.textContent = m.initials;
        img.addEventListener('error', () => {
            img.style.display = 'none';
            txt.setAttribute('fill', '#fff');
        });
        g.appendChild(txt);

        g.addEventListener('click', () => snapTo(i));
        grp.appendChild(g);
    });
}

function closestToActive() {
    let best = -1, bestD = Infinity;
    members.forEach((_, i) => {
        const norm = ((currentAngleDeg(i) % 360) + 360) % 360;
        const d = Math.min(Math.abs(norm), 360 - Math.abs(norm));
        if (d < bestD) { bestD = d; best = i; }
    });
    return best;
}

function showInfo(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;
    const m = members[idx];
    const card = document.getElementById('infoCard');
    const ph = document.getElementById('placeholder');
    ph.style.display = 'none';
    card.classList.remove('show');
    card.style.display = 'none';

    // Ẩn ảnh lớn trước khi chuyển thành viên
    const wrap = document.getElementById('memberImgWrap');
    const bigImg = document.getElementById('memberImgBig');
    wrap.style.display = 'none';

    setTimeout(() => {
        document.getElementById('cName').textContent = m.name;
        document.getElementById('cMssv').textContent = m.mssv;
        document.getElementById('cDob').textContent = m.dob;
        document.getElementById('cHome').textContent = m.home;
        document.getElementById('cEdu').textContent = m.edu;
        document.getElementById('cDesc').textContent = m.desc;

        const avatarEl = document.getElementById('avatarEl');
        avatarEl.innerHTML = '';

        // Hiển thị ảnh lớn
        if (m.imgBig) {
            bigImg.src = m.imgBig;
            bigImg.style.cssText = (m.imgStyle || 'width:200px;') +
                ' object-fit:contain;' +
                ' filter:drop-shadow(0 0 18px rgba(126,184,255,0.4));';
            wrap.style.display = 'block';
        } else {
            wrap.style.display = 'none';
        }

        card.style.display = 'block';
        requestAnimationFrame(() => {
            card.classList.add('show');
            document.querySelector('.wheel-layout').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        });
    }, 80);
}

function snapTo(i) {
    const norm = ((currentAngleDeg(i) % 360) + 360) % 360;
    const diff = norm > 180 ? norm - 360 : norm; // khoảng cách tới 0°
    targetRot = clamp(targetRot - diff);
    animate();
}

function animate() {
    if (animId) cancelAnimationFrame(animId);
    function step() {
        const diff = targetRot - rotation;
        if (Math.abs(diff) < 0.18) {
            rotation = targetRot;
            renderAvatars();
            const idx = closestToActive();
            if (idx >= 0) showInfo(idx);
            return;
        }
        rotation += diff * 0.13;
        renderAvatars();
        const idx = closestToActive();
        if (idx >= 0) showInfo(idx);
        animId = requestAnimationFrame(step);
    }
    step();
}

// ── Init ──
buildStatic();
renderAvatars();

// ── Scroll (có giới hạn) ──
const sec = document.querySelector('.wheel-layout');
sec.addEventListener('wheel', e => {
    const atMin = targetRot <= ROT_MIN;
    const atMax = targetRot >= ROT_MAX;
    const scrollingDown = e.deltaY > 0;
    const scrollingUp = e.deltaY < 0;

    // Nếu đã ở giới hạn, cho phép cuộn trang bình thường
    if ((scrollingDown && atMin) || (scrollingUp && atMax)) {
        return; // KHÔNG gọi preventDefault → trang cuộn bình thường
    }

    e.preventDefault();
    targetRot = clamp(targetRot + (scrollingDown ? -13 : 13));
    animate();
}, { passive: false });

// ── Touch ──
let ty0 = null;
sec.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive: true });
sec.addEventListener('touchmove', e => {
    if (ty0 === null) return;
    const dy = e.touches[0].clientY - ty0;
    targetRot = clamp(targetRot + dy * 0.55);
    ty0 = e.touches[0].clientY;
    animate();
}, { passive: true });

// ── Tự động phát nhạc sau lần tương tác đầu tiên ──
const bgMusic = document.getElementById('bgMusic');
let musicStarted = false;

function startMusic() {
    if (musicStarted) return;
    bgMusic.volume = 0.6;
    bgMusic.play().then(() => {
        musicStarted = true;
    }).catch(() => { });
}

// Bắt nhiều loại tương tác để chắc chắn phát được
document.addEventListener('click', startMusic, { once: true });
document.addEventListener('scroll', startMusic, { once: true });
document.addEventListener('wheel', startMusic, { once: true });
document.addEventListener('keydown', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

