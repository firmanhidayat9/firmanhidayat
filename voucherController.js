// controllers/voucherController.js

const prisma = require('../lib/prisma');


/**
 * @desc    Membuat voucher baru
 * @route   POST /api/vouchers
 * @access  Private (Admin)
 */
const createVoucher = async (req, res) => {
  // DIUBAH: expired_time menjadi expired_time agar cocok dengan body
const { name, code, expired_time, quantity_used, quantity_max } = req.body;

  // DIUBAH: Validasi juga menggunakan expired_time
  if (!name || !code || !expired_time || quantity_max === undefined) {
    return res.status(400).json({ msg: 'Name, code, expired_time, and quantity_max are required' });
  }

  try {
    const newVoucher = await prisma.voucher.create({
      data: {
        name: name,
        code: code.toUpperCase(),
        // DIUBAH: Menggunakan variabel expired_time yang sudah benar
        expired_time: new Date(expired_time),
        quantity_used: quantity_used || 0,
        quantity_max: parseInt(quantity_max),
      },
    });
    res.status(201).json({ msg: 'Voucher created successfully', data: newVoucher });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ msg: 'Voucher code already exists' });
    }
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mendapatkan semua voucher
 * @route   GET /api/vouchers
 * @access  Private (Admin)
 */
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await prisma.voucher.findMany({
    //   orderBy: {
    //     created_at: 'desc', // <-- DIUBAH DARI createdAt
    //   },
    });
    res.status(200).json(vouchers);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Memvalidasi kode voucher
 * @route   POST /api/vouchers/validate
 * @access  Public/Private (untuk Buyer)
 */
const validateVoucher = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ msg: 'Voucher code is required' });
  }

  try {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    // 1. Cek apakah voucher ada
    if (!voucher) {
      return res.status(404).json({ valid: false, msg: 'Voucher tidak ditemukan' });
    }

    // 2. Cek apakah voucher sudah kedaluwarsa
    if (new Date() > new Date(voucher.expired_time)) {
      return res.status(410).json({ valid: false, msg: 'Voucher sudah kedaluwarsa' });
    }

    // 3. Cek apakah kuota masih tersedia
    if (voucher.quantity_used >= voucher.quantity_max) {
      return res.status(429).json({ valid: false, msg: 'Kuota voucher sudah habis' });
    }

    // Jika semua validasi lolos
    res.status(200).json({ valid: true, msg: 'Voucher valid dan dapat digunakan', data: voucher });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createVoucher,
  getAllVouchers,
  validateVoucher,
};