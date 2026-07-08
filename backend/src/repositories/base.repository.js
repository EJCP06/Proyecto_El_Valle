const { query } = require('../config/db');

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function pickAllowed(data, allowedColumns) {
  return allowedColumns.reduce((accumulator, column) => {
    if (data[column] !== undefined) {
      accumulator[column] = data[column];
    }

    return accumulator;
  }, {});
}

function createCrudRepository({
  table,
  allowedColumns = [],
  idColumn = 'id',
  generatedId = true,
  searchColumns = [],
  orderBy = null,
  orderDirection = 'DESC',
  updatedAtColumn = 'updated_at',
}) {
  const tableName = quoteIdentifier(table);
  const idName = quoteIdentifier(idColumn);

  async function findAll({ search, limit = 100, offset = 0 } = {}) {
    const values = [];
    const clauses = [];

    if (search && searchColumns.length) {
      const searchTerms = searchColumns.map((column) => {
        values.push(`%${search}%`);
        return `${quoteIdentifier(column)} ILIKE $${values.length}`;
      });

      clauses.push(`(${searchTerms.join(' OR ')})`);
    }

    values.push(Math.max(1, Number(limit) || 100));
    values.push(Math.max(0, Number(offset) || 0));

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const orderClause = orderBy
      ? `ORDER BY ${quoteIdentifier(orderBy)} ${String(orderDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'} NULLS LAST`
      : '';

    const result = await query(
      `SELECT * FROM ${tableName} ${whereClause} ${orderClause} LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return result.rows;
  }

  async function findById(id) {
    const result = await query(`SELECT * FROM ${tableName} WHERE ${idName} = $1 LIMIT 1`, [id]);
    return result.rows[0] || null;
  }

  async function create(data) {
    const payload = pickAllowed(data, allowedColumns);

    if (!generatedId && data[idColumn] !== undefined) {
      payload[idColumn] = data[idColumn];
    }

    const entries = Object.entries(payload);
    if (!entries.length) {
      const error = new Error('No se enviaron campos validos');
      error.statusCode = 400;
      throw error;
    }

    const columns = entries.map(([column]) => quoteIdentifier(column));
    const placeholders = entries.map((_, index) => `$${index + 1}`);
    const values = entries.map(([, value]) => value);

    const result = await query(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values,
    );

    return result.rows[0];
  }

  async function update(id, data) {
    const payload = pickAllowed(data, allowedColumns);
    const entries = Object.entries(payload);

    if (!entries.length) {
      const error = new Error('No se enviaron campos validos');
      error.statusCode = 400;
      throw error;
    }

    const assignments = entries.map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`);
    const values = entries.map(([, value]) => value);
    values.push(id);

    const updateParts = [...assignments];

    if (updatedAtColumn) {
      updateParts.push(`${quoteIdentifier(updatedAtColumn)} = NOW()`);
    }

    const result = await query(
      `UPDATE ${tableName} SET ${updateParts.join(', ')} WHERE ${idName} = $${values.length} RETURNING *`,
      values,
    );

    return result.rows[0] || null;
  }

  async function remove(id) {
    const result = await query(`DELETE FROM ${tableName} WHERE ${idName} = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
  }

  return {
    findAll,
    findById,
    create,
    update,
    remove,
  };
}

module.exports = { createCrudRepository };
