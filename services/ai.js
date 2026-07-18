const { GoogleGenAI } = require("@google/genai");
const {
    getTodaySummary,
    getRecentTransactions,
    getUserProfile
} = require('../db/database');

let aiInstance = null;

function getGeminiClient() {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }

    if (!aiInstance) {
        aiInstance = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    }

    return aiInstance;
}

// =====================
// DATE HELPERS (Asia/Bangkok, no DB changes needed)
// =====================
function toBangkokDateString(value) {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function isTodayBangkok(createdAtValue) {
    const itemDate = toBangkokDateString(createdAtValue);
    const todayDate = toBangkokDateString(new Date());

    return itemDate !== null && itemDate === todayDate;
}

function getCreatedAt(item) {
    // Postgres returns lowercase unquoted identifiers (createdat), but stay
    // defensive in case the underlying row shape ever changes.
    return item.createdat || item.createdAt;
}

// =====================
// DATA COLLECTION (today only, minimal fields)
// =====================
async function buildTodayInsightData(userId) {
    const [todaySummary, recent] = await Promise.all([
        getTodaySummary(userId),
        getRecentTransactions(userId, 50)
    ]);

    const todayItems = (recent || []).filter((item) => isTodayBangkok(getCreatedAt(item)));

    const incomeList = todayItems
        .filter((item) => item.type === 'income')
        .map((item) => ({
            note: item.note || 'ไม่ระบุ',
            amount: Number(item.amount) || 0
        }));

    const expenseList = todayItems
        .filter((item) => item.type === 'expense')
        .map((item) => ({
            note: item.note || 'ไม่ระบุ',
            amount: Number(item.amount) || 0
        }));

    return {
        todaySummary,
        incomeList,
        expenseList
    };
}

function isTodayDataEmpty(data) {
    return data.incomeList.length === 0 && data.expenseList.length === 0;
}

// =====================
// PROMPT (minimal payload, strict output contract)
// =====================
function buildPrompt(data) {
    const { todaySummary, incomeList, expenseList } = data;

    const incomeText = incomeList.length > 0
        ? incomeList.map((item) => `- ${item.note} : ${item.amount} บาท`).join('\n')
        : 'ไม่มีรายการ';

    const expenseText = expenseList.length > 0
        ? expenseList.map((item) => `- ${item.note} : ${item.amount} บาท`).join('\n')
        : 'ไม่มีรายการ';

    const totalsText = [
        `รายรับรวม: ${todaySummary.income || 0} บาท`,
        `รายจ่ายรวม: ${todaySummary.expense || 0} บาท`,
        `คงเหลือ: ${todaySummary.balance || 0} บาท`
    ].join('\n');

    return `
คุณคือระบบวิเคราะห์บัญชีฟาร์มสำหรับเกษตรกรไทย

กฎเคร่งครัด:
- วิเคราะห์เฉพาะข้อมูลที่ให้มาด้านล่างเท่านั้น
- ห้ามสมมติหรือแต่งตัวเลขใด ๆ ที่ไม่ได้อยู่ในข้อมูล
- ห้ามเอ่ยถึงคำว่า AI หรือระบุว่าตนเองเป็นปัญญาประดิษฐ์
- ตอบเป็นภาษาไทยเท่านั้น
- ความยาวรวมไม่เกินประมาณ 250 คำ

ข้อมูลวันนี้:

[รายรับวันนี้]
${incomeText}

[รายจ่ายวันนี้]
${expenseText}

[ยอดรวมวันนี้]
${totalsText}

ตอบตาม format นี้เท่านั้น (ห้ามเพิ่มหัวข้ออื่น):

ภาพรวม
- ...

จุดที่ดี
- ...

ข้อควรระวัง
- ...

คำแนะนำ 3 ข้อ
1. ...
2. ...
3. ...
`.trim();
}

// =====================
// GEMINI CALL
// =====================
async function callGeminiInsight(prompt) {
    const ai = getGeminiClient();

    if (!ai) {
        throw new Error('NO_API_KEY');
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const maxRetries = 3;
    const retryDelayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    temperature: 0.4,
                    topP: 0.8,
                    topK: 20,
                    maxOutputTokens: 450
                }
            });

            return response.text?.trim() || '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้';
        } catch (error) {
            const statusCode = error.status || error.code;
            const message = String(error.message || "").toLowerCase();

            const isUnavailable = statusCode === 503 ||
                                  message.includes('unavailable') ||
                                  message.includes('high demand');

            // Retry strategy only on HTTP 503 / Unavailable / High Demand instances
            if (isUnavailable && attempt <= maxRetries) {
                console.warn(`[GEMINI_RETRY] Attempt ${attempt} encountered 503. Retrying in ${retryDelayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                continue;
            }

            // Immediately fail out for 400, 401, 403, 404, 429, or when retries are exhausted
            throw error;
        }
    }
}

// =====================
// PUBLIC ENTRY POINT (unchanged external contract)
// =====================
async function generateAIInsight(userId) {
    if (!process.env.GEMINI_API_KEY) {
        return '⚠️ ระบบวิเคราะห์ยังไม่พร้อมใช้งานในตอนนี้\nกรุณาลองใหม่ภายหลัง';
    }

    try {
        const profile = await getUserProfile(userId);
        const province = profile?.province || "ไม่ระบุจังหวัด";
        const farmType = profile?.farm_type || "ไม่ระบุประเภทเกษตร";

        const data = await buildTodayInsightData(userId);

        if (isTodayDataEmpty(data)) {
            return '📊 วันนี้ยังไม่มีรายการบันทึก\nลองบันทึกรายรับ-รายจ่ายก่อนแล้วลองใหม่อีกครั้ง';
        }

        let prompt = buildPrompt(data);
        prompt = `ข้อมูลผู้ใช้งาน\nจังหวัด\n${province}\nประเภทเกษตร\n${farmType}\n-----------------------------------\n` + prompt;
        return await callGeminiInsight(prompt);
    } catch (error) {
        console.error('❌ Gemini insight error:', {
            status: error.status || null,
            code: error.code || null,
            message: error.message,
            details: error.details || null
        });

        if (error.message === 'NO_API_KEY') {
            return '⚠️ ระบบวิเคราะห์ยังไม่พร้อมใช้งานในตอนนี้\nกรุณาลองใหม่ภายหลัง';
        }

        const statusCode = error.status || error.code;
        const message = String(error.message || "").toLowerCase();

        // Match 503 / Unavailable states
        if (statusCode === 503 || message.includes('unavailable') || message.includes('high demand')) {
            return '⚠️ ระบบ AI มีผู้ใช้งานจำนวนมากในขณะนี้\nกรุณาลองใหมีกครั้งในอีกสักครู่';
        }

        // Match 429 Quota limitations
        if (statusCode === 429 || statusCode === 'RESOURCE_EXHAUSTED' || message.includes('quota')) {
            return '⚠️ วันนี้ระบบ AI ถูกใช้งานครบโควตาแล้ว\nกรุณาลองใหม่ภายหลัง';
        }

        // Match Auth failures
        if (statusCode === 401 || statusCode === 403 || statusCode === 'API_KEY_INVALID' || message.includes('api key')) {
            return '⚠️ ระบบ AI ตั้งค่าไม่ถูกต้อง';
        }

        return '⚠️ ตอนนี้ระบบวิเคราะห์ยังไม่พร้อมใช้งาน\nคุณยังสามารถบันทึกข้อมูลและดูสรุปได้ตามปกติ';
    }
}

// Named export mapping architecture
module.exports = {
    generateAIInsight
};
