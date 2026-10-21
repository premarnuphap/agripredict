const { generateAIInsight } = require('../services/aiService');
const { getWelcomeMessage } = require('../services/onboardingService');
const { parseMessage, formatAmount, formatSuccessReply, PARSE_ERROR_MESSAGE } = require('../services/transactionService');
const { saveTransaction } = require('../repositories/transactionRepository');
const { getTodaySummaryAsync } = require('../services/summaryService');
const { safeReply, isLineNetworkTimeout } = require('../utils/lineReply');
const { logStep, startTimer } = require('../utils/logger');

const HELP_MESSAGE = `
📘 วิธีใช้งานแบบสั้น

1️⃣ บันทึกรายการ เช่น
- ซื้อปุ๋ย 500 บาท
- ขายผัก 3000 บาท
- จ้างคนมาทำงาน 800 บาท

2️⃣ ถ้ามีหลายรายการ ส่งหลายบรรทัดได้ เช่น
ซื้อปุ๋ย 500 บาท
ซื้ออาหารไก่ 300 บาท
ขายไข่ 1200 บาท

3️⃣ ดูสรุป
พิมพ์ "สรุป"

4️⃣ เปิด Dashboard
พิมพ์ "แดชบอร์ด"

5️⃣ ขอ AI วิเคราะห์
พิมพ์ "วิเคราะห์"

📌 แนะนำให้พิมพ์ชื่อรายการ + จำนวนเงินให้ชัดเจน
`;

function isHelpCommand(text) { return ['ช่วยเหลือ', 'เมนู', 'help'].includes(text.toLowerCase()); }
function isSummaryCommand(text) { return text.includes('สรุป'); }
function isDashboardCommand(text) { return ['แดชบอร์ด', 'dashboard'].includes(text.toLowerCase()); }
function formatDashboardMessage(userId) { // userId remains unused, matching existing dashboard URL behavior.
    return `📊 เปิด Dashboard:\n${process.env.BASE_URL}/dashboard`;
}
function isAIInsightCommand(text) {
    const t = text.toLowerCase().trim();
    return t === 'วิเคราะห์' || t === 'ขอคำแนะนำ' || t === 'รายจ่ายเป็นยังไงบ้าง' ||
        t === 'ช่วยดูการเงินหน่อย' || t === 'ช่วยดูการเงิน' || t === 'insight';
}

async function handleEvent(event) {
    const finishEvent = startTimer('LINE event processing', { eventType: event.type });
    console.log('[STEP 1] handleEvent started');

    if (event.type === 'follow') {
        const result = await safeReply(event.replyToken, getWelcomeMessage());
        finishEvent('completed', { flow: 'onboarding' });
        return result;
    }

    let userId = null;
    let sourceMessageId = null;
    try {
        if (event.type !== 'message' || event.message.type !== 'text') {
            finishEvent('ignored');
            return null;
        }

        sourceMessageId = event.message.id;
        userId = event.source?.userId;
        const text = event.message.text.trim();

        if (isHelpCommand(text)) {
            const result = await safeReply(event.replyToken, HELP_MESSAGE);
            finishEvent('completed', { flow: 'help' });
            return result;
        }
        if (isDashboardCommand(text)) {
            const result = await safeReply(event.replyToken, formatDashboardMessage(userId));
            finishEvent('completed', { flow: 'dashboard' });
            return result;
        }

        console.log('[INCOMING]', { userId, sourceMessageId, text });
        if (!userId) {
            console.error('❌ Missing userId in event source');
            finishEvent('ignored', { reason: 'missing-user-id' });
            return null;
        }

        const isSummaryRequest = isSummaryCommand(text);
        if (isAIInsightCommand(text)) {
            const finishAI = startTimer('AI insight', { userId });
            let insight;
            try {
                insight = await generateAIInsight(userId);
                finishAI('completed');
            } catch (error) {
                finishAI('failed', { message: error.message });
                throw error;
            }
            const result = await safeReply(event.replyToken, insight);
            finishEvent('completed', { flow: 'ai-insight' });
            return result;
        }

        const finishParse = startTimer('Transaction parsing', { userId, sourceMessageId });
        const parsedList = parseMessage(text);
        finishParse('completed', { transactionCount: parsedList.length });
        console.log('[STEP 2] parsed:', parsedList);
        console.log('[PARSED]', parsedList);

        if (parsedList.length > 0) {
            const finishSave = startTimer('Transaction database save', { userId, transactionCount: parsedList.length });
            try {
                await Promise.all(parsedList.map((tx, index) => saveTransaction(userId, tx, sourceMessageId, index)));
                finishSave('completed');
            } catch (error) {
                finishSave('failed', { message: error.message });
                throw error;
            }
        }
        console.log('[STEP 3] database save completed');
        if (parsedList.length > 0) console.log('[SAVED]', { count: parsedList.length });

        let replyText = '';
        if (parsedList.length === 0) {
            if (!isSummaryRequest) replyText = PARSE_ERROR_MESSAGE;
        } else {
            replyText = formatSuccessReply(parsedList) + '\n\n';
        }

        if (isSummaryRequest) {
            const finishSummary = startTimer('Today summary database query', { userId });
            const summary = await getTodaySummaryAsync(userId);
            finishSummary('completed');
            console.log('[SUMMARY]', summary);
            replyText += `📊 สรุปรายการวันนี้

💰 รายรับทั้งหมด: ${formatAmount(summary.income)} บาท
💸 รายจ่ายทั้งหมด: ${formatAmount(summary.expense)} บาท
📦 คงเหลือ: ${formatAmount(summary.balance)} บาท${summary.balance < 0 ? ' ⚠️' : ''}`;
        }
        if (!replyText.trim()) replyText = PARSE_ERROR_MESSAGE;

        console.log('[STEP 4] sending LINE reply');
        const result = await safeReply(event.replyToken, replyText);
        console.log('[STEP 5] LINE reply completed');
        finishEvent('completed', { flow: isSummaryRequest ? 'summary' : 'transaction', transactionCount: parsedList.length });
        return result;
    } catch (error) {
        console.error('❌ handleEvent error:', error);
        const isDuplicate = error && error.message && error.message.includes('UNIQUE constraint failed');
        if (isDuplicate) {
            console.log('[DUPLICATE]', { userId, sourceMessageId });
            try {
                const result = await safeReply(event.replyToken, '⚠️ ข้อความนี้ถูกบันทึกไปแล้ว');
                finishEvent('completed', { flow: 'duplicate' });
                return result;
            } catch (replyError) {
                console.error('❌ duplicate reply error:', replyError);
                finishEvent('failed', { message: replyError.message });
                return null;
            }
        }
        if (isLineNetworkTimeout(error)) {
            console.error('❌ LINE reply timeout - saved data may already exist');
            finishEvent('failed', { reason: 'line-network-timeout' });
            return null;
        }
        try {
            const result = await safeReply(event.replyToken, '⚠️ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
            finishEvent('failed', { message: error.message });
            return result;
        } catch (replyError) {
            console.error('❌ replyMessage error:', replyError);
            finishEvent('failed', { message: replyError.message });
            return null;
        }
    }
}

module.exports = { handleEvent };
