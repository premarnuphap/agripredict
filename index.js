require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const {
    pool,
    dbReady,
    getTodaySummary,
    getRecentTransactions,
    getTodayCategorySummary,
    getDailySummary,
    getMonthlySummary,
    deleteTodayTransactionsByUser,
    canUseAI,
    getUserProfile,
    isProfileCompleted,
    saveProvince,
    saveFarmType,
    saveTransaction
} = require('./db/database');
const { generateAIInsight } = require('./services/ai');

// =====================
// SYSTEM MESSAGES
// =====================
const WELCOME_MESSAGE = `
🌾 ยินดีต้อนรับสู่ผู้ช่วยจัดการบัญชีเกษตร

ช่วยให้คุณบันทึกรายรับ-รายจ่ายได้ง่าย พร้อมสรุปข้อมูลและวิเคราะห์ต้นทุนด้วย AI

━━━━━━━━━━━━━━━━━━

✨ สิ่งที่ระบบช่วยได้

💰 บันทึกรายรับ-รายจ่าย
📊 สรุปยอดประจำวัน
📈 เปิด Dashboard ดูภาพรวม
🤖 วิเคราะห์ข้อมูลด้วย AI ตามข้อมูลฟาร์มของคุณ

━━━━━━━━━━━━━━━━━━

📍 ก่อนเริ่มใช้งาน
กรุณาเลือก "จังหวัด" และ "ประเภทการเกษตร"

เพื่อให้ AI สามารถวิเคราะห์และให้คำแนะนำได้เหมาะสมกับพื้นที่ของคุณ

หลังจากลงทะเบียนเรียบร้อยแล้ว
คุณสามารถเริ่มบันทึกรายการได้ทันที 🌱
`;

const HELP_MESSAGE = `
📖 วิธีใช้งาน

🌱 บันทึกรายรับหรือรายจ่าย
พิมพ์ข้อความตามปกติ เช่น

ซื้อปุ๋ย 500 บาท
ซื้ออาหารสัตว์ 1,200 บาท
ขายข้าว 8,500 บาท
ขายยางพารา 12,000 บาท

━━━━━━━━━━━━━━━━━━

📊 ดูสรุปประจำวัน
พิมพ์

สรุป

━━━━━━━━━━━━━━━━━━

📈 เปิด Dashboard
พิมพ์

แดชบอร์ด

━━━━━━━━━━━━━━━━━━

🤖 ขอคำแนะนำจาก AI
พิมพ์

วิเคราะห์

AI จะวิเคราะห์จาก

📍 จังหวัด
🌾 ประเภทการเกษตร
💰 รายรับ-รายจ่ายของวันนี้

เพื่อช่วยให้คุณเห็นภาพต้นทุนและการเงินได้ชัดเจนยิ่งขึ้น

━━━━━━━━━━━━━━━━━━

❓ หากต้องการดูคู่มือนี้อีกครั้ง

พิมพ์

ช่วยเหลือ
`;

const PARSE_ERROR_MESSAGE = `
❌ ระบบไม่สามารถบันทึกรายการได้

กรุณาระบุชื่อรายการและจำนวนเงินให้ชัดเจน เช่น

✅ ซื้อปุ๋ย 500 บาท
✅ ซื้อเมล็ดพันธุ์ 850 บาท
✅ ขายข้าว 3,500 บาท

━━━━━━━━━━━━━━━━━━

💡 คำแนะนำ

ระบุจำนวนเงินเป็น "บาท"
ใส่ชื่อรายการให้ชัดเจน

ตัวอย่าง

ซื้อปุ๋ย 500 บาท
ขายข้าว 3000 บาท
จ้างแรงงาน 800 บาท
`;

// =====================
// COMMAND HELPERS
// =====================
function isHelpCommand(text) {
    return ['ช่วยเหลือ', 'เมนู', 'help'].includes(text.toLowerCase());
}

function isSummaryCommand(text) {
    return text.includes('สรุป');
}

function isDashboardCommand(text) {
    return ['แดชบอร์ด', 'dashboard'].includes(text.toLowerCase());
}

function getDashboardUrl(userId) {
    return `${process.env.BASE_URL}/dashboard`;
}

function formatDashboardMessage(userId) {
    const url = getDashboardUrl(userId);
    return `📊 เปิด Dashboard:\n${url}`;
}

function isAIInsightCommand(text) {
    const t = text.toLowerCase().trim();
    return (
        t === 'วิเคราะห์' ||
        t === 'ขอคำแนะนำ' ||
        t === 'รายจ่ายเป็นยังไงบ้าง' ||
        t === 'ช่วยดูการเงินหน่อย' ||
        t === 'ช่วยดูการเงิน' ||
        t === 'insight'
    );
}

const { renderDashboardPage } = require('./views/dashboard');

const app = express();
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    httpConfig: {
        timeout: 10000 // 10 วินาที
    }
};

if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.error('❌ Missing LINE env variables');
    process.exit(1);
}

// =====================
// ONBOARDING (PROVINCE / FARM TYPE)
// =====================
const PROVINCE_OPTIONS = [
    'ตราด', 'จันทบุรี', 'ชลบุรี', 'ระยอง'
];

const FARM_TYPE_OPTIONS = [
    { label: '🌾 พืชไร่', value: 'พืชไร่' },
    { label: '🍊 พืชสวน', value: 'พืชสวน' },
    { label: '🌱 พืชผัก', value: 'พืชผัก' },
    { label: '🐟 ประมง', value: 'ประมง' },
    { label: '🐄 โค-กระบือ', value: 'ปศุสัตว์สัตว์ใหญ่' },
    { label: '🐖 สุกร', value: 'สุกร' },
    { label: '🐔 สัตว์ปีก', value: 'สัตว์ปีก' },
    { label: '🦗 แมลงเศรษฐกิจ', value: 'แมลงเศรษฐกิจ' },
    { label: '🏡 เกษตรผสมผสาน', value: 'เกษตรผสมผสาน' }
];

function buildQuickReplyItems(labels) {
    return labels.map((label) => ({
        type: 'action',
        action: {
            type: 'message',
            label: label.length > 20 ? label.slice(0, 20) : label,
            text: label
        }
    }));
}

async function sendProvinceQuickReply(replyToken) {
    return client.replyMessage(replyToken, {
        type: 'text',
        text: '📍 กรุณาเลือกจังหวัดของคุณ',
        quickReply: {
            items: buildQuickReplyItems(PROVINCE_OPTIONS)
        }
    });
}

async function sendFarmTypeQuickReply(replyToken) {
    return client.replyMessage(replyToken, {
        type: 'text',
        text: '🌱 กรุณาเลือกประเภทฟาร์มของคุณ',
        quickReply: {
            items: buildQuickReplyItems(FARM_TYPE_OPTIONS.map((item) => item.label))
        }
    });
}

function matchProvince(text) {
    const input = String(text || '').trim();
    return PROVINCE_OPTIONS.find((province) => province === input) || null;
}

function matchFarmType(text) {
    const input = String(text || '').trim();
    const found = FARM_TYPE_OPTIONS.find((item) => item.label === input || item.value === input);
    return found ? found.value : null;
}

/**
 * Handles a text message during onboarding (province/farm type selection).
 * Returns true if the message was consumed as an onboarding step
 * (caller should stop processing further), false if profile is complete
 * (caller should proceed with normal accounting flow).
 */
async function handleOnboardingStep(event, userId, text) {
    const profile = await getUserProfile(userId);

    const hasProvince = !!(profile && profile.province);
    const hasFarmType = !!(profile && profile.farm_type);

    if (hasProvince && hasFarmType) {
        return false; // profile already complete, not an onboarding turn
    }

    if (!hasProvince) {
        const province = matchProvince(text);

        if (!province) {
            await sendProvinceQuickReply(event.replyToken);
            return true;
        }

        await saveProvince(userId, province);
        await sendFarmTypeQuickReply(event.replyToken);
        return true;
    }

    if (!hasFarmType) {
        const farmType = matchFarmType(text);

        if (!farmType) {
            await sendFarmTypeQuickReply(event.replyToken);
            return true;
        }

        await saveFarmType(userId, farmType);
        await safeReply(event.replyToken, 'ลงทะเบียนเรียบร้อยแล้ว');
        return true;
    }

    return false;
}

const client = new line.Client(config);
const PORT = process.env.PORT || 3000;

// =====================
// CATEGORY MAP
// =====================
const CATEGORY_RULES = [
    {
        name: 'ต้นทุนผันแปร',
        priority: 1,
        triggers: ['ซื้อ', 'เติม', 'ใส่', 'ใช้', 'ลง', 'ทำ', 'เอาเข้า', 'ใช้ไป', 'หมดไป'],
        keywords: [
            'เมล็ด', 'เมล็ดพันธุ์', 'เมล็ดผัก', 'เมล็ดข้าว',
            'พันธุ์', 'พันธุ์พืช', 'พันธุ์สัตว์',
            'กล้า', 'ต้นกล้า', 'เพาะกล้า', 'ถาดเพาะ',
            'ลูกไก่', 'ลูกเป็ด', 'ลูกหมู', 'ลูกปลา', 'ลูกกุ้ง',
            'แม่พันธุ์', 'พ่อพันธุ์',
            'ปุ๋ย', 'ปุย', 'ปุ๋ยเคมี', 'ปุ๋ยคอก', 'ปุ๋ยอินทรีย์', 'ปุ๋ยหมัก',
            'ยูเรีย', '151515', '161616', '4600',
            'โดโลไมท์', 'ปูนขาว', 'ยิปซัม',
            'ขี้วัว', 'ขี้ไก่', 'ขี้หมู', 'มูลสัตว์',
            'แกลบ', 'แกลบดิบ', 'แกลบเผา', 'ฟาง', 'ขุยมะพร้าว',
            'ดิน', 'ดินปลูก', 'ปรับดิน', 'บำรุงดิน',
            'ยา', 'ยาแมลง', 'ยาหญ้า', 'ยาหนอน', 'ยาเชื้อ',
            'ยาฆ่าแมลง', 'ยาฆ่าหญ้า', 'ยาฆ่าเชื้อ',
            'พ่นยา', 'ฉีดยา',
            'สารเคมี', 'เคมี', 'ฮอร์โมน',
            'วัคซีน', 'ยาฉีด', 'เวชภัณฑ์',
            'ยาปฏิชีวนะ', 'ยาบำรุง', 'วิตามิน',
            'อาหารสัตว์', 'อาหารไก่', 'อาหารหมู', 'อาหารปลา', 'อาหารกุ้ง',
            'อาหารเม็ด', 'อาหารผง', 'อาหารข้น',
            'รำ', 'รำละเอียด', 'รำหยาบ',
            'ปลายข้าว', 'ข้าวโพด', 'กากถั่ว', 'กากมัน',
            'หัวอาหาร', 'อาหารสำเร็จรูป',
            'น้ำ', 'น้ำประปา', 'เติมน้ำ', 'สูบน้ำ', 'รดน้ำ',
            'ไฟ', 'ไฟฟ้า',
            'ปั๊ม', 'ปั๊มน้ำ', 'เครื่องสูบ',
            'น้ำมัน', 'เติมน้ำมัน', 'น้ำมันเครื่อง', 'น้ำมันดีเซล', 'เบนซิน',
            'น้ำมันเครื่องสูบ', 'น้ำมันรถไถ', 'น้ำมันเครื่องตัดหญ้า',
            'ขี้เลื่อย', 'รองพื้นคอก', 'แกลบรองพื้น',
            'ถุงอาหาร', 'ถุงปุ๋ย', 'เชือก', 'พลาสติกคลุมดิน'
        ],
        patterns: [
            /ซื้อ.*(เมล็ด|พันธุ์|ปุ๋ย|ยา|อาหาร|น้ำมัน)/,
            /เติม.*(น้ำ|น้ำมัน|อาหาร)/,
            /ใส่.*(ปุ๋ย|ยา)/,
            /(พ่น|ฉีด).*(ยา|เคมี)/,
            /ให้.*อาหาร/
        ]
    },
    {
        name: 'ค่าแรง',
        priority: 2,
        triggers: ['จ้าง', 'ใช้แรง', 'ให้คน', 'ทำ'],
        keywords: [
            'จ้าง', 'จ้างคน', 'จ้างแรงงาน', 'แรงงาน', 'คนงาน', 'ลูกน้อง',
            'ทำเอง', 'เจ้าของทำ', 'แรงตัวเอง',
            'รายวัน', 'รายชั่วโมง', 'เหมา',
            'จ้างปลูก', 'จ้างหว่าน', 'จ้างเกี่ยว', 'จ้างเก็บ',
            'จ้างจับหมู', 'จ้างจับไก่',
            'จ้างฉีด', 'จ้างพ่น',
            'ตัดหญ้า', 'ถอนหญ้า', 'ขุดดิน',
            'ล้างคอก', 'ทำความสะอาด'
        ],
        patterns: [
            /จ้าง.*/,
            /(ตัด|ถอน|ขุด|ล้าง|เก็บ).*(คน|จ้าง)/,
            /ทำเอง/
        ]
    },
    {
        name: 'ค่าซ่อม / บำรุงรักษา',
        priority: 3,
        triggers: ['ซ่อม', 'บำรุง', 'เปลี่ยน', 'แก้', 'ล้าง'],
        keywords: [
            'ซ่อม', 'ซ่อมแซม', 'ค่าซ่อม',
            'บำรุง', 'บำรุงรักษา',
            'อะไหล่', 'เปลี่ยนอะไหล่',
            'เครื่อง', 'เครื่องมือ', 'เครื่องสูบ', 'เครื่องตัดหญ้า',
            'รถไถ', 'รถ', 'ปั๊ม', 'ปั๊มน้ำ',
            'ท่อ', 'ระบบน้ำ', 'ระบบไฟ',
            'เครื่องหยอด', 'เครื่องหยอดข้าวโพด',
            'ล้างเครื่อง', 'ล้างปั๊ม'
        ],
        patterns: [
            /(ซ่อม|ซ่อมแซม).*/,
            /(บำรุง|บำรุงรักษา).*/,
            /ค่า(ซ่อม|เปลี่ยนอะไหล่).*/,
            /(เปลี่ยนอะไหล่|เปลี่ยนยาง|เปลี่ยนน้ำมันเครื่อง).*/
        ]
    },
    {
        name: 'ต้นทุนคงที่',
        priority: 3,
        triggers: ['ซื้อ', 'ลงทุน', 'สร้าง', 'ทำ', 'ติดตั้ง'],
        keywords: [
            'เครื่อง', 'เครื่องมือ', 'อุปกรณ์',
            'เครื่องพ่น', 'เครื่องตัดหญ้า', 'เครื่องสูบ', 'เครื่องไถ',
            'เครื่องบด', 'เครื่องผสมอาหาร',
            'รถไถ', 'รถเกี่ยว',
            'คอก', 'กรง', 'เล้าไก่', 'โรงเรือน',
            'โรงเรือนหมู', 'โรงเรือนไก่',
            'แทงค์น้ำ', 'ถังน้ำใหญ่',
            'ระบบน้ำ', 'ระบบไฟ',
            'ท่อ', 'สปริงเกอร์', 'น้ำหยด',
            'ติดตั้ง', 'ต่อเติม', 'ทำหลังคา', 'ทำพื้น'
        ],
        patterns: [
            /ซื้อ.*(เครื่อง|อุปกรณ์|รถ|คอก|โรงเรือน)/,
            /สร้าง.*(คอก|เล้า|โรงเรือน)/,
            /ติดตั้ง.*ระบบ/
        ]
    },
    {
        name: 'ค่าใช้จ่ายทั่วไป',
        priority: 4,
        triggers: ['ใช้', 'จ่าย', 'ทั่วไป', 'เบ็ดเตล็ด'],
        keywords: [
            'โทร', 'โทรศัพท์', 'เติมเงิน',
            'เน็ต', 'อินเทอร์เน็ต',
            'เดินทาง', 'ใช้รถ',
            'กิน', 'อาหารคน',
            'ของใช้', 'ของจุกจิก',
            'ขน', 'ขนส่ง', 'ส่งของ',
            'รถขน', 'รถบรรทุก',
            'ตลาด', 'แผง', 'เช่าที่', 'เช่าร้าน',
            'แพ็ค', 'บรรจุ', 'ถุง', 'กล่อง', 'ลัง',
            'โพสต์ขาย', 'โปรโมท', 'โฆษณา'
        ],
        patterns: [
            /(ส่ง|ขน).*(ของ)/,
            /(แพ็ค|บรรจุ).*(ของ)/,
            /(โพสต์|โปรโมท)/
        ]
    },
    {
        name: 'การเงิน / หนี้',
        priority: 5,
        triggers: ['กู้', 'ยืม', 'จ่าย', 'ผ่อน', 'คืน', 'โอน'],
        keywords: [
            'กู้', 'กู้เงิน', 'เงินกู้', 'ยืมเงิน',
            'ธนาคาร', 'ธกส', 'แบงค์',
            'จ่ายหนี้', 'ใช้หนี้', 'คืนหนี้', 'ปิดหนี้',
            'ผ่อน', 'งวด',
            'ดอก', 'ดอกเบี้ย',
            'เงินต้น',
            'ค่าปรับ', 'ค่าธรรมเนียม',
            'โอนเงิน', 'ส่งเงิน',
            'หนี้นอก', 'ดอกนอก'
        ],
        patterns: [
            /กู้.*/,
            /ผ่อน.*/,
            /จ่าย.*(หนี้|งวด|ดอก)/,
            /โอน.*เงิน/
        ]
    }
];

// =====================
// WEBHOOK — FIX #1: await งานทั้งหมดให้เสร็จก่อนตอบ 200
// =====================
app.post('/webhook', line.middleware(config), async (req, res) => {
    const events = req.body.events || [];

    try {
        await Promise.all(
            events.map(async (event) => {
                try {
                    await handleEvent(event);
                } catch (eventError) {
                    console.error('[EVENT_ERROR]', {
                        type: event?.type,
                        messageId: event?.message?.id,
                        message: eventError?.message,
                        stack: eventError?.stack
                    });
                }
            })
        );

        return res.status(200).end();
    } catch (error) {
        console.error('[WEBHOOK_ERROR]', error);
        return res.status(500).end();
    }
});

app.use(express.json());

// =====================
// RESET — FIX #3: ส่ง push ก่อน แล้วค่อยตอบ JSON
// =====================
app.post('/api/reset-today', async (req, res) => {
    try {
        const { userId } = req.body || {};

        if (!requireUserId(res, userId)) return;

        const result = await deleteTodayTransactionsByUser(userId);

        if (result.deletedCount > 0) {
            await safePush(
                userId,
                `✅ รีเซ็ตข้อมูลวันนี้เรียบร้อยแล้ว\nลบข้อมูลจำนวน ${result.deletedCount} รายการจาก Dashboard`
            );
        } else {
            await safePush(
                userId,
                'ℹ️ รีเซ็ตข้อมูลวันนี้เรียบร้อยแล้ว\nแต่วันนี้ยังไม่มีข้อมูลให้ลบ'
            );
        }

        res.json({
            ok: true,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('❌ /api/reset-today error:', error);
        res.status(500).json({
            ok: false,
            error: 'Internal server error'
        });
    }
});

// =====================
// CLASSIFY CATEGORY
// =====================
function classifyCategoryOverride(text) {
    const input = String(text || '').trim().toLowerCase();

    if (!input) return null;

    if (
        /(จ้าง|ค่าจ้าง|ค่าแรง|แรงงาน|คนงาน|ลูกน้อง)/.test(input) &&
        !/(ขาย|รับเงิน|ได้เงิน)/.test(input)
    ) {
        return 'ค่าแรง';
    }

    if (
        /(ซ่อม|ซ่อมแซม|ค่าซ่อม|บำรุง|บำรุงรักษา|อะไหล่|เปลี่ยนอะไหล่|repair)/.test(input)
    ) {
        return 'ค่าซ่อม / บำรุงรักษา';
    }

    return null;
}

function classifyCategory(text) {
    const input = String(text || '').trim().toLowerCase();

    if (!input) return 'อื่นๆ';

    const overrideCategory = classifyCategoryOverride(input);
    if (overrideCategory) {
        return overrideCategory;
    }

    for (const rule of CATEGORY_RULES) {
        const matchedPattern = (rule.patterns || []).some((pattern) => pattern.test(input));
        if (matchedPattern) {
            return rule.name;
        }
    }

    for (const rule of CATEGORY_RULES) {
        const hasTrigger = (rule.triggers || []).some((trigger) => input.includes(trigger));
        const hasKeyword = (rule.keywords || []).some((keyword) => input.includes(keyword));

        if (hasTrigger && hasKeyword) {
            return rule.name;
        }
    }

    for (const rule of CATEGORY_RULES) {
        const hasKeyword = (rule.keywords || []).some((keyword) => input.includes(keyword));
        if (hasKeyword) {
            return rule.name;
        }
    }

    return 'อื่นๆ';
}

// =====================
// PARSE MESSAGE HELPERS
// =====================
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/บาทถ้วน/g, ' บาท')
        .replace(/บาท/g, ' บาท ')
        .replace(/,\s*/g, ',')
        .trim();
}

function detectType(text) {
    const input = String(text || '').trim().toLowerCase();

    if (!input) return null;

    if (/(ขาย|รายรับ|รับมา|ได้เงิน|ได้มา|โอนเข้า|เงินเข้า|รับเงิน)/.test(input)) {
        return 'income';
    }

    if (/(ซื้อ|รายจ่าย|จ่าย|ค่า|ค่าส่ง|โอนออก|เสีย|หมดไป|ผ่อน|ชำระ|ซ่อม|บำรุง|เปลี่ยนอะไหล่)/.test(input)) {
        return 'expense';
    }

    return null;
}

function cleanItemText(text) {
    return String(text || '')
        .replace(/(รายรับ|รายจ่าย|บาทถ้วน|บาท|แล้ว|และ|กับ|จากนั้น|เอาไป|ได้เงิน|ได้มา|รับมา)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const NON_MONEY_UNITS = [
    'กิโล', 'กก', 'ก.ก.', 'กิโลกรัม', 'โล',
    'ตัว', 'ชิ้น', 'ถุง', 'ลัง', 'ฟอง', 'แพ็ค', 'แพก',
    'ไร่', 'งาน', 'เมตร', 'ม.', 'ลิตร', 'ตัน', 'กระสอบ',
    'ใบ', 'ขวด', 'กล่อง', 'ชุด', 'คัน', 'เครื่อง'
];

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isQuantityUnitAfterNumber(text, amountEnd) {
    const tail = text.slice(amountEnd, amountEnd + 20).trim();

    return NON_MONEY_UNITS.some((unit) => {
        const re = new RegExp(`^${escapeRegex(unit)}(?:\\b|\\s|$)`);
        return re.test(tail);
    });
}

function scoreAmountCandidate(fullText, amountStart, amountEnd, amount) {
    let score = 0;

    const left = fullText.slice(Math.max(0, amountStart - 30), amountStart);
    const right = fullText.slice(amountEnd, Math.min(fullText.length, amountEnd + 30));
    const around = `${left} ${right}`;

    if (/^(\s*)บาท\b/.test(right)) score += 100;
    if (/(ได้เงิน|ได้มา|รับมา|รับเงิน|ขาย)/.test(left)) score += 40;
    if (/(ซื้อ|จ่าย|ค่าส่ง|ค่า|ผ่อน|ชำระ|เติม)/.test(left)) score += 25;

    if (isQuantityUnitAfterNumber(fullText, amountEnd)) score -= 120;

    if (amount < 1000 && !/บาท/.test(around) && !/(ได้เงิน|ได้มา|รับมา|รับเงิน|ขาย|ซื้อ|จ่าย|ค่า|เติม|ผ่อน)/.test(left)) {
        score -= 20;
    }

    return score;
}

function findBestAmountMatch(text) {
    const amountRegex = /(\d[\d,]*(?:\.\d+)?)/g;
    const matches = [...text.matchAll(amountRegex)];

    if (matches.length === 0) return null;

    const candidates = matches
        .map((match) => {
            const amountRaw = match[1];
            const amount = parseFloat(amountRaw.replace(/,/g, ''));
            const start = match.index;
            const end = start + amountRaw.length;

            if (!amount || amount <= 0) return null;

            return {
                match,
                amountRaw,
                amount,
                start,
                end,
                score: scoreAmountCandidate(text, start, end, amount)
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || b.amount - a.amount);

    if (candidates.length === 0) return null;

    const best = candidates[0];

    if (best.score < 0) {
        return null;
    }

    return best;
}

function formatAmount(amount) {
    return Number(amount || 0).toLocaleString('en-US');
}

function formatTypeLabel(type) {
    if (type === 'income') return 'รายรับ';
    if (type === 'expense') return 'รายจ่าย';
    return '-';
}

function formatTransactionLine(tx) {
    return `- ${tx.note || 'ไม่ระบุ'} | ${formatTypeLabel(tx.type)} | ${formatAmount(tx.amount)} บาท | ${tx.category || 'อื่นๆ'}`;
}

function formatSuccessReply(parsedList) {
    if (!parsedList || parsedList.length === 0) {
        return PARSE_ERROR_MESSAGE;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    parsedList.forEach((tx) => {
        if (tx.type === 'income') totalIncome += tx.amount;
        if (tx.type === 'expense') totalExpense += tx.amount;
    });

    let message = `✅ บันทึกเรียบร้อย ${parsedList.length} รายการ\n\n📋 รายการที่บันทึก:\n`;

    message += parsedList
        .slice(0, 5)
        .map(formatTransactionLine)
        .join('\n');

    if (parsedList.length > 5) {
        message += `\n... และอีก ${parsedList.length - 5} รายการ`;
    }

    message += '\n\n📊 สรุปจากข้อความนี้\n';

    if (totalIncome > 0) {
        message += `📈 รายรับ: ${formatAmount(totalIncome)} บาท\n`;
    }

    if (totalExpense > 0) {
        message += `📉 รายจ่าย: ${formatAmount(totalExpense)} บาท\n`;
    }

    message += '\nพิมพ์ "สรุป" เพื่อดูภาพรวมวันนี้';

    return message;
}

function requireUserId(res, userId) {
    if (!userId) {
        res.status(400).json({
            error: 'Missing userId'
        });
        return false;
    }
    return true;
}

function isLineNetworkTimeout(error) {
    return (
        error &&
        (
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNRESET' ||
            error.code === 'ECONNABORTED' ||
            (error.message && error.message.includes('ETIMEDOUT'))
        )
    );
}

function parseMessage(text) {
    const normalized = normalizeText(text);

    const cleaned = normalized
        .replace(/สรุปวันนี้|สรุปรายวัน|สรุป/g, ' ')
        .trim();

    if (!cleaned) {
        return [];
    }

    const lines = cleaned
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const inputLines = lines.length > 0 ? lines : [cleaned];
    const results = [];
    let lastType = null;

    for (const line of inputLines) {
        const best = findBestAmountMatch(line);

        if (!best) {
            continue;
        }

        const leftContext = line.slice(0, best.start).trim();

        let type = detectType(leftContext);

        if (!type) {
            type = detectType(line);
        }

        if (!type && lastType) {
            type = lastType;
        }

        if (!type && /(ซื้อ|ขาย|จ่าย|ได้เงิน|ได้มา|รับมา|รับเงิน|ค่า|เติม|ผ่อน|จ้าง)/.test(line)) {
            type = /(ขาย|ได้เงิน|ได้มา|รับมา|รับเงิน)/.test(line) ? 'income' : 'expense';
        }

        if (!type) {
            continue;
        }

        if (type) {
            lastType = type;
        }

        let note = cleanItemText(leftContext);
        note = note.replace(/(.+)\s+\1$/, '$1');
        if (!note) {
            note = cleanItemText(line.replace(best.amountRaw, ' '));
        }

        note = note
            .replace(/\s+/g, ' ')
            .trim();

        const category = classifyCategory(note || line || 'อื่นๆ');

        results.push({
            type,
            amount: best.amount,
            category,
            note: note || 'ไม่ระบุ'
        });
    }

    return results.filter(tx => tx.type && tx.amount > 0);
}

// =====================
// SUMMARY
// =====================
async function getTodaySummaryAsync(userId) {
    return await getTodaySummary(userId);
}

async function safeReply(replyToken, text) {
    return await client.replyMessage(replyToken, {
        type: 'text',
        text
    });
}

async function safePush(userId, text) {
    if (!userId || !text) return;

    try {
        await client.pushMessage(userId, {
            type: 'text',
            text
        });
    } catch (error) {
        console.error('❌ pushMessage error:', error);
    }
}

// =====================
// HANDLE EVENT — FIX #2: รวม follow เป็น reply เดียว
// =====================
async function handleEvent(event) {
    if (!event || !event.type) return;

    // -------- FOLLOW --------
    // FIX: replyToken ใช้ได้ครั้งเดียว → รวม welcome + quick reply ใน reply เดียว
    if (event.type === 'follow') {
        try {
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: WELCOME_MESSAGE,
                quickReply: {
                    items: buildQuickReplyItems(PROVINCE_OPTIONS)
                }
            });
        } catch (err) {
            console.error('[FOLLOW_REPLY_ERROR]', err?.message);
        }
        return;
    }

    // -------- MESSAGE --------
    if (event.type !== 'message') return;

    const userId = event.source?.userId;
    const message = event.message;

    if (!userId || !message) return;

    // รองรับเฉพาะข้อความตัวอักษร (ไม่เปลี่ยนพฤติกรรมเดิม)
    if (message.type !== 'text') {
        return;
    }

    const text = String(message.text || '').trim();
    if (!text) return;

    console.log('[INCOMING]', {
        userId,
        messageId: message.id,
        text
    });

    // 1) Onboarding (เลือกจังหวัด / ประเภทเกษตร)
    const consumedByOnboarding = await handleOnboardingStep(event, userId, text);
    if (consumedByOnboarding) {
        return;
    }

    // 2) Help
    if (isHelpCommand(text)) {
        await safeReply(event.replyToken, HELP_MESSAGE);
        return;
    }

    // 3) Dashboard
    if (isDashboardCommand(text)) {
        await safeReply(event.replyToken, formatDashboardMessage(userId));
        return;
    }

    // 4) Summary
    if (isSummaryCommand(text)) {
        try {
            const summary = await getTodaySummaryAsync(userId);
            await safeReply(event.replyToken, summary);
        } catch (summaryError) {
            console.error('[SUMMARY_ERROR]', summaryError?.message);
            await safeReply(event.replyToken, '⚠️ ไม่สามารถดึงสรุปได้ในขณะนี้ กรุณาลองใหม่ภายหลัง');
        }
        return;
    }

    // 5) AI Insight
    if (isAIInsightCommand(text)) {
        try {
            const allowed = await canUseAI(userId);
            if (!allowed) {
                await safeReply(event.replyToken, '⚠️ คุณใช้สิทธิ์วิเคราะห์ด้วย AI วันนี้ครบแล้ว กรุณาลองใหม่พรุ่งนี้');
                return;
            }
            const profile = await getUserProfile(userId);
            const categorySummary = await getTodayCategorySummary(userId);
            const insightText = await generateAIInsight(profile, categorySummary);
            await safeReply(event.replyToken, insightText);
        } catch (aiError) {
            console.error('[AI_ERROR]', aiError?.message);
            await safeReply(event.replyToken, '⚠️ ไม่สามารถวิเคราะห์ด้วย AI ได้ในขณะนี้ กรุณาลองใหม่ภายหลัง');
        }
        return;
    }

    // 6) Parse + Save + Reply
    const parsedList = parseMessage(text);

    if (!parsedList || parsedList.length === 0) {
        await safeReply(event.replyToken, PARSE_ERROR_MESSAGE);
        return;
    }

    const savedList = [];
    for (const tx of parsedList) {
        try {
            await saveTransaction(userId, tx);
            savedList.push(tx);
        } catch (saveError) {
            console.error('[SAVE_ERROR]', {
                userId,
                tx,
                message: saveError?.message
            });
        }
    }

    if (savedList.length === 0) {
        await safeReply(event.replyToken, '❌ ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่ภายหลัง');
        return;
    }

    await safeReply(event.replyToken, formatSuccessReply(savedList));
}

// =====================
// SERVER BOOTSTRAP
// =====================
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🌾 Farmer bot listening on port ${PORT}`);
    });
}

module.exports = app;
