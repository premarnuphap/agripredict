require('dotenv').config();

const express = require('express');
const { registerWebhookRoute } = require('./routes/webhook');
const { registerDashboardRoutes } = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Route order is intentionally preserved: LINE verification handles the webhook
// before JSON parsing is enabled for the dashboard endpoints.
registerWebhookRoute(app);
app.use(express.json());

app.get('/', (req, res) => {
    res.send('LINE Bot Ready');
});

registerDashboardRoutes(app);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
