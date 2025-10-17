const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tambah buyer baru
const registerBuyer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ msg: 'Name and email are required' });
    }

    const newBuyer = await prisma.buyer.create({
      data: {
        name,
        email,
        phone,
        address
      }
    });

    res.status(201).json(newBuyer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Ambil profile buyer by id
const getBuyerProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const buyer = await prisma.buyer.findUnique({ where: { id: Number(id) } });
    if (!buyer) return res.status(404).json({ msg: 'Buyer not found' });
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Update profile buyer
const updateBuyerProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;
  try {
    const updatedBuyer = await prisma.buyer.update({
      where: { id: Number(id) },
      data: { name, email, phone, address }
    });
    res.json(updatedBuyer);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Ambil semua buyer
const getAllBuyers = async (req, res) => {
  try {
    const buyers = await prisma.buyer.findMany();
    res.json(buyers);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  registerBuyer,
  getBuyerProfile,
  updateBuyerProfile,
  getAllBuyers
};
