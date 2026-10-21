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
4. ห้ามใช้ภาษาอังกฤษในเนื้อหาและหัวข้อย่อย ยกเว้นชื่อเฉพาะหรือชื่อทางการค้า ให้ใช้ภาษาไทยเท่านั้น (เช่น ห้ามใช้คำว่า "Concrete Action", "Key Insight", "Action", "Insight" หรือหัวข้อภาษาอังกฤษอื่น ๆ)

ข้อมูลฟาร์มและบริบทผู้ใช้งาน:
- จังหวัดที่ตั้งฟาร์ม: ${province}
- ประเภทการเกษตร: ${farmType}
(หมายเหตุ: ใช้ข้อมูลทำเลและประเภทเกษตรนี้ในการวิเคราะห์ความเหมาะสมของรายรับรายจ่ายอย่างสมเหตุสมผล หากข้อมูลไม่เพียงพอให้ใช้คำแนะนำแบบมีเงื่อนไข เช่น "หากเป็นช่วงที่ต้องบำรุงพืช..." แทนการฟันธง)

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
(เขียนอธิบายเป็นความเรียง 2–4 ประโยค ชี้ให้เห็นถึงจุดเสี่ยง ความไม่สมดุลของรายจ่าย หรือค่าใช้จ่ายแฝงที่เกิดขึ้นจากข้อมูลวันนี้ หากไม่มีจุดน่ากังวลเลย ให้เขียนอธิบายว่า "วันนี้การบริหารเงินยังคงเป็นไปได้ด้วยดี ไม่พบจุดน่ากังวลชัดเจน")

🌱 คำแนะนำ
(ให้คำแนะนำที่ลึกซึ้ง ปฏิบัติได้จริง และมีประโยชน์ต่อเกษตรกร 3 ข้อ โดยแต่ละข้อต้องเขียนในรูปแบบนี้เท่านั้น)

รูปแบบของแต่ละข้อ (ภาษาไทยล้วน ห้ามใช้หัวข้อย่อยภาษาอังกฤษ):

1. [ชื่อคำแนะนำสั้น ๆ] — [อธิบายเหตุผลว่าทำไมจึงควรทำ] — [บอกวิธีปฏิบัติที่ชัดเจนเป็นรูปธรรม]

2. [ชื่อคำแนะนำสั้น ๆ] — [อธิบายเหตุผล] — [วิธีปฏิบัติ]

3. [ชื่อคำแนะนำสั้น ๆ] — [อธิบายเหตุผล] — [วิธีปฏิบัติ]

---

เป้าหมายความยาว:
เขียนประมาณ 400–600 คำภาษาไทย โดยเน้นเนื้อหาที่มีประโยชน์มากกว่าการยืดข้อความ ทุกหัวข้อต้องมีเนื้อหาครบถ้วน

ข้อกำหนดการจบคำตอบ (สำคัญมากที่สุด):
- เขียนให้จบประโยคและจบหัวข้อทุกส่วน ทั้ง 4 หัวข้อ (ภาพรวม, จุดที่ทำได้ดี, สิ่งที่ควรระวัง, คำแนะนำ)
- คำแนะนำทั้ง 3 ข้อต้องมี "ชื่อคำแนะนำ — เหตุผล — วิธีปฏิบัติ" ครบทุกส่วน
- ห้ามหยุดกลางประโยคหรือกลางคำแนะนำโดยเด็ดขาด
- ห้ามใช้เครื่องหมาย "..." แทนเนื้อหาที่ยังเขียนไม่จบ
- หากเนื้อหายาวเกินไป ให้ย่อแต่ละหัวข้อให้กระชับลง แต่ต้องเขียนให้จบทุกหัวข้อ
- หากข้อมูลมีจำกัด ให้ตอบเท่าที่ข้อมูลรองรับโดยเขียนให้สมบูรณ์
- ห้ามสร้างตัวเลขหรือข้อเท็จจริงเพิ่มเติมเพื่อให้ครบความยาว
`.trim();
}

// =====================
// PUBLIC ENTRY POINT
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

        data.province = province;
        data.farmType = farmType;

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

        if (error.message === 'GEMINI_MAX_RETRIES_EXCEEDED') {
            return '⚠️ ระบบ AI มีผู้ใช้งานจำนวนมากในขณะนี้\nกรุณาลองใหม่อีกครั้งในอีกสักครู่';
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
// GEMINI CALL (UPDATED)
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
                    temperature: 0.6,
                    topP: 0.9,
                    topK: 40,
                    // ⬆️ เดิม 1200 ไม่พอสำหรับคำตอบ 400-600 คำ + โครงสร้าง 4 หัวข้อ + 3 คำแนะนำ
                    // 2500 ให้พื้นที่เพียงพอ ถ้ายังถูกตัดให้เพิ่มเป็น 4000
                    maxOutputTokens: 4000
                }
            });

            const candidate = response.candidates?.[0];
            const finishReason = candidate?.finishReason || null;
            const finishMessage = candidate?.finishMessage || null;
            const text = (response.text || "").trim();

            // Structured diagnostics — no full dump, no secrets
            console.log("[GEMINI_DIAGNOSTICS]", {
                modelVersion: response.modelVersion || null,
                finishReason,
                finishMessage,
                promptTokenCount: response.usageMetadata?.promptTokenCount ?? null,
                candidatesTokenCount: response.usageMetadata?.candidatesTokenCount ?? null,
                totalTokenCount: response.usageMetadata?.totalTokenCount ?? null,
                textLength: text.length
            });

            if (!text) {
                return '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้';
            }

            if (finishReason === "MAX_TOKENS") {
                console.warn("[GEMINI_TRUNCATED] Output token limit reached. Consider increasing maxOutputTokens.");
                // คงคืนข้อความที่ได้เพื่อไม่ให้ผู้ใช้เห็นหน้าว่าง
                return text;
            }

            if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT" || finishReason === "BLOCKLIST") {
                console.warn(`[GEMINI_BLOCKED] finishReason=${finishReason}`);
                return '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง';
            }

            if (finishReason === "RECITATION") {
                console.warn("[GEMINI_RECITATION] Content may contain recited material.");
                return '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง';
            }

            return text;
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

    throw new Error('GEMINI_MAX_RETRIES_EXCEEDED');
}

module.exports = {
    generateAIInsight
};
