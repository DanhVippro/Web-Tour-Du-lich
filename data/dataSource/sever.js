const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

// ==================== DATABASE ====================
const DB_PATH = path.join(__dirname, 'db.json');

let db = JSON.parse(
    fs.readFileSync(DB_PATH, 'utf8')
);

function saveDB() {
    fs.writeFileSync(
        DB_PATH,
        JSON.stringify(db, null, 2)
    );
}

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== STATIC IMG ====================
app.use('/data/img', express.static(path.join(__dirname, '../img')));

// ==================== MULTER UPLOAD ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../img');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(
            null,
            uniqueSuffix + path.extname(file.originalname)
        );
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;

        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }

        cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
});

// ==================== UPLOAD API ====================
app.post('/api/upload', upload.single('image'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            error: 'Không có file nào được upload'
        });
    }

    const imageUrl = `/data/img/${req.file.filename}`;

    res.json({
        url: imageUrl
    });
});

// ==================== USER APIs ====================

// Lấy tất cả user (không trả password)
app.get('/api/users', (req, res) => {

    const users = db.users.map(user => {

        const { password, ...userWithoutPass } = user;

        return userWithoutPass;
    });

    res.json(users);
});

// Lấy tất cả user cho admin
app.get('/api/users/admin', (req, res) => {
    res.json(db.users);
});

// Đăng ký
app.post('/api/register', (req, res) => {

    const {
        fullname,
        email,
        phone,
        password,
        gender,
        birthday
    } = req.body;

    const existingUser = db.users.find(user =>
        user.email === email ||
        user.phone === phone
    );

    if (existingUser) {
        return res.status(400).json({
            error: 'Email hoặc số điện thoại đã tồn tại'
        });
    }

    const newUser = {
        id: db.users.length + 1,
        fullname,
        email,
        phone,
        password,
        gender,
        birthday,
        role: 'user'
    };

    db.users.push(newUser);

    saveDB();

    const { password: _, ...userWithoutPass } = newUser;

    res.status(201).json(userWithoutPass);
});

// Đăng nhập
app.post('/api/login', (req, res) => {

    const { username, password } = req.body;

    const user = db.users.find(u =>
        (u.email === username || u.phone === username)
        && u.password === password
    );

    if (!user) {
        return res.status(401).json({
            error: 'Sai tài khoản hoặc mật khẩu'
        });
    }

    const { password: _, ...userWithoutPass } = user;

    res.json({
        success: true,
        user: userWithoutPass
    });
});

// Cập nhật user
app.put('/api/users/:id', (req, res) => {

    const id = parseInt(req.params.id);

    const index = db.users.findIndex(
        user => user.id === id
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    db.users[index] = {
        ...db.users[index],
        ...req.body
    };

    saveDB();

    const { password, ...userWithoutPass } = db.users[index];

    res.json(userWithoutPass);
});

// Xóa user
app.delete('/api/users/:id', (req, res) => {

    const id = parseInt(req.params.id);

    const index = db.users.findIndex(
        user => user.id === id
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    if (db.users[index].role === 'admin') {
        return res.status(403).json({
            error: 'Không thể xóa tài khoản admin'
        });
    }

    db.users.splice(index, 1);

    saveDB();

    res.status(204).send();
});

// ==================== TOUR APIs ====================

// Lấy tất cả tour
app.get('/api/tours', (req, res) => {
    res.json(db.tours);
});

// Tìm kiếm tour  ← phải đặt TRƯỚC /:id
app.get('/api/tours/search/:keyword', (req, res) => {

    const keyword = req.params.keyword.toLowerCase();

    const tours = db.tours.filter(tour =>
        (tour.name || "").toLowerCase().includes(keyword) ||
        (tour.destination || "").toLowerCase().includes(keyword) ||
        (tour.location || "").toLowerCase().includes(keyword) ||
        (tour.route || "").toLowerCase().includes(keyword)
    );

    res.json(tours);
});

// Tìm tour theo địa điểm  ← phải đặt TRƯỚC /:id
app.get('/api/tours/destination/:name', (req, res) => {

    const tours = db.tours.filter(tour =>
        (tour.destination || "")
            .toLowerCase()
            .includes(req.params.name.toLowerCase())
    );

    res.json(tours);
});

// Lấy tour theo id  ← đặt SAU các route cụ thể
app.get('/api/tours/:id', (req, res) => {

    const tour = db.tours.find(
        t => t.id === req.params.id
    );

    if (!tour) {
        return res.status(404).json({
            error: 'Tour not found'
        });
    }

    res.json(tour);
});

// Lấy tour theo category  ← phải đặt TRƯỚC /:id
app.get('/api/tours/category/:category', (req, res) => {

    const destinations = db.destinations.filter(
        d => d.category === req.params.category
    );

    const destinationNames = destinations.map(
        d => d.name
    );

    const tours = db.tours.filter(
        t => destinationNames.includes(t.destination)
    );

    res.json(tours);
});

// Thêm tour
app.post('/api/tours', (req, res) => {

    const newTour = {
        ...req.body
    };

    db.tours.push(newTour);

    saveDB();

    res.status(201).json(newTour);
});

// Cập nhật tour
app.put('/api/tours/:id', (req, res) => {

    const index = db.tours.findIndex(
        t => t.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'Tour not found'
        });
    }

    db.tours[index] = {
        ...db.tours[index],
        ...req.body
    };

    saveDB();

    res.json(db.tours[index]);
});

// Xóa tour
app.delete('/api/tours/:id', (req, res) => {

    const index = db.tours.findIndex(
        t => t.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'Tour not found'
        });
    }

    db.tours.splice(index, 1);

    saveDB();

    res.status(204).send();
});

// ==================== BOOKING APIs ====================

// Lấy tất cả booking
app.get('/api/bookings', (req, res) => {
    res.json(db.bookings);
});

// Lấy booking theo id
app.get('/api/bookings/:id', (req, res) => {

    const booking = db.bookings.find(
        b => b.id === req.params.id
    );

    if (!booking) {
        return res.status(404).json({
            error: 'Booking not found'
        });
    }

    res.json(booking);
});

// Tạo booking
app.post('/api/bookings', (req, res) => {

    const newBooking = {
        id: `BK${String(db.bookings.length + 1).padStart(3, '0')}`,
        ...req.body,
        bookingDate: new Date().toISOString().split('T')[0],
        status: 'pending'
    };

    db.bookings.push(newBooking);

    // cập nhật số người đã đặt
    const tour = db.tours.find(
        t => t.id === newBooking.tourId
    );

    if (tour) {

        tour.currentBookings +=
            newBooking.adultTickets +
            newBooking.childTickets;

        if (tour.currentBookings >= tour.maxCapacity) {
            tour.status = 'full';
        }
    }

    saveDB();

    res.status(201).json(newBooking);
});

// Cập nhật booking
app.put('/api/bookings/:id', (req, res) => {

    const index = db.bookings.findIndex(
        b => b.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'Booking not found'
        });
    }

    db.bookings[index] = {
        ...db.bookings[index],
        ...req.body
    };

    saveDB();

    res.json(db.bookings[index]);
});

// Xóa booking
app.delete('/api/bookings/:id', (req, res) => {

    const index = db.bookings.findIndex(
        b => b.id === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            error: 'Booking not found'
        });
    }

    db.bookings.splice(index, 1);

    saveDB();

    res.status(204).send();
});

// ==================== DESTINATION APIs ====================

// Lấy tất cả destination
app.get('/api/destinations', (req, res) => {
    res.json(db.destinations);
});

// Lấy destination theo category
app.get('/api/destinations/category/:category', (req, res) => {

    const destinations = db.destinations.filter(
        d => d.category === req.params.category
    );

    res.json(destinations);
});

// ==================== STATISTICS APIs ====================

app.get('/api/statistics', (req, res) => {

    const totalTours = db.tours.length;

    const openTours = db.tours.filter(
        t => t.status === 'open'
    ).length;

    const fullTours = db.tours.filter(
        t => t.status === 'full'
    ).length;

    const canceledTours = db.tours.filter(
        t => t.status === 'cancel'
    ).length;

    const totalBookings = db.bookings.length;

    const totalRevenue = db.bookings.reduce(
        (sum, booking) => sum + booking.totalPrice,
        0
    );

    res.json({
        totalTours,
        openTours,
        fullTours,
        canceledTours,
        totalBookings,
        totalRevenue
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {

    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);

    console.log(`📋 API List:`);
    console.log(`   - GET    /api/tours`);
    console.log(`   - GET    /api/tours/:id`);
    console.log(`   - GET    /api/tours/search/:keyword`);
    console.log(`   - POST   /api/bookings`);
    console.log(`   - POST   /api/login`);
    console.log(`   - POST   /api/register`);
    console.log(`   - POST   /api/upload`);
});