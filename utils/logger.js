function logStep(step, context = {}) {
    console.log(`[${new Date().toISOString()}] ${step}`, context);
}

function startTimer(operation, context = {}) {
    const startedAt = process.hrtime.bigint();
    logStep(`${operation} started`, context);

    return (outcome = 'completed', extra = {}) => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        logStep(`${operation} ${outcome}`, {
            ...context,
            ...extra,
            durationMs: Number(durationMs.toFixed(2))
        });
    };
}

module.exports = { logStep, startTimer };
