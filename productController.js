// Import instance Prisma Client
const prisma = require('../lib/prisma');

/**
 * @desc    Menambahkan produk baru
 * @route   POST /api/products
 * @access  Private (biasanya butuh otentikasi admin)
 */
const createProduct = async (req, res) => {
  // Ambil data dari body request
  const { product_code, name, type, price, desc, image } = req.body;

  // Validasi dasar
  if (!product_code || !name || !price) {
    return res.status(400).json({ msg: 'Product code, name, and price are required' });
  }

  try {
    const newProduct = await prisma.product.create({
      data: {
        product_code: product_code,
        name: name,
        type: type, // Pastikan 'type' sesuai dengan ENUM di skema Prisma
        price: parseFloat(price), // Pastikan harga adalah angka
        desc: desc,
        image: image,
      },
    });
    res.status(201).json({ msg: 'Product created successfully', data: newProduct });
  } catch (error) {
    // Tangani error jika product_code sudah ada
    if (error.code === 'P2002') {
      return res.status(409).json({ msg: 'Product code already exists' });
    }
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mendapatkan semua produk dengan filter dan search
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res) => {
  const { type, search } = req.query;
  let whereClause = {};

  // Logika untuk filter berdasarkan 'type'
  if (type) {
    whereClause.type = type; // Contoh: 'ELECTRONIC', 'FOOD'
  }

  // Logika untuk search berdasarkan 'name'
  if (search) {
    whereClause.name = {
      contains: search,
      mode: 'insensitive', // Tidak peduli huruf besar/kecil
    };
  }

  try {
    const products = await prisma.product.findMany({
      where: whereClause,
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu produk berdasarkan ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mengubah data produk berdasarkan ID
 * @route   PUT /api/products/:id
 * @access  Private (Admin)
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, type, price, desc, image, product_code } = req.body;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        price: price ? parseFloat(price) : undefined, // Update harga jika ada
        desc,
        image,
        product_code,
      },
    });
    res.status(200).json({ msg: 'Product updated successfully', data: updatedProduct });
  } catch (error) {
    // Tangani jika produk yang akan diupdate tidak ada
    if (error.code === 'P2025') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Menghapus produk berdasarkan ID
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ msg: 'Product deleted successfully' });
  } catch (error) {
    // Tangani jika produk yang akan dihapus tidak ada
    if (error.code === 'P2025') {
      return res.status(404).json({ msg: 'Product not found' });
    }
    res.status(500).json({ msg: error.message });
  }
};

// Export semua fungsi
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};