const CATEGORY_RULES = [
    { name: 'ต้นทุนผันแปร', priority: 1, triggers: ['ซื้อ', 'เติม', 'ใส่', 'ใช้', 'ลง', 'ทำ', 'เอาเข้า', 'ใช้ไป', 'หมดไป'], keywords: ['เมล็ด', 'เมล็ดพันธุ์', 'เมล็ดผัก', 'เมล็ดข้าว', 'พันธุ์', 'พันธุ์พืช', 'พันธุ์สัตว์', 'กล้า', 'ต้นกล้า', 'เพาะกล้า', 'ถาดเพาะ', 'ลูกไก่', 'ลูกเป็ด', 'ลูกหมู', 'ลูกปลา', 'ลูกกุ้ง', 'แม่พันธุ์', 'พ่อพันธุ์', 'ปุ๋ย', 'ปุย', 'ปุ๋ยเคมี', 'ปุ๋ยคอก', 'ปุ๋ยอินทรีย์', 'ปุ๋ยหมัก', 'ยูเรีย', '151515', '161616', '4600', 'โดโลไมท์', 'ปูนขาว', 'ยิปซัม', 'ขี้วัว', 'ขี้ไก่', 'ขี้หมู', 'มูลสัตว์', 'แกลบ', 'แกลบดิบ', 'แกลบเผา', 'ฟาง', 'ขุยมะพร้าว', 'ดิน', 'ดินปลูก', 'ปรับดิน', 'บำรุงดิน', 'ยา', 'ยาแมลง', 'ยาหญ้า', 'ยาหนอน', 'ยาเชื้อ', 'ยาฆ่าแมลง', 'ยาฆ่าหญ้า', 'ยาฆ่าเชื้อ', 'พ่นยา', 'ฉีดยา', 'สารเคมี', 'เคมี', 'ฮอร์โมน', 'วัคซีน', 'ยาฉีด', 'เวชภัณฑ์', 'ยาปฏิชีวนะ', 'ยาบำรุง', 'วิตามิน', 'อาหารสัตว์', 'อาหารไก่', 'อาหารหมู', 'อาหารปลา', 'อาหารกุ้ง', 'อาหารเม็ด', 'อาหารผง', 'อาหารข้น', 'รำ', 'รำละเอียด', 'รำหยาบ', 'ปลายข้าว', 'ข้าวโพด', 'กากถั่ว', 'กากมัน', 'หัวอาหาร', 'อาหารสำเร็จรูป', 'น้ำ', 'น้ำประปา', 'เติมน้ำ', 'สูบน้ำ', 'รดน้ำ', 'ไฟ', 'ไฟฟ้า', 'ปั๊ม', 'ปั๊มน้ำ', 'เครื่องสูบ', 'น้ำมัน', 'เติมน้ำมัน', 'น้ำมันเครื่อง', 'น้ำมันดีเซล', 'เบนซิน', 'น้ำมันเครื่องสูบ', 'น้ำมันรถไถ', 'น้ำมันเครื่องตัดหญ้า', 'ขี้เลื่อย', 'รองพื้นคอก', 'แกลบรองพื้น', 'ถุงอาหาร', 'ถุงปุ๋ย', 'เชือก', 'พลาสติกคลุมดิน'], patterns: [/ซื้อ.*(เมล็ด|พันธุ์|ปุ๋ย|ยา|อาหาร|น้ำมัน)/, /เติม.*(น้ำ|น้ำมัน|อาหาร)/, /ใส่.*(ปุ๋ย|ยา)/, /(พ่น|ฉีด).*(ยา|เคมี)/, /ให้.*อาหาร/] },
    { name: 'ค่าแรง', priority: 2, triggers: ['จ้าง', 'ใช้แรง', 'ให้คน', 'ทำ'], keywords: ['จ้าง', 'จ้างคน', 'จ้างแรงงาน', 'แรงงาน', 'คนงาน', 'ลูกน้อง', 'ทำเอง', 'เจ้าของทำ', 'แรงตัวเอง', 'รายวัน', 'รายชั่วโมง', 'เหมา', 'จ้างปลูก', 'จ้างหว่าน', 'จ้างเกี่ยว', 'จ้างเก็บ', 'จ้างจับหมู', 'จ้างจับไก่', 'จ้างฉีด', 'จ้างพ่น', 'ตัดหญ้า', 'ถอนหญ้า', 'ขุดดิน', 'ล้างคอก', 'ทำความสะอาด'], patterns: [/จ้าง.*/, /(ตัด|ถอน|ขุด|ล้าง|เก็บ).*(คน|จ้าง)/, /ทำเอง/] },
    { name: 'ค่าซ่อม / บำรุงรักษา', priority: 3, triggers: ['ซ่อม', 'บำรุง', 'เปลี่ยน', 'แก้', 'ล้าง'], keywords: ['ซ่อม', 'ซ่อมแซม', 'ค่าซ่อม', 'บำรุง', 'บำรุงรักษา', 'อะไหล่', 'เปลี่ยนอะไหล่', 'เครื่อง', 'เครื่องมือ', 'เครื่องสูบ', 'เครื่องตัดหญ้า', 'รถไถ', 'รถ', 'ปั๊ม', 'ปั๊มน้ำ', 'ท่อ', 'ระบบน้ำ', 'ระบบไฟ', 'เครื่องหยอด', 'เครื่องหยอดข้าวโพด', 'ล้างเครื่อง', 'ล้างปั๊ม'], patterns: [/(ซ่อม|ซ่อมแซม).*/, /(บำรุง|บำรุงรักษา).*/, /ค่า(ซ่อม|เปลี่ยนอะไหล่).*/, /(เปลี่ยนอะไหล่|เปลี่ยนยาง|เปลี่ยนน้ำมันเครื่อง).*/] },
    { name: 'ต้นทุนคงที่', priority: 3, triggers: ['ซื้อ', 'ลงทุน', 'สร้าง', 'ทำ', 'ติดตั้ง'], keywords: ['เครื่อง', 'เครื่องมือ', 'อุปกรณ์', 'เครื่องพ่น', 'เครื่องตัดหญ้า', 'เครื่องสูบ', 'เครื่องไถ', 'เครื่องบด', 'เครื่องผสมอาหาร', 'รถไถ', 'รถเกี่ยว', 'คอก', 'กรง', 'เล้าไก่', 'โรงเรือน', 'โรงเรือนหมู', 'โรงเรือนไก่', 'แทงค์น้ำ', 'ถังน้ำใหญ่', 'ระบบน้ำ', 'ระบบไฟ', 'ท่อ', 'สปริงเกอร์', 'น้ำหยด', 'ติดตั้ง', 'ต่อเติม', 'ทำหลังคา', 'ทำพื้น'], patterns: [/ซื้อ.*(เครื่อง|อุปกรณ์|รถ|คอก|โรงเรือน)/, /สร้าง.*(คอก|เล้า|โรงเรือน)/, /ติดตั้ง.*ระบบ/] },
    { name: 'ค่าใช้จ่ายทั่วไป', priority: 4, triggers: ['ใช้', 'จ่าย', 'ทั่วไป', 'เบ็ดเตล็ด'], keywords: ['โทร', 'โทรศัพท์', 'เติมเงิน', 'เน็ต', 'อินเทอร์เน็ต', 'เดินทาง', 'ใช้รถ', 'กิน', 'อาหารคน', 'ของใช้', 'ของจุกจิก', 'ขน', 'ขนส่ง', 'ส่งของ', 'รถขน', 'รถบรรทุก', 'ตลาด', 'แผง', 'เช่าที่', 'เช่าร้าน', 'แพ็ค', 'บรรจุ', 'ถุง', 'กล่อง', 'ลัง', 'โพสต์ขาย', 'โปรโมท', 'โฆษณา'], patterns: [/(ส่ง|ขน).*(ของ)/, /(แพ็ค|บรรจุ).*(ของ)/, /(โพสต์|โปรโมท)/] },
    { name: 'การเงิน / หนี้', priority: 5, triggers: ['กู้', 'ยืม', 'จ่าย', 'ผ่อน', 'คืน', 'โอน'], keywords: ['กู้', 'กู้เงิน', 'เงินกู้', 'ยืมเงิน', 'ธนาคาร', 'ธกส', 'แบงค์', 'จ่ายหนี้', 'ใช้หนี้', 'คืนหนี้', 'ปิดหนี้', 'ผ่อน', 'งวด', 'ดอก', 'ดอกเบี้ย', 'เงินต้น', 'ค่าปรับ', 'ค่าธรรมเนียม', 'โอนเงิน', 'ส่งเงิน', 'หนี้นอก', 'ดอกนอก'], patterns: [/กู้.*/, /ผ่อน.*/, /จ่าย.*(หนี้|งวด|ดอก)/, /โอน.*เงิน/] }
];

const PARSE_ERROR_MESSAGE = `
❌ ไม่พบจำนวนเงินในข้อความ

ลองพิมพ์:
- ซื้อปุ๋ย 500 บาท
- ขายผัก ได้เงิน 3000 บาท

📌 ถ้ามีตัวเลขหลายตัว เช่น "300 กิโล 5000 บาท"
ระบบจะใช้ตัวเลขที่เป็น "บาท"
`;

function classifyCategoryOverride(text) {
    const input = String(text || '').trim().toLowerCase();
    if (!input) return null;
    if (/(จ้าง|ค่าจ้าง|ค่าแรง|แรงงาน|คนงาน|ลูกน้อง)/.test(input) && !/(ขาย|รับเงิน|ได้เงิน)/.test(input)) return 'ค่าแรง';
    if (/(ซ่อม|ซ่อมแซม|ค่าซ่อม|บำรุง|บำรุงรักษา|อะไหล่|เปลี่ยนอะไหล่|repair)/.test(input)) return 'ค่าซ่อม / บำรุงรักษา';
    return null;
}

function classifyCategory(text) {
    const input = String(text || '').trim().toLowerCase();
    if (!input) return 'อื่นๆ';
    const overrideCategory = classifyCategoryOverride(input);
    if (overrideCategory) return overrideCategory;
    for (const rule of CATEGORY_RULES) if ((rule.patterns || []).some(pattern => pattern.test(input))) return rule.name;
    for (const rule of CATEGORY_RULES) {
        if ((rule.triggers || []).some(trigger => input.includes(trigger)) && (rule.keywords || []).some(keyword => input.includes(keyword))) return rule.name;
    }
    for (const rule of CATEGORY_RULES) if ((rule.keywords || []).some(keyword => input.includes(keyword))) return rule.name;
    return 'อื่นๆ';
}

function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').replace(/บาทถ้วน/g, ' บาท').replace(/บาท/g, ' บาท ').replace(/,\s*/g, ',').trim();
}

function detectType(text) {
    const input = String(text || '').trim().toLowerCase();
    if (!input) return null;
    if (/(ขาย|รายรับ|รับมา|ได้เงิน|ได้มา|โอนเข้า|เงินเข้า|รับเงิน)/.test(input)) return 'income';
    if (/(ซื้อ|รายจ่าย|จ่าย|ค่า|ค่าส่ง|โอนออก|เสีย|หมดไป|ผ่อน|ชำระ|ซ่อม|บำรุง|เปลี่ยนอะไหล่)/.test(input)) return 'expense';
    return null;
}

function cleanItemText(text) {
    return String(text || '').replace(/(รายรับ|รายจ่าย|บาทถ้วน|บาท|แล้ว|และ|กับ|จากนั้น|เอาไป|ได้เงิน|ได้มา|รับมา)/g, ' ').replace(/\s+/g, ' ').trim();
}

const NON_MONEY_UNITS = ['กิโล', 'กก', 'ก.ก.', 'กิโลกรัม', 'โล', 'ตัว', 'ชิ้น', 'ถุง', 'ลัง', 'ฟอง', 'แพ็ค', 'แพก', 'ไร่', 'งาน', 'เมตร', 'ม.', 'ลิตร', 'ตัน', 'กระสอบ', 'ใบ', 'ขวด', 'กล่อง', 'ชุด', 'คัน', 'เครื่อง'];
function escapeRegex(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function isQuantityUnitAfterNumber(text, amountEnd) {
    const tail = text.slice(amountEnd, amountEnd + 20).trim();
    return NON_MONEY_UNITS.some(unit => new RegExp(`^${escapeRegex(unit)}(?:\\b|\\s|$)`).test(tail));
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
    if (amount < 1000 && !/บาท/.test(around) && !/(ได้เงิน|ได้มา|รับมา|รับเงิน|ขาย|ซื้อ|จ่าย|ค่า|เติม|ผ่อน)/.test(left)) score -= 20;
    return score;
}
function findBestAmountMatch(text) {
    const matches = [...text.matchAll(/(\d[\d,]*(?:\.\d+)?)/g)];
    const candidates = matches.map(match => {
        const amountRaw = match[1];
        const amount = parseFloat(amountRaw.replace(/,/g, ''));
        const start = match.index;
        const end = start + amountRaw.length;
        if (!amount || amount <= 0) return null;
        return { match, amountRaw, amount, start, end, score: scoreAmountCandidate(text, start, end, amount) };
    }).filter(Boolean).sort((a, b) => b.score - a.score || b.amount - a.amount);
    if (!candidates.length || candidates[0].score < 0) return null;
    return candidates[0];
}

function parseMessage(text) {
    const cleaned = normalizeText(text).replace(/สรุปวันนี้|สรุปรายวัน|สรุป/g, ' ').trim();
    if (!cleaned) return [];
    const lines = cleaned.split('\n').map(line => line.trim()).filter(Boolean);
    const results = [];
    let lastType = null;
    for (const line of (lines.length > 0 ? lines : [cleaned])) {
        const best = findBestAmountMatch(line);
        if (!best) continue;
        const leftContext = line.slice(0, best.start).trim();
        let type = detectType(leftContext) || detectType(line) || lastType;
        if (!type && /(ซื้อ|ขาย|จ่าย|ได้เงิน|ได้มา|รับมา|รับเงิน|ค่า|เติม|ผ่อน|จ้าง)/.test(line)) type = /(ขาย|ได้เงิน|ได้มา|รับมา|รับเงิน)/.test(line) ? 'income' : 'expense';
        if (!type) continue;
        lastType = type;
        let note = cleanItemText(leftContext).replace(/(.+)\s+\1$/, '$1');
        if (!note) note = cleanItemText(line.replace(best.amountRaw, ' '));
        note = note.replace(/\s+/g, ' ').trim();
        results.push({ type, amount: best.amount, category: classifyCategory(note || line || 'อื่นๆ'), note: note || 'ไม่ระบุ' });
    }
    return results.filter(tx => tx.type && tx.amount > 0);
}

function formatAmount(amount) { return Number(amount || 0).toLocaleString('en-US'); }
function formatTypeLabel(type) { return type === 'income' ? 'รายรับ' : type === 'expense' ? 'รายจ่าย' : '-'; }
function formatSuccessReply(parsedList) {
    if (!parsedList || parsedList.length === 0) return PARSE_ERROR_MESSAGE;
    let totalIncome = 0;
    let totalExpense = 0;
    parsedList.forEach(tx => { if (tx.type === 'income') totalIncome += tx.amount; if (tx.type === 'expense') totalExpense += tx.amount; });
    let message = `✅ บันทึกเรียบร้อย ${parsedList.length} รายการ\n\n📋 รายการที่บันทึก:\n`;
    message += parsedList.slice(0, 5).map(tx => `- ${tx.note || 'ไม่ระบุ'} | ${formatTypeLabel(tx.type)} | ${formatAmount(tx.amount)} บาท | ${tx.category || 'อื่นๆ'}`).join('\n');
    if (parsedList.length > 5) message += `\n... และอีก ${parsedList.length - 5} รายการ`;
    message += '\n\n📊 สรุปจากข้อความนี้\n';
    if (totalIncome > 0) message += `📈 รายรับ: ${formatAmount(totalIncome)} บาท\n`;
    if (totalExpense > 0) message += `📉 รายจ่าย: ${formatAmount(totalExpense)} บาท\n`;
    return message + '\nพิมพ์ "สรุป" เพื่อดูภาพรวมวันนี้';
}

module.exports = { PARSE_ERROR_MESSAGE, parseMessage, formatAmount, formatSuccessReply, classifyCategory };
