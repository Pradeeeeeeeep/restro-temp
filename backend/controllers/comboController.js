const prisma = require('../prismaClient');

// GET /api/combos — Public endpoint for customer app
const getPublicCombos = async (req, res) => {
  try {
    const combos = await prisma.combo.findMany({
      where: { available: true },
      orderBy: { id: 'asc' },
    });
    res.json({ combos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch combo meals' });
  }
};

// GET /api/admin/combos — Admin endpoint
const getAdminCombos = async (req, res) => {
  try {
    const combos = await prisma.combo.findMany({
      orderBy: { id: 'asc' },
    });
    res.json({ combos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin combos' });
  }
};

// POST /api/admin/combos — Create combo
const createCombo = async (req, res) => {
  try {
    const { name, description, originalPrice, comboPrice, badge, image, available } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Combo name is required' });
    if (!comboPrice || isNaN(comboPrice)) return res.status(400).json({ error: 'Valid combo price is required' });

    const origPrice = originalPrice ? parseFloat(originalPrice) : null;
    const cPrice = parseFloat(comboPrice);
    const savingsAmount = origPrice && origPrice > cPrice ? (origPrice - cPrice) : null;

    const combo = await prisma.combo.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        originalPrice: origPrice,
        comboPrice: cPrice,
        savings: savingsAmount,
        badge: badge ? badge.trim() : null,
        image: image ? image.trim() : null,
        available: available !== undefined ? Boolean(available) : true,
      },
    });

    res.status(201).json({ success: true, combo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create combo' });
  }
};

// PUT /api/admin/combos/:id — Update combo
const updateCombo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, originalPrice, comboPrice, badge, image, available } = req.body;

    const origPrice = originalPrice !== undefined ? (originalPrice ? parseFloat(originalPrice) : null) : undefined;
    const cPrice = comboPrice !== undefined ? parseFloat(comboPrice) : undefined;
    
    let savingsAmount = undefined;
    if (origPrice !== undefined || cPrice !== undefined) {
      const existing = await prisma.combo.findUnique({ where: { id } });
      if (existing) {
        const finalOrig = origPrice !== undefined ? origPrice : existing.originalPrice;
        const finalCombo = cPrice !== undefined ? cPrice : existing.comboPrice;
        savingsAmount = finalOrig && finalOrig > finalCombo ? (finalOrig - finalCombo) : null;
      }
    }

    const combo = await prisma.combo.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(origPrice !== undefined && { originalPrice: origPrice }),
        ...(cPrice !== undefined && { comboPrice: cPrice }),
        ...(savingsAmount !== undefined && { savings: savingsAmount }),
        ...(badge !== undefined && { badge: badge ? badge.trim() : null }),
        ...(image !== undefined && { image: image ? image.trim() : null }),
        ...(available !== undefined && { available: Boolean(available) }),
      },
    });

    res.json({ success: true, combo });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update combo' });
  }
};

// DELETE /api/admin/combos/:id — Delete combo
const deleteCombo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.combo.delete({ where: { id } });
    res.json({ success: true, message: 'Combo deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete combo' });
  }
};

module.exports = {
  getPublicCombos,
  getAdminCombos,
  createCombo,
  updateCombo,
  deleteCombo,
};
