const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/hitgub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB bağlantı hatası:'));
db.once('open', () => {
  console.log('MongoDB veritabanına başarıyla bağlandı');
});

// Kullanıcı şeması
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Kod şeması
const codeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  username: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Code = mongoose.model('Code', codeSchema);

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware - JWT token doğrulama
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token gerekli' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Giriş sayfası
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Kullanıcı kayıt
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Şifre hash'leme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluşturma
    const user = new User({
      username,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Kullanıcı girişi
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanıcı kontrolü
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Şifre kontrolü
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Geçersiz şifre' });
    }

    // JWT token oluşturma
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Kod ekleme
app.post('/api/codes', authenticateToken, async (req, res) => {
  try {
    const { title, code } = req.body;
    const username = req.user.username;

    const newCode = new Code({
      title,
      code,
      username
    });

    await newCode.save();
    res.status(201).json(newCode);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Tüm kodları getirme
app.get('/api/codes', async (req, res) => {
  try {
    const codes = await Code.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Kullanıcının kendi kodunu silme
app.delete('/api/codes/:id', authenticateToken, async (req, res) => {
  try {
    const code = await Code.findById(req.params.id);
    
    if (!code) {
      return res.status(404).json({ message: 'Kod bulunamadı' });
    }

    // Sadece kod sahibi silebilir
    if (code.username !== req.user.username) {
      return res.status(403).json({ message: 'Bu kodu silme yetkiniz yok' });
    }

    await Code.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kod başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
