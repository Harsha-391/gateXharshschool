import * as sqlDb from '../utils/sqlDb.js';
import { tenantStorage, slugify } from '../utils/db.js';

// Helper to get active tenant ID
const getTenantId = () => {
  const tenantId = tenantStorage.getStore();
  return tenantId ? slugify(tenantId) : 'platform';
};

// =============================================
// 1. CATEGORY CRUD CONTROLLERS
// =============================================

export const getCategories = async (req, res) => {
  try {
    const tId = getTenantId();
    const rows = await sqlDb.query(
      'SELECT * FROM auxiliary_income_categories WHERE tenantId = ? ORDER BY name ASC',
      [tId]
    );
    res.json(rows || []);
  } catch (err) {
    console.error('Error fetching auxiliary categories:', err);
    res.status(500).json({ error: 'Server error loading categories.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const tId = getTenantId();
    const id = `AXC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    // Check duplicate
    const existing = await sqlDb.query(
      'SELECT id FROM auxiliary_income_categories WHERE name = ? AND tenantId = ?',
      [name, tId]
    );
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: `Category "${name}" already exists.` });
    }

    await sqlDb.query(
      'INSERT INTO auxiliary_income_categories (id, name, description, tenantId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description || '', tId, now, now]
    );

    res.status(201).json({ id, name, description, tenantId: tId, createdAt: now, updatedAt: now });
  } catch (err) {
    console.error('Error creating auxiliary category:', err);
    res.status(500).json({ error: 'Server error creating category.' });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const tId = getTenantId();
    const now = new Date().toISOString();

    // Verify ownership
    const category = await sqlDb.query(
      'SELECT id FROM auxiliary_income_categories WHERE id = ? AND tenantId = ?',
      [id, tId]
    );
    if (!category || category.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check duplicate name under different ID
    const duplicate = await sqlDb.query(
      'SELECT id FROM auxiliary_income_categories WHERE name = ? AND tenantId = ? AND id != ?',
      [name, tId, id]
    );
    if (duplicate && duplicate.length > 0) {
      return res.status(409).json({ error: `Another category named "${name}" already exists.` });
    }

    await sqlDb.query(
      'UPDATE auxiliary_income_categories SET name = ?, description = ?, updatedAt = ? WHERE id = ? AND tenantId = ?',
      [name, description || '', now, id, tId]
    );

    res.json({ id, name, description, updatedAt: now });
  } catch (err) {
    console.error('Error updating auxiliary category:', err);
    res.status(500).json({ error: 'Server error updating category.' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const tId = getTenantId();

    const category = await sqlDb.query(
      'SELECT id FROM auxiliary_income_categories WHERE id = ? AND tenantId = ?',
      [id, tId]
    );
    if (!category || category.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await sqlDb.query(
      'DELETE FROM auxiliary_income_categories WHERE id = ? AND tenantId = ?',
      [id, tId]
    );

    res.json({ success: true, message: 'Category removed successfully.' });
  } catch (err) {
    console.error('Error deleting auxiliary category:', err);
    res.status(500).json({ error: 'Server error removing category.' });
  }
};

// =============================================
// 2. INCOME ENTRY CRUD CONTROLLERS
// =============================================

export const getEntries = async (req, res) => {
  try {
    const tId = getTenantId();
    const { categoryId, search, startDate, endDate } = req.query;

    let sql = `
      SELECT ai.*, aic.name as categoryName 
      FROM auxiliary_income ai
      INNER JOIN auxiliary_income_categories aic ON ai.categoryId = aic.id
      WHERE ai.tenantId = ?
    `;
    const params = [tId];

    if (categoryId && categoryId !== 'All') {
      sql += ' AND ai.categoryId = ?';
      params.push(categoryId);
    }

    if (startDate) {
      sql += ' AND ai.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND ai.date <= ?';
      params.push(endDate);
    }

    if (search && search.trim()) {
      sql += ' AND (ai.receivedFrom LIKE ? OR ai.description LIKE ? OR ai.receiptNumber LIKE ? OR ai.referenceNumber LIKE ?)';
      const q = `%${search.trim()}%`;
      params.push(q, q, q, q);
    }

    sql += ' ORDER BY ai.date DESC, ai.createdAt DESC';

    const rows = await sqlDb.query(sql, params);
    res.json(rows || []);
  } catch (err) {
    console.error('Error loading auxiliary income entries:', err);
    res.status(500).json({ error: 'Server error loading entries.' });
  }
};

export const createEntry = async (req, res) => {
  try {
    const { categoryId, amount, date, receivedFrom, paymentMethod, referenceNumber, description } = req.body;
    if (!categoryId || !amount || !date) {
      return res.status(400).json({ error: 'Category ID, amount, and date are required.' });
    }

    const tId = getTenantId();
    const now = new Date().toISOString();

    // Verify category exists
    const category = await sqlDb.query(
      'SELECT id, name FROM auxiliary_income_categories WHERE id = ? AND tenantId = ?',
      [categoryId, tId]
    );
    if (!category || category.length === 0) {
      return res.status(404).json({ error: 'Selected category does not exist.' });
    }

    const id = `AXI-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `REC-AUX-${Date.now()}`;

    await sqlDb.query(
      `INSERT INTO auxiliary_income (
        id, categoryId, amount, date, receivedFrom, paymentMethod, referenceNumber, description, receiptNumber, tenantId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        categoryId,
        Number(amount),
        date,
        receivedFrom || '',
        paymentMethod || 'Cash',
        referenceNumber || '',
        description || '',
        receiptNumber,
        tId,
        now,
        now
      ]
    );

    res.status(201).json({
      id,
      categoryId,
      categoryName: category[0].name,
      amount: Number(amount),
      date,
      receivedFrom,
      paymentMethod,
      referenceNumber,
      description,
      receiptNumber,
      tenantId: tId,
      createdAt: now,
      updatedAt: now
    });
  } catch (err) {
    console.error('Error creating auxiliary income entry:', err);
    res.status(500).json({ error: 'Server error recording income entry.' });
  }
};

export const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, amount, date, receivedFrom, paymentMethod, referenceNumber, description } = req.body;
    if (!categoryId || !amount || !date) {
      return res.status(400).json({ error: 'Category ID, amount, and date are required.' });
    }

    const tId = getTenantId();
    const now = new Date().toISOString();

    // Check entry exists
    const entry = await sqlDb.query(
      'SELECT id, receiptNumber FROM auxiliary_income WHERE id = ? AND tenantId = ?',
      [id, tId]
    );
    if (!entry || entry.length === 0) {
      return res.status(404).json({ error: 'Income entry not found.' });
    }

    // Verify category exists
    const category = await sqlDb.query(
      'SELECT id, name FROM auxiliary_income_categories WHERE id = ? AND tenantId = ?',
      [categoryId, tId]
    );
    if (!category || category.length === 0) {
      return res.status(404).json({ error: 'Selected category does not exist.' });
    }

    await sqlDb.query(
      `UPDATE auxiliary_income SET 
        categoryId = ?, amount = ?, date = ?, receivedFrom = ?, paymentMethod = ?, referenceNumber = ?, description = ?, updatedAt = ?
      WHERE id = ? AND tenantId = ?`,
      [
        categoryId,
        Number(amount),
        date,
        receivedFrom || '',
        paymentMethod || 'Cash',
        referenceNumber || '',
        description || '',
        now,
        id,
        tId
      ]
    );

    res.json({
      id,
      categoryId,
      categoryName: category[0].name,
      amount: Number(amount),
      date,
      receivedFrom,
      paymentMethod,
      referenceNumber,
      description,
      receiptNumber: entry[0].receiptNumber,
      updatedAt: now
    });
  } catch (err) {
    console.error('Error updating auxiliary income entry:', err);
    res.status(500).json({ error: 'Server error updating income entry.' });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const tId = getTenantId();

    const entry = await sqlDb.query(
      'SELECT id FROM auxiliary_income WHERE id = ? AND tenantId = ?',
      [id, tId]
    );
    if (!entry || entry.length === 0) {
      return res.status(404).json({ error: 'Income entry not found.' });
    }

    await sqlDb.query(
      'DELETE FROM auxiliary_income WHERE id = ? AND tenantId = ?',
      [id, tId]
    );

    res.json({ success: true, message: 'Income entry deleted successfully.' });
  } catch (err) {
    console.error('Error deleting auxiliary income entry:', err);
    res.status(500).json({ error: 'Server error removing income entry.' });
  }
};
