// controllers/userController.js

const prisma = require('../lib/prisma');


// 1. Fungsi untuk mendapatkan semua user
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// 2. Fungsi untuk mendapatkan user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// 3. Fungsi untuk membuat user baru
const createUser = async (req, res) => {
  // Ambil data dari body request
  const { email, username, password, phone, gender, dob, address } = req.body; // <-- dob ditambahkan

  try {
    const newUser = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: password, // Ingat: password harus di-hash di aplikasi nyata!
        phone: phone,
        gender: gender,
        dob: new Date(dob), // <-- dob ditambahkan (diubah jadi objek Date)
        address: address,
      },
    });
    res.status(201).json({ msg: 'User berhasil dibuat', data: newUser });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// 4. Fungsi untuk mengupdate user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, username, password, phone, gender, dob, address } = req.body; // <-- dob dan phone ditambahkan
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        email: email,
        username: username,
        password: password, // Ingat: password harus di-hash di aplikasi nyata!
        phone: phone,
        gender: gender,
        dob: dob ? new Date(dob) : undefined, // <-- dob ditambahkan
        address: address,
      },
    });
    res.status(200).json({ msg: 'User berhasil diupdate', data: user });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// 5. Fungsi untuk menghapus user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ msg: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ msg: 'User tidak ditemukan atau error lainnya', error: error.message });
  }
};


// Export semua fungsi agar bisa digunakan di routes
module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  updateUser,
};