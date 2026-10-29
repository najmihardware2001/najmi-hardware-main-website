const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT c.id, c.name_ar, c.name_en, c.slug, c.status, c.priority, c.image_url,
        c.image_alt_en, c.image_alt_ar, c.badge_en, c.badge_ar, COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id=c.id AND ${require('../services/catalog').VISIBLE}
      WHERE c.status = 'ACTIVE'
      GROUP BY c.id
      HAVING COUNT(p.id)>0 OR NOT $1::boolean
      ORDER BY c.priority DESC, c.name_en ASC, c.id ASC
    `, [req.query.populated === 'true']);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
