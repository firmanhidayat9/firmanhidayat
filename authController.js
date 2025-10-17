const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// =============================
// REGISTER USER
// =============================
exports.register = async (req, res) => {
  try {
    const { email, username, phone, password, gender, dob, address } = req.body;

    // Validasi input
    if (!email || !username || !password) {
      return res.status(400).json({ msg: 'Email, username, dan password wajib diisi' });
    }

    // Cek apakah email atau username sudah ada
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return res.status(400).json({ msg: 'Email atau username sudah terdaftar' });
    }

    // Enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        phone,
        password: hashedPassword,
        gender,
        dob: dob ? new Date(dob) : null,
        address,
      },
    });

    res.status(201).json({
      msg: 'Registrasi berhasil',
      user: newUser,
    });
  } catch (error) {
    console.error('Error detail:', error);
    res.status(500).json({ msg: 'Terjadi kesalahan server' });
  }
};

// =============================
// LOGIN USER
// =============================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: 'Username dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Password salah' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({ msg: 'Login berhasil', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Terjadi kesalahan server' });
  }
};

// =============================
// GET PROFILE
// =============================
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ msg: 'Terjadi kesalahan server' });
  }
};
