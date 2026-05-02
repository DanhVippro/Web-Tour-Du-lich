const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Đọc database
let db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

// Hàm lưu database
function saveDB() {
    fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
}

// ==================== TOUR APIs ====================
// Lấy tất cả tour
app.get('/api/tours', (req, res) => {
    res.json(db.tours);
});

// Lấy tour theo id
app.get('/api/tours/:id', (req, res) => {
    const tour = db.tours.find(t => t.id === req.params.id);
    if (tour) {
        res.json(tour);
    } else {
        res.status(404).json({ error: 'Tour not found' });
    }
});

// Lấy tour theo địa điểm
app.get('/api/tours/destination/:name', (req, res) => {
    const tours = db.tours.filter(t =>
        t.destination.toLowerCase().includes(req.params.name.toLowerCase())
    );
    res.json(tours);
});

// Lấy tour theo danh mục (trong nước/nước ngoài)
app.get('/api/tours/category/:category', (req, res) => {
    const destinations = db.destinations.filter(d => d.category === req.params.category);
    const destinationNames = destinations.map(d => d.name);
    const tours = db.tours.filter(t => destinationNames.includes(t.destination));
    res.json(tours);
});

// Tìm kiếm tour
app.get('/api/tours/search/:keyword', (req, res) => {
    const keyword = req.params.keyword.toLowerCase();
    const tours = db.tours.filter(t =>
        t.name.toLowerCase().includes(keyword) ||
        t.destination.toLowerCase().includes(keyword) ||
        t.location.toLowerCase().includes(keyword)
    );
    res.json(tours);
});
// cac tinh năng của manager
// Thêm tour mới
app.post('/api/tours', (req, res) => {
    const newTour = { ...req.body };
    db.tours.push(newTour);
    saveDB();
    res.status(201).json(newTour);
});

// Cập nhật tour
app.put('/api/tours/:id', (req, res) => {
    const index = db.tours.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        db.tours[index] = { ...db.tours[index], ...req.body };
        saveDB();
        res.json(db.tours[index]);
    } else {
        res.status(404).json({ error: 'Tour not found' });
    }
});

// Xóa tour
app.delete('/api/tours/:id', (req, res) => {
    const index = db.tours.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        db.tours.splice(index, 1);
        saveDB();
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Tour not found' });
    }
});

// ==================== BOOKING APIs ====================
// Lấy tất cả booking
app.get('/api/bookings', (req, res) => {
    res.json(db.bookings);
});

// Lấy booking theo ID
app.get('/api/bookings/:id', (req, res) => {
    const booking = db.bookings.find(b => b.id === req.params.id);
    if (booking) {
        res.json(booking);
    } else {
        res.status(404).json({ error: 'Booking not found' });
    }
});

// Tạo booking mới
app.post('/api/bookings', (req, res) => {
    const newBooking = {
        id: `BK${String(db.bookings.length + 1).padStart(3, '0')}`,
        ...req.body,
        bookingDate: new Date().toISOString().split('T')[0],
        status: 'pending'
    };

    db.bookings.push(newBooking);

    // Cập nhật số lượng đặt chỗ của tour
    const tour = db.tours.find(t => t.id === newBooking.tourId);
    if (tour) {
        tour.currentBookings += newBooking.adultTickets + newBooking.childTickets;
        if (tour.currentBookings >= tour.maxCapacity) {
            tour.status = 'full';
        }
    }

    saveDB();
    res.status(201).json(newBooking);
});

// Cập nhật booking
app.put('/api/bookings/:id', (req, res) => {
    const index = db.bookings.findIndex(b => b.id === req.params.id);
    if (index !== -1) {
        db.bookings[index] = { ...db.bookings[index], ...req.body };
        saveDB();
        res.json(db.bookings[index]);
    } else {
        res.status(404).json({ error: 'Booking not found' });
    }
});

// Hủy booking
app.delete('/api/bookings/:id', (req, res) => {
    const index = db.bookings.findIndex(b => b.id === req.params.id);
    if (index !== -1) {
        db.bookings.splice(index, 1);
        saveDB();
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Booking not found' });
    }
});

// ==================== USER APIs ====================
// Lấy tất cả user
app.get('/api/users', (req, res) => {
    const users = db.users.map(u => {
        const { password, ...userWithoutPass } = u;
        return userWithoutPass;
    });
    res.json(users);
});

// Đăng ký
app.post('/api/register', (req, res) => {
    const { fullname, email, phone, password, gender, birthday } = req.body;

    const existingUser = db.users.find(u => u.email === email || u.phone === phone);
    if (existingUser) {
        return res.status(400).json({ error: 'Email hoặc số điện thoại đã tồn tại' });
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
        (u.email === username || u.phone === username) && u.password === password
    );

    if (user) {
        const { password: _, ...userWithoutPass } = user;
        res.json({ success: true, user: userWithoutPass });
    } else {
        res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }
});

// Cập nhật user
app.put('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = db.users.findIndex(u => u.id === id);

    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...req.body };
        saveDB();
        const { password, ...userWithoutPass } = db.users[index];
        res.json(userWithoutPass);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// ==================== DESTINATION APIs ====================
app.get('/api/destinations', (req, res) => {
    res.json(db.destinations);
});

app.get('/api/destinations/category/:category', (req, res) => {
    const destinations = db.destinations.filter(d => d.category === req.params.category);
    res.json(destinations);
});

// ==================== STATISTICS APIs (for admin) ====================
app.get('/api/statistics', (req, res) => {
    const totalTours = db.tours.length;
    const openTours = db.tours.filter(t => t.status === 'open').length;
    const fullTours = db.tours.filter(t => t.status === 'full').length;
    const canceledTours = db.tours.filter(t => t.status === 'cancel').length;

    const totalBookings = db.bookings.length;
    const totalRevenue = db.bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    res.json({
        totalTours,
        openTours,
        fullTours,
        canceledTours,
        totalBookings,
        totalRevenue
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📋 API List:`);
    console.log(`   - GET  /api/tours`);
    console.log(`   - GET  /api/tours/:id`);
    console.log(`   - GET  /api/tours/search/:keyword`);
    console.log(`   - POST /api/bookings`);
    console.log(`   - POST /api/login`);
    console.log(`   - POST /api/register`);
});

