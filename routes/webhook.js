const { middleware } = require('../config/line');
const { handleEvent } = require('../handlers/messageHandler');
const { startTimer } = require('../utils/logger');

function registerWebhookRoute(app) {
    app.post('/webhook', middleware, (req, res) => {
        const events = req.body.events || [];
        // Intentionally unchanged: this refactor must not alter webhook/background semantics.
        res.status(200).end();

        Promise.all(events.map(async (event) => {
            const finish = startTimer('Webhook event dispatch', { eventType: event.type });
            try {
                await handleEvent(event);
                finish('completed');
            } catch (eventError) {
                finish('failed', { message: eventError.message });
                console.error('❌ event processing error:', eventError);
            }
        })).catch((error) => {
            console.error('❌ webhook background error:', error);
        });
    });
}

module.exports = { registerWebhookRoute };
