const { GoogleGenAI } = require("@google/genai");
const {
    getTodaySummary,
    getRecentTransactions,
    getTodayCategorySummary,
    getDailySummary
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

async function buildInsightData(userId) {
    // Migrated: Awaiting previously synchronous functions
    const todaySummary = await getTodaySummary(userId);
    const daily = await getDailySummary(userId, 7);
    const category = await getTodayCategorySummary(userId);
    const recent = await getRecentTransactions(userId, 15);

    return {
        todaySummary,
        daily,
        category,
        recent
    };
}

function hasEnoughData(data) {
    return data.recent && data.recent.length >= 3;
}

function buildPrompt(data) {
    const { todaySummary, daily, category, recent } = data;

    const summaryText = [
        `รายรับวันนี้: ${todaySummary.income || 0} บาท`,
        `รายจ่ายวันนี้: ${todaySummary.expense || 0} บาท`,
        `คงเหลือวันนี้: ${todaySummary.balance || 0} บาท`
    ].join('\n');

    const dailyText = (daily || []).length > 0
        ? daily.map(item =>
            `วันที่ ${item.date} | รายรับ ${item.income || 0} | รายจ่าย ${item.expense || 0} | คงเหลือ ${item.balance || 0}`
        ).join('\n')
        : 'ไม่มีข้อมูล';

    const categoryText = (category || []).length > 0
        ? category.map(item =>
            `หมวด ${item.category || 'อื่นๆ'} | ประเภท ${item.type} | จำนวนรายการ ${item.count || 0} | รวม ${item.total || 0}`
        ).join('\n')
        : 'ไม่มีข้อมูล';

    const recentText = (recent || []).length > 0
        ? recent.map(item =>
            `${item.createdAt} | ${item.type} | ${item.note || '-'} | ${item.category || 'อื่นๆ'} | ${item.amount || 0} บาท`
        ).join('\n')
        : 'ไม่มีข้อมูล';

    return `
คุณคือผู้ช่วยวิเคราะห์การเงินสำหรับเกษตรกรไทย

หน้าที่:
- วิเคราะห์พฤติกรรมรายรับรายจ่ายจากข้อมูลจริง
- สรุปให้เข้าใจง่าย
- ให้คำแนะนำที่ใช้ได้จริง
- ห้ามเดาข้อมูลเกินจากที่มี
- ถ้าข้อมูลยังน้อย ให้พูดอย่างระมัดระวัง
- ใช้ภาษาไทยง่าย ๆ ไม่ทางการเกินไป
- คำตอบต้องสั้น กระชับ และอ่านง่ายใน LINE

ข้อมูลผู้ใช้:

[SUMMARY]
${summaryText}

[DAILY 7 DAYS]
${dailyText}

[CATEGORY TODAY]
${categoryText}

[RECENT TRANSACTIONS]
${recentText}

กรุณาตอบใน format นี้เท่านั้น:

📊 ภาพรวม
- ...
- ...

⚠️ สิ่งที่ควรระวัง
- ...
- ...

💡 คำแนะนำ
1. ...
2. ...
3. ...

เงื่อนไขเพิ่มเติม:
- ถ้าไม่มีประเด็นเตือนจริง ๆ ให้เขียนว่า "- ยังไม่พบจุดน่ากังวลชัดเจน"
- ห้ามตอบยาวเกิน 900 ตัวอักษร
`.trim();
}

async function callGeminiInsight(prompt) {
    const ai = getGeminiClient();

    if (!ai) {
        throw new Error('NO_API_KEY');
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return response.text?.trim() || '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้';
}

async function generateAIInsight(userId) {
    if (!process.env.GEMINI_API_KEY) {
        return '⚠️ ระบบวิเคราะห์ยังไม่พร้อมใช้งานในตอนนี้\nกรุณาลองใหม่ภายหลัง';
    }

    try {
        // Migrated: Awaiting asynchronous composite object generation
        const data = await buildInsightData(userId);

        if (!hasEnoughData(data)) {
            return '📊 ยังมีข้อมูลไม่เพียงพอสำหรับการวิเคราะห์\nลองบันทึกเพิ่มอีกสัก 2-3 รายการแล้วลองใหม่อีกครั้ง';
        }

        const prompt = buildPrompt(data);
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
        
        // Check for common Quota Exceeded conditions (HTTP 429 / RESOURCE_EXHAUSTED)
        if (statusCode === 429 || statusCode === 'RESOURCE_EXHAUSTED' || (error.message && error.message.includes('quota'))) {
            return '⚠️ วันนี้ระบบ AI ถูกใช้งานครบโควตาแล้ว\nกรุณาลองใหม่ภายหลัง';
        }

        // Check for common Authentication conditions (HTTP 401 / 403 / API_KEY_INVALID)
        if (statusCode === 401 || statusCode === 403 || statusCode === 'API_KEY_INVALID' || (error.message && error.message.includes('API key'))) {
            return '⚠️ ระบบ AI ตั้งค่าไม่ถูกต้อง';
        }

        return '⚠️ ตอนนี้ระบบวิเคราะห์ยังไม่พร้อมใช้งาน\nคุณยังสามารถบันทึกข้อมูลและดูสรุปได้ตามปกติ';
    }
}

module.exports = {
    generateAIInsight
};
