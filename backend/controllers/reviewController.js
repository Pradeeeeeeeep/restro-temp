const prisma = require('../prismaClient');

// GET /api/reviews — Public endpoint for customer app
const getPublicReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// GET /api/admin/reviews — Admin endpoint
const getAdminReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin reviews' });
  }
};

// POST /api/admin/reviews — Add a custom review
const createReview = async (req, res) => {
  try {
    const { author, rating, comment, avatar, itemTitle } = req.body;
    if (!author || !author.trim()) return res.status(400).json({ error: 'Author name is required' });
    if (!comment || !comment.trim()) return res.status(400).json({ error: 'Review comment is required' });

    const review = await prisma.review.create({
      data: {
        author: author.trim(),
        rating: rating ? parseInt(rating) : 5,
        comment: comment.trim(),
        avatar: avatar ? avatar.trim() : null,
        itemTitle: itemTitle ? itemTitle.trim() : null,
      },
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add review' });
  }
};

// DELETE /api/admin/reviews/:id — Delete review
const deleteReview = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = {
  getPublicReviews,
  getAdminReviews,
  createReview,
  deleteReview,
};
