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
// ============================================================================
// RECOMMENDED GEMINI GENERATION CONFIG VALUES
// ============================================================================
// เพื่อให้ได้คำตอบภาษาไทยที่สละสลวย เป็นธรรมชาติ ลื่นไหล ไม่ตัดแปะเป็นคำสั้นๆ 
// และรองรับความยาว 400-600 คำ (ประมาณ 1 หน้าจอโทรศัพท์มือถือ) ได้อย่างสมบูรณ์:
// - temperature: ขยับขึ้นเป็น 0.6 เพื่อให้ภาษาดูเป็นธรรมชาติและเป็นมนุษย์มากขึ้น แต่ไม่สูงเกินไปจนผิดเพี้ยน
// - topP: 0.9 และ topK: 40 เพื่อให้การเลือกสรรคำภาษาไทยมีความหลากหลายและต่อเนื่อง
// - maxOutputTokens: ขยายเป็น 1200 เพื่อรองรับเนื้อหาที่ละเอียดและมีคุณภาพตามที่คาดหวัง
// ============================================================================

// =====================
// PROMPT ENGINEERING & CONSTRUCTION
// =====================

function buildPrompt(data) {
    const { todaySummary, incomeList, expenseList, province, farmType } = data;

    const incomeText = incomeList.length > 0
        ? incomeList.map((item) => `- ${item.note} : ${item.amount} บาท`).join('\n')
        : 'ไม่มีรายการ';

    const expenseText = expenseList.length > 0
        ? expenseList.map((item) => `- ${item.note} : ${item.amount} บาท`).join('\n')
        : 'ไม่มีรายการ';

    const totalsText = [
        `รายรับรวมวันนี้: ${todaySummary.income || 0} บาท`,
        `รายจ่ายรวมวันนี้: ${todaySummary.expense || 0} บาท`,
        `ยอดเงินคงเหลือสุทธิวันนี้: ${todaySummary.balance || 0} บาท`
    ].join('\n');

    return `
คุณคือ "ที่ปรึกษาอาวุโสด้านการเงินและการจัดการฟาร์มเกษตรในประเทศไทย" ผู้มีความเชี่ยวชาญ คลุกคลีกับวิถีชีวิตเกษตรกรไทยมาอย่างยาวนาน มีบุคลิกเป็นมิตร อบอุ่น สุภาพ และน่าเชื่อถือ 

บทบาทของคุณ:
ทำหน้าที่วิเคราะห์ข้อมูลบัญชีรายวันของเกษตรกรอย่างรอบด้าน เพื่อช่วยให้พวกเขามองเห็นภาพรวมพฤติกรรมการใช้เงิน จุดแข็งที่ทำได้ดี ความเสี่ยงที่ต้องเฝ้าระวัง และแนวทางการพัฒนาฟาร์มให้ยั่งยืน โดยใช้ภาษาที่เข้าใจง่าย เป็นธรรมชาติ เป็นกันเองแบบมืออาชีพ แต่ไม่ใช้ศัพท์ทางเทคนิคที่เข้าใจยาก และไม่พูดจาเหมือนหุ่นยนต์

กฎเหล็กเคร่งครัดด้านเนื้อหา:
1. วิเคราะห์จาก "ข้อมูลจริงที่ให้มาด้านล่างนี้เท่านั้น" ห้ามคิดแทน ห้ามเดา ห้ามสมมติ หรือแต่งตัวเลขใด ๆ เพิ่มเติมเด็ดขาด
2. ห้ามพูดคำว่า "AI", "ปัญญาประดิษฐ์", "โมเดลภาษา", "ระบบ", "Prompt" หรือทำตัวเป็นโปรแกรมคอมพิวเตอร์ ให้พูดในฐานะที่ปรึกษาที่เป็นมนุษย์คนหนึ่งเท่านั้น
3. ห้ามแต่งเรื่องราวนอกเหนือข้อมูล เช่น สภาพอากาศในพื้นที่ ราคาตลาด ณ วันนี้ หรือโรคระบาดในพืช/สัตว์ ยกเว้นกรณีที่ผู้ใช้ระบุไว้ในบันทึก (Note) เท่านั้น

ข้อมูลฟาร์มและบริบทผู้ใช้งาน:
- จังหวัดที่ตั้งฟาร์ม: ${province}
- ประเภทการเกษตร: ${farmType}
(หมายเหตุ: ใช้ข้อมูลทำเลและประเภทเกษตรนี้ในการวิเคราะห์ความเหมาะสมของรายรับรายจ่ายอย่างสมเหตุสมผล)

ข้อมูลธุรกรรมประจำวันนี้:
[รายรับวันนี้]
${incomeText}

[รายจ่ายวันนี้]
${expenseText}

[ยอดรวมบัญชีวันนี้]
${totalsText}

---

ข้อกำหนดในการเขียนคำตอบ (กรุณาตอบตามโครงสร้างและหัวข้อต่อไปนี้เท่านั้น ห้ามเพิ่มหัวข้ออื่นเด็ดขาด):

📊 ภาพรวม
(เขียนอธิบายเป็นความเรียง 3–5 ประโยค ให้เห็นภาพรวมของเม็ดเงินในวันนี้อย่างเป็นธรรมชาติ วิเคราะห์สัดส่วนรายรับและรายจ่ายที่เกิดขึ้นสัมพันธ์กับพื้นที่และประเภทฟาร์มของผู้ใช้)

✅ จุดที่ทำได้ดี
(เขียนอธิบายเป็นความเรียง 2–4 ประโยค เจาะลึกพฤติกรรมการเงินในแง่บวกของวันนี้ เช่น การสร้างรายได้ การควบคุมต้นทุน หรือบันทึกที่มีประโยชน์)

⚠️ สิ่งที่ควรระวัง
(เขียนอธิบายเป็นความเรียง 2–4 ประโยค ชี้ให้เห็นถึงจุดเสี่ยง ความไม่สมดุลของรายจ่าย หรือค่าใช้จ่ายแฝงที่เกิดขึ้นจากข้อมูลวันนี้ หากไม่มีจุดน่ากังวลเลย ให้เขียนอธิบายว่า "- วันนี้การบริหารเงินยังคงเป็นไปได้ด้วยดี ไม่พบจุดน่ากังวลชัดเจน")

🌱 คำแนะนำ
(ให้คำแนะนำที่ลึกซึ้ง ปฏิบัติได้จริง และมีประโยชน์ต่อเกษตรกรอย่างน้อย 3 ข้อ โดยแต่ละข้อต้องประกอบด้วย "หัวข้อแนะนำ - อธิบายเหตุผลความสำคัญ - แนวทางปฏิบัติเชิงรูปธรรม")
1. ...
2. ...
3. ...

---
เป้าหมายความยาว: เขียนอธิบายให้ได้เนื้อหาที่สมบูรณ์ ครบถ้วน ได้ความยาวรวมประมาณ เพื่อความละเอียดและเป็นประโยชน์สูงสุดแก่เกษตรกร
`.trim();
}

// =====================
// PUBLIC ENTRY POINT (UPDATED PROMPT CONSTRUCTION)
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

        // ปรับปรุงการส่งต่อข้อมูลโปรไฟล์ฟาร์มเข้าไปใน data object เพื่อส่งให้ buildPrompt() ประมวลผลอย่างเป็นระบบ
        data.province = province;
        data.farmType = farmType;

        const prompt = buildPrompt(data);
        
        // ส่ง prompt ไปยังโมเดล Gemini โดยใช้ข้อกำหนด Config ที่เหมาะสมที่สุดสำหรับคำตอบภาษาไทยที่เป็นธรรมชาติ
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

        if (statusCode === 503 || message.includes('unavailable') || message.includes('high demand')) {
            return '⚠️ ระบบ AI มีผู้ใช้งานจำนวนมากในขณะนี้\nกรุณาลองใหม่อีกครั้งในอีกสักครู่';
        }

        if (statusCode === 429 || statusCode === 'RESOURCE_EXHAUSTED' || message.includes('quota')) {
            return '⚠️ วันนี้ระบบ AI ถูกใช้งานครบโควตาแล้ว\nกรุณาลองใหม่ภายหลัง';
        }

        if (statusCode === 401 || statusCode === 403 || statusCode === 'API_KEY_INVALID' || message.includes('api key')) {
            return '⚠️ ระบบ AI ตั้งค่าไม่ถูกต้อง';
        }

        return '⚠️ ตอนนี้ระบบวิเคราะห์ยังไม่พร้อมใช้งาน\nคุณยังสามารถบันทึกข้อมูลและดูสรุปได้ตามปกติ';
    }
}

// =====================
// GEMINI CALL (SHOWING THE IMPLEMENTATION WITH PREFERRED CONFIG FOR INTEGRATION)
// =====================
async function callGeminiInsight(prompt) {
    const ai = getGeminiClient();

    if (!ai) {
        throw new Error('NO_API_KEY');
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const maxRetries = 3;
    const retryDelayMs = 2000;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    temperature: 0.6,          // ปรับปรุงค่าตามคำแนะนำเพื่อให้ได้เนื้อหาเป็นธรรมชาติมากขึ้น
                    topP: 0.9,                 // ปรับปรุงค่าตามคำแนะนำเพื่อลดการทับศัพท์และประโยคหุ่นยนต์
                    topK: 40,                  // ปรับปรุงค่าตามคำแนะนำเพื่อให้กระจายคำภาษาไทยได้สมดุล
                    maxOutputTokens: 1200      // ขยายขนาด Tokens เพื่อให้ได้ความยาว 400-600 คำอย่างสมบูรณ์
                }
            });

            console.log("========== GEMINI RESPONSE ==========");
            console.dir(response, { depth: null });
            
            console.log("========== RESPONSE.TEXT ==========");
            console.log(response.text);
            
            console.log("========== LENGTH ==========");
            console.log(response.text?.length);
            
            return response.text?.trim() || '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้';
        } catch (error) {
            const statusCode = error.status || error.code;
            const message = String(error.message || "").toLowerCase();

            const isUnavailable = statusCode === 503 ||
                                  message.includes('unavailable') ||
                                  message.includes('high demand');

            if (isUnavailable && attempt <= maxRetries) {
                console.warn(`[GEMINI_RETRY] Attempt ${attempt} encountered 503. Retrying in ${retryDelayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                continue;
            }

            throw error;
        }
    }
}

// Named export mapping architecture
module.exports = {
    generateAIInsight
};
