// controllers/orderController.js

const prisma = require('../lib/prisma');


/**
 * @desc    Membuat pesanan baru
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  const { user_id, buyer_id, products, voucher_id, desc } = req.body;

  if (!user_id || !buyer_id || !products || products.length === 0) {
    return res.status(400).json({
      msg: 'User ID, Buyer ID, and products are required',
    });
  }

  try {
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1️⃣ Ambil data produk dari DB
      const productIds = products.map((p) => p.product_id);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (dbProducts.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      const priceMap = new Map(dbProducts.map((p) => [p.id, p.price]));

      // 2️⃣ Hitung subtotal tiap item dan total
      let subTotalAmount = 0;
      const detailOrderData = products.map((p) => {
        const price = priceMap.get(p.product_id);
        if (price === undefined) {
          throw new Error(`Product ID ${p.product_id} not found`);
        }

        const sub_total = price * p.quantity;
        subTotalAmount += sub_total;

        return {
          product_id: p.product_id,
          quantity: p.quantity,
          price,
          sub_total,
        };
      });

      // 3️⃣ Logika voucher (opsional)
      let finalDiscount = 0;
      if (voucher_id) {
        const voucher = await tx.voucher.findUnique({
          where: { id: parseInt(voucher_id) },
        });

        if (!voucher) {
          throw new Error('Voucher not found');
        }

        // Contoh logika diskon sederhana (bisa kamu ubah sesuai kebutuhan)
        finalDiscount =
          voucher.quantity_used < voucher.quantity_max ? 10000 : 0;

        // Update jumlah penggunaan voucher
        await tx.voucher.update({
          where: { id: parseInt(voucher_id) },
          data: { quantity_used: { increment: 1 } },
        });
      }

      const finalTotal = subTotalAmount - finalDiscount;
      const order_code = `INV-${Date.now()}`;

      // 4️⃣ Simpan order ke DB
      const createdOrder = await tx.order.create({
        data: {
          order_code,
          total: finalTotal,
          discount: finalDiscount,
          desc,
          user_id: parseInt(user_id),
          buyer_id: parseInt(buyer_id),
          // jika field voucher_id tidak wajib di Prisma, tambahkan opsional
          ...(voucher_id && { voucher_id: parseInt(voucher_id) }),
          detailOrders: {
            create: detailOrderData,
          },
        },
        include: {
          detailOrders: {
            include: { product: true },
          },
          buyer: true,
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      msg: 'Order created successfully',
      data: newOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mendapatkan semua order berdasarkan buyer
 * @route   GET /api/orders/buyer/:buyerId
 * @access  Private
 */
const getOrdersByBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;

    const orders = await prisma.order.findMany({
      where: { buyer_id: parseInt(buyerId) },
      include: {
        detailOrders: {
          include: {
            product: {
              select: { name: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!orders.length) {
      return res.status(404).json({ msg: 'No orders found for this buyer' });
    }

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu order berdasarkan ID-nya
 * @route   GET /api/orders/:orderId
 * @access  Private
 */
const getOrderDetailById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        buyer: { select: { username: true, phone: true } },
        detailOrders: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  createOrder,
  getOrdersByBuyer,
  getOrderDetailById,
  getAllOrders,
};
