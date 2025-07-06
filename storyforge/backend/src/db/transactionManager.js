const { getDB } = require('./database');
const logger = require('../utils/logger');
const { DatabaseError } = require('../utils/errors');

/**
 * Executes a function within a database transaction
 * @param {Function} fn The function to execute within the transaction
 * @returns {*} The result of the function
 * @throws {DatabaseError} If the transaction fails
 */
async function withTransaction(fn) {
  const db = getDB();
  
  try {
    // Begin transaction
    db.prepare('BEGIN').run();
    
    // Execute the function
    const result = await fn(db);
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    return result;
  } catch (error) {
    // Rollback transaction on error
    try {
      db.prepare('ROLLBACK').run();
    } catch (rollbackError) {
      logger.error('Failed to rollback transaction:', rollbackError);
    }
    
    logger.error('Transaction failed:', error);
    throw new DatabaseError('Transaction failed', error);
  }
}

/**
 * Creates a better-sqlite3 transaction wrapper
 * @param {Database} db The database instance
 * @param {Function} fn The function to wrap in a transaction
 * @returns {Function} The wrapped function
 */
function createTransaction(db, fn) {
  return db.transaction(fn);
}

/**
 * Executes multiple operations in a single transaction
 * @param {Array<Function>} operations Array of operations to execute
 * @returns {Array} Results of all operations
 */
async function batchTransaction(operations) {
  return withTransaction(async (db) => {
    const results = [];
    
    for (const operation of operations) {
      const result = await operation(db);
      results.push(result);
    }
    
    return results;
  });
}

module.exports = {
  withTransaction,
  createTransaction,
  batchTransaction
};