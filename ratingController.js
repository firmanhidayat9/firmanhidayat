// controllers/ratingController.js

const prisma = require('../lib/prisma');


/**
 * @desc    Menambahkan rating dan ulasan baru untuk sebuah produk dalam pesanan
 * @route   POST /api/ratings
 * @access  Private (membutuhkan otentikasi buyer)
 */
const addRating = async (req, res) => {
  const { buyer_id, product_id, order_id, rating, review } = req.body;

  // Validasi input dasar
  if (buyer_id === undefined || product_id === undefined || order_id === undefined || rating === undefined) {
    return res.status(400).json({ msg: 'buyer_id, product_id, order_id, and rating are required' });
  }

  try {
    // Opsional: Validasi tambahan untuk memastikan buyer benar-benar memesan produk ini
    // const order = await prisma.order.findFirst({
    //   where: {
    //     id: parseInt(order_id),
    //     buyer_id: parseInt(buyer_id),
    //     detail_orders: {
    //       some: { product_id: parseInt(product_id) },
    //     },
    //   },
    // });
    // if (!order) {
    //   return res.status(403).json({ msg: "You cannot review a product you didn't order." });
    // }

    const newRating = await prisma.rating.create({
      data: {
        buyer_id: parseInt(buyer_id),
        product_id: parseInt(product_id),
        order_id: parseInt(order_id),
        rating: parseInt(rating), // Rating 1-5
        review: review,
      },
    });

    res.status(201).json({ msg: 'Rating added successfully', data: newRating });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mendapatkan semua rating untuk produk tertentu
 * @route   GET /api/ratings/product/:productId
 * @access  Public
 */
const getRatingsByProduct = async (req, res) => {
  const { productId } = req.params;

  try {
    const ratings = await prisma.rating.findMany({
      where: {
        product_id: parseInt(productId),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        // Sertakan informasi buyer yang memberikan rating
        buyer: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!ratings || ratings.length === 0) {
      return res.status(404).json({ msg: 'No ratings found for this product' });
    }

    res.status(200).json(ratings);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  addRating,
  getRatingsByProduct,
};