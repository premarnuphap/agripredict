const {
    db,
    getRecentTransactions,
    getTodaySummary,
    getTodayCategorySummary,
    getDailySummary,
    getMonthlySummary,
    deleteTodayTransactionsByUser
} = require('../database');

function saveTransaction(userId, tx, sourceMessageId, sourceTxnIndex) {
    const { type, amount, category, note } = tx;

    if (!userId || !type || !amount || amount <= 0) {
        return Promise.reject(new Error('Invalid transaction data'));
    }
    if (!sourceMessageId && sourceMessageId !== null) {
        return Promise.reject(new Error('Missing sourceMessageId'));
    }

    return new Promise((resolve, reject) => {
        try {
            const result = db.prepare(`
                INSERT INTO transactions (
                    userId, type, amount, category, note, sourceMessageId, sourceTxnIndex
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(userId, type, amount, category, note || 'ไม่ระบุ', sourceMessageId, sourceTxnIndex);
            resolve({ id: result.lastInsertRowid, changes: result.changes });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    saveTransaction,
    getRecentTransactions,
    getTodaySummary,
    getTodayCategorySummary,
    getDailySummary,
    getMonthlySummary,
    deleteTodayTransactionsByUser
};
