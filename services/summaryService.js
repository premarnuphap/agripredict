const { getTodaySummary } = require('../repositories/transactionRepository');

function getTodaySummaryAsync(userId) {
    return Promise.resolve(getTodaySummary(userId));
}

module.exports = { getTodaySummaryAsync };
