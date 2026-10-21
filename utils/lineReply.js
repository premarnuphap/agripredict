const { client } = require('../config/line');
const { startTimer } = require('./logger');

async function safeReply(replyToken, text) {
    const finish = startTimer('LINE reply', { replyTokenPresent: Boolean(replyToken) });
    try {
        const result = await client.replyMessage(replyToken, { type: 'text', text });
        finish('completed');
        return result;
    } catch (error) {
        finish('failed', { code: error.code, message: error.message });
        throw error;
    }
}

async function safePush(userId, text) {
    if (!userId || !text) return;
    const finish = startTimer('LINE push', { userId });
    try {
        await client.pushMessage(userId, { type: 'text', text });
        finish('completed');
    } catch (error) {
        finish('failed', { code: error.code, message: error.message });
        console.error('❌ pushMessage error:', error);
    }
}

function isLineNetworkTimeout(error) {
    return error && (
        error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ECONNABORTED' ||
        (error.message && error.message.includes('ETIMEDOUT'))
    );
}

module.exports = { safeReply, safePush, isLineNetworkTimeout };
