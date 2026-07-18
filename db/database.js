const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            userId TEXT NOT NULL,
            type TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            category TEXT,
            note TEXT,
            sourceMessageId TEXT,
            sourceTxnIndex INTEGER,
            createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_profile (
            user_id TEXT PRIMARY KEY,
            province TEXT,
            farm_type TEXT,
            registration_step TEXT DEFAULT 'province',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_message_dedup
        ON transactions (sourceMessageId, sourceTxnIndex)
    `);

    console.log('✅ Connected to PostgreSQL database and ensured schema');
}

const dbReady = initDb().catch((error) => {
    console.error('❌ Failed to initialize PostgreSQL schema:', error);
    process.exit(1);
});

// =====================
// ANALYTICS HELPERS
// =====================

// รายการล่าสุด
async function getRecentTransactions(userId, limit = 20) {
    await dbReady;

    const result = await pool.query(
        `
        SELECT id, userId, type, amount, category, note, sourceMessageId, sourceTxnIndex, createdAt
        FROM transactions
        WHERE userId = $1
        ORDER BY createdAt DESC, id DESC
        LIMIT $2
        `,
        [userId, limit]
    );

    return result.rows;
}

// summary วันนี้
async function getTodaySummary(userId) {
    await dbReady;

    const result = await pool.query(
        `
        SELECT type, SUM(amount) as total
        FROM transactions
        WHERE userId = $1
          AND (createdAt AT TIME ZONE 'Asia/Bangkok')::date = (NOW() AT TIME ZONE 'Asia/Bangkok')::date
        GROUP BY type
        `,
        [userId]
    );

    let income = 0;
    let expense = 0;

    result.rows.forEach(row => {
        if (row.type === 'income') income = Number(row.total) || 0;
        if (row.type === 'expense') expense = Number(row.total) || 0;
    });

    return {
        income,
        expense,
        balance: income - expense
    };
}

// สรุปตามหมวดหมู่ของวันนี้
async function getTodayCategorySummary(userId) {
    await dbReady;

    const result = await pool.query(
        `
        SELECT
            category,
            type,
            COUNT(*) as count,
            SUM(amount) as total
        FROM transactions
        WHERE userId = $1
          AND (createdAt AT TIME ZONE 'Asia/Bangkok')::date = (NOW() AT TIME ZONE 'Asia/Bangkok')::date
        GROUP BY category, type
        ORDER BY total DESC
        `,
        [userId]
    );

    return result.rows.map(row => ({
        category: row.category,
        type: row.type,
        count: Number(row.count) || 0,
        total: Number(row.total) || 0
    }));
}

// สรุปรายวันย้อนหลัง
async function getDailySummary(userId, limitDays = 7) {
    await dbReady;

    const result = await pool.query(
        `
        SELECT
            (createdAt AT TIME ZONE 'Asia/Bangkok')::date as date,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions
        WHERE userId = $1
        GROUP BY (createdAt AT TIME ZONE 'Asia/Bangkok')::date
        ORDER BY date DESC
        LIMIT $2
        `,
        [userId, limitDays]
    );

    return result.rows.map(row => {
        const income = Number(row.income) || 0;
        const expense = Number(row.expense) || 0;

        return {
            date: formatDateOnly(row.date),
            income,
            expense,
            balance: income - expense
        };
    });
}

// สรุปรายเดือนย้อนหลัง
async function getMonthlySummary(userId, limitMonths = 6) {
    await dbReady;

    const result = await pool.query(
        `
        SELECT * FROM (
            SELECT
                to_char(createdAt AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM') as month,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions
            WHERE userId = $1
            GROUP BY to_char(createdAt AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')
            ORDER BY month DESC
            LIMIT $2
        ) sub
        ORDER BY month ASC
        `,
        [userId, limitMonths]
    );

    return result.rows.map(row => {
        const income = Number(row.income) || 0;
        const expense = Number(row.expense) || 0;

        return {
            month: row.month,
            income,
            expense,
            balance: income - expense
        };
    });
}

// ลบเฉพาะข้อมูลของ user ปัจจุบันใน "วันนี้"
async function deleteTodayTransactionsByUser(userId) {
    await dbReady;

    const result = await pool.query(
        `
        DELETE FROM transactions
        WHERE userId = $1
          AND (createdAt AT TIME ZONE 'Asia/Bangkok')::date = (NOW() AT TIME ZONE 'Asia/Bangkok')::date
        `,
        [userId]
    );

    return {
        deletedCount: result.rowCount || 0
    };
}
async function canUseAI(userId) {

    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());

    const result = await pool.query(
        `
        SELECT usedCount
        FROM ai_usage
        WHERE userId=$1
        AND usageDate=$2
        `,
        [userId, today]
    );

    if(result.rows.length===0){

        await pool.query(
            `
            INSERT INTO ai_usage(userId,usageDate,usedCount)
            VALUES($1,$2,1)
            `,
            [userId,today]
        );

        return true;

    }

    const used=result.rows[0].usedcount;

    if(used>=3){

        return false;

    }

    await pool.query(
        `
        UPDATE ai_usage
        SET usedCount=usedCount+1
        WHERE userId=$1
        AND usageDate=$2
        `,
        [userId,today]
    );

    return true;

}
// บันทึกรายการ
async function saveTransaction(userId, tx, sourceMessageId, sourceTxnIndex) {
    await dbReady;

    const { type, amount, category, note } = tx || {};

    if (!userId || !type || !amount || amount <= 0) {
        throw new Error('Invalid transaction data');
    }

    if (!sourceMessageId && sourceMessageId !== null) {
        throw new Error('Missing sourceMessageId');
    }

    try {
        const result = await pool.query(
            `
            INSERT INTO transactions (
                userId,
                type,
                amount,
                category,
                note,
                sourceMessageId,
                sourceTxnIndex
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
            `,
            [
                userId,
                type,
                amount,
                category,
                note || 'ไม่ระบุ',
                sourceMessageId,
                sourceTxnIndex
            ]
        );

        return {
            id: result.rows[0].id,
            changes: result.rowCount
        };
    } catch (error) {
        if (error && error.code === '23505') {
            throw new Error('UNIQUE constraint failed: transactions.sourceMessageId, transactions.sourceTxnIndex');
        }
        throw error;
    }
}

function formatDateOnly(value) {
    if (!value) return null;

    if (value instanceof Date) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    return String(value).slice(0, 10);
}

async function getUserProfile(userId) {
  const result = await pool.query(
    `SELECT * FROM user_profile WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}
async function setRegistrationStep(userId, step) {
    await pool.query(
        `
        UPDATE user_profile
        SET registration_step = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        `,
        [userId, step]
    );
}
async function getRegistrationStep(userId) {
    const result = await pool.query(
        `
        SELECT registration_step
        FROM user_profile
        WHERE user_id = $1
        `,
        [userId]
    );

    if (result.rows.length === 0) {
        return "province";
    }
    
    return result.rows[0].registration_step || "province";
}
async function saveProvince(userId, province) {
  await pool.query(
    `
    INSERT INTO user_profile (
    user_id,
    province,
    registration_step
    )
    VALUES (
    $1,
    $2,
    'farm_type'
    )
    VALUES ($1,$2)

    ON CONFLICT (user_id)

    DO UPDATE

    SET
        province = EXCLUDED.province,
        registration_step = 'farm_type',
        updated_at = CURRENT_TIMESTAMP
    `,
    [userId, province]
  );
}

async function saveFarmType(userId, farmType) {
  await pool.query(
    `
    UPDATE user_profile

    SET
        farm_type = $2,
        registration_step = 'completed',
        updated_at = CURRENT_TIMESTAMP

    WHERE user_id = $1
    `,
    [userId, farmType]
  );
}
async function isProfileCompleted(userId) {
  const result = await pool.query(
    `
    SELECT province, farm_type

    FROM user_profile

    WHERE user_id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) return false;

  const user = result.rows[0];

  return !!(user.province && user.farm_type);
}
module.exports = {
    pool,
    dbReady,
    getRecentTransactions,
    getTodaySummary,
    getTodayCategorySummary,
    getDailySummary,
    getMonthlySummary,
    deleteTodayTransactionsByUser,
    canUseAI,
    saveTransaction,
    getUserProfile,
    saveProvince,
    saveFarmType,
    isProfileCompleted,
    getRegistrationStep,
    setRegistrationStep
};
