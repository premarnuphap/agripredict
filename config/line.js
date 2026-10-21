const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    httpConfig: { timeout: 10000 }
};

if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    console.error('❌ Missing LINE env variables');
    process.exit(1);
}

const client = new line.Client(config);

module.exports = { config, client, middleware: line.middleware(config) };
