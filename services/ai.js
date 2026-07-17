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
                contents: prompt
            });

            return response.text?.trim() || '⚠️ ไม่สามารถสร้างคำวิเคราะห์ได้ในขณะนี้';
        } catch (error) {
            const statusCode = error.status || error.code;
            const isUnavailable = statusCode === 503 || 
                                  (error.message && error.message.includes('UNAVAILABLE')) || 
                                  (error.message && error.message.includes('high demand'));

            // If it's a 503 error and we have retry attempts remaining, back off and try again
            if (isUnavailable && attempt <= maxRetries) {
                console.warn(`[GEMINI_RETRY] Attempt ${attempt} failed with 503 (UNAVAILABLE). Retrying in ${retryDelayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                continue;
            }

            // Throw the original error if it's not a 503 or we ran out of retry attempts
            throw error;
        }
    }
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
        
        // Handle HTTP 503 (UNAVAILABLE) / High Demand errors after all retries are exhausted
        if (statusCode === 503 || (error.message && error.message.includes('UNAVAILABLE')) || (error.message && error.message.includes('high demand'))) {
            return '⚠️ ระบบ AI มีผู้ใช้งานจำนวนมากในขณะนี้\nกรุณาลองใหม่อีกครั้งในอีกสักครู่';
        }
        
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
