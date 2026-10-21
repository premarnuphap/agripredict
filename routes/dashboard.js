const {
    getRecentTransactions,
    getTodayCategorySummary,
    getDailySummary,
    getMonthlySummary,
    deleteTodayTransactionsByUser
} = require('../repositories/transactionRepository');
const { safePush } = require('../utils/lineReply');
const { startTimer } = require('../utils/logger');
const { renderDashboardPage } = require('../views/dashboard');

function requireUserId(res, userId) {
    if (!userId) {
        res.status(400).json({ error: 'Missing userId' });
        return false;
    }
    return true;
}

function sendServerError(res, route, error) {
    console.error(`❌ ${route} error:`, error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
}

function registerDashboardRoutes(app) {
    app.post('/api/reset-today', async (req, res) => {
        try {
            const { userId } = req.body || {};
            if (!requireUserId(res, userId)) return;
            const finish = startTimer('Reset today transactions', { userId });
            const result = deleteTodayTransactionsByUser(userId);
            finish('completed', { deletedCount: result.deletedCount });
            res.json({ ok: true, deletedCount: result.deletedCount });
            await safePush(userId, result.deletedCount > 0
                ? `✅ รีเซ็ตข้อมูลวันนี้เรียบร้อยแล้ว\nลบข้อมูลจำนวน ${result.deletedCount} รายการจาก Dashboard`
                : 'ℹ️ รีเซ็ตข้อมูลวันนี้เรียบร้อยแล้ว\nแต่วันนี้ยังไม่มีข้อมูลให้ลบ');
        } catch (error) { sendServerError(res, '/api/reset-today', error); }
    });

    app.get('/api/recent', (req, res) => {
        try {
            const { userId } = req.query;
            const limit = Number(req.query.limit || 20);
            if (!requireUserId(res, userId)) return;
            const rows = getRecentTransactions(userId, Math.min(Math.max(limit, 1), 100));
            res.json({ ok: true, count: rows.length, items: rows });
        } catch (error) { sendServerError(res, '/api/recent', error); }
    });
    app.get('/api/category-summary', (req, res) => {
        try {
            const { userId } = req.query;
            if (!requireUserId(res, userId)) return;
            const rows = getTodayCategorySummary(userId);
            res.json({ ok: true, count: rows.length, items: rows });
        } catch (error) { sendServerError(res, '/api/category-summary', error); }
    });
    app.get('/api/daily-summary', (req, res) => {
        try {
            const { userId } = req.query;
            const days = Number(req.query.days || 7);
            if (!requireUserId(res, userId)) return;
            const rows = getDailySummary(userId, Math.min(Math.max(days, 1), 90));
            res.json({ ok: true, count: rows.length, items: rows });
        } catch (error) { sendServerError(res, '/api/daily-summary', error); }
    });
    app.get('/api/monthly-summary', (req, res) => {
        try {
            const { userId } = req.query;
            const months = Number(req.query.months || 6);
            if (!requireUserId(res, userId)) return;
            const rows = getMonthlySummary(userId, Math.min(Math.max(months, 1), 24));
            res.json({ ok: true, count: rows.length, items: rows });
        } catch (error) { sendServerError(res, '/api/monthly-summary', error); }
    });

    if (process.env.ENABLE_DEBUG === 'true') {
        const debugEndpoints = [
            ['/debug/recent', query => getRecentTransactions(query.userId, Math.min(Math.max(Number(query.limit || 20), 1), 100))],
            ['/debug/category-summary', query => getTodayCategorySummary(query.userId)],
            ['/debug/daily-summary', query => getDailySummary(query.userId, Math.min(Math.max(Number(query.days || 7), 1), 90))],
            ['/debug/monthly-summary', query => getMonthlySummary(query.userId, Math.min(Math.max(Number(query.months || 6), 1), 24))]
        ];
        debugEndpoints.forEach(([route, getRows]) => app.get(route, (req, res) => {
            try {
                if (!requireUserId(res, req.query.userId)) return;
                const rows = getRows(req.query);
                res.json({ ok: true, count: rows.length, items: rows });
            } catch (error) { sendServerError(res, route, error); }
        }));
    }

    app.get('/dashboard', (req, res) => res.send(renderDashboardPage(process.env.LIFF_ID)));
}

module.exports = { registerDashboardRoutes };
