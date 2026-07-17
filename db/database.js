const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

/**
 * Connects to PostgreSQL with a basic retry mechanism to withstand 
 * Render cold starts/database spin-ups.
 */
async function connectWithRetry(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log(`✅ Connected to PostgreSQL database at ${res.rows[0].now}`);
            return;
        } catch (err) {
            console.error(`❌ Connection attempt ${i + 1} failed: ${err.message}`);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw new Error('Could not establish database connection. Max retries reached.');
            }
        }
    }
}

/**
 * Automatically initializes production schema and indexes sequentially.
 */
async function initDb() {
    try {
        await connectWithRetry();

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                "userId" TEXT NOT NULL,
                type TEXT NOT NULL,
                amount NUMERIC NOT NULL,
                category TEXT,
                note TEXT,
                "sourceMessageId" TEXT,
                "sourceTxnIndex" INTEGER,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_message_dedup
            ON transactions ("sourceMessageId", "sourceTxnIndex")
        `);
        console.log('✅ PostgreSQL schema verified/initialized successfully');
    } catch (err) {
        console.error('❌ Failed to initialize PostgreSQL schema:', err);
        throw err;
    }
}

// =====================
// ANALYTICS HELPERS
// =====================

async function getRecentTransactions(userId, limit = 20) {
    const query = `
        SELECT id, "userId", type, amount, category, note, "sourceMessageId", "sourceTxnIndex", "createdAt"
        FROM transactions
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC, id DESC
        LIMIT $2
    `;
    const res = await pool.query(query, [userId, limit]);
    
    return res.rows.map(row => ({
        id: row.id,
        userId: row.userId,
        type: row.type,
        amount: parseFloat(row.amount),
        category: row.category,
        note: row.note,
        sourceMessageId: row.sourceMessageId,
        sourceTxnIndex: row.sourceTxnIndex,
        createdAt: row.createdAt
    }));
}

async function getTodaySummary(userId) {
    const query = `
        SELECT type, SUM(amount) as total
        FROM transactions
        WHERE "userId" = $1
          AND ("createdAt" AT TIME ZONE 'Asia/Bangkok')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date
        GROUP BY type
    `;
    const res = await pool.query(query, [userId]);

    let income = 0;
    let expense = 0;

    res.rows.forEach(row => {
        if (row.type === 'income') income = parseFloat(row.total) || 0;
        if (row.type === 'expense') expense = parseFloat(row.total) || 0;
    });

    return {
        income,
        expense,
        balance: income - expense
    };
}

async function getTodayCategorySummary(userId) {
    const query = `
        SELECT
            category,
            type,
            COUNT(*)::int as count,
            SUM(amount) as total
        FROM transactions
        WHERE "userId" = $1
          AND ("createdAt" AT TIME ZONE 'Asia/Bangkok')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date
        GROUP BY category, type
        ORDER BY total DESC
    `;
    const res = await pool.query(query, [userId]);
    return res.rows.map(row => ({
        category: row.category,
        type: row.type,
        count: row.count,
        total: parseFloat(row.total)
    }));
}

async function getDailySummary(userId, limitDays = 7) {
    const query = `
        SELECT
            TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') as date,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions
        WHERE "userId" = $1
        GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')
        ORDER BY date DESC
        LIMIT $2
    `;
    const res = await pool.query(query, [userId, limitDays]);

    return res.rows.map(row => ({
        date: row.date,
        income: parseFloat(row.income) || 0,
        expense: parseFloat(row.expense) || 0,
        balance: (parseFloat(row.income) || 0) - (parseFloat(row.expense) || 0)
    }));
}

async function getMonthlySummary(userId, limitMonths = 6) {
    const query = `
        SELECT *
        FROM (
            SELECT
                TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM') as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE "userId" = $1
            GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')
            ORDER BY month DESC
            LIMIT $2
        ) sub
        ORDER BY month ASC
    `;
    const res = await pool.query(query, [userId, limitMonths]);

    return res.rows.map(row => ({
        month: row.month,
        income: parseFloat(row.income) || 0,
        expense: parseFloat(row.expense) || 0,
        balance: (parseFloat(row.income) || 0) - (parseFloat(row.expense) || 0)
    }));
}

async function deleteTodayTransactionsByUser(userId) {
    const query = `
        DELETE FROM transactions
        WHERE "userId" = $1
          AND ("createdAt" AT TIME ZONE 'Asia/Bangkok')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date
    `;
    const res = await pool.query(query, [userId]);

    return {
        deletedCount: res.rowCount || 0
    };
}

module.exports = {
    pool,
    initDb,
    getRecentTransactions,
    getTodaySummary,
    getTodayCategorySummary,
    getDailySummary,
    getMonthlySummary,
    deleteTodayTransactionsByUser
};
