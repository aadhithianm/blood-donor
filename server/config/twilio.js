import twilio from 'twilio';

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to, body) => {
    try {
        const message = await client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });
        return message.sid;
    } catch (error) {
        console.error('SMS send error:', error.message);
        throw error;
    }
};

export const sendWhatsApp = async (to, body) => {
    try {
        const message = await client.messages.create({
            body,
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: `whatsapp:${to}`,
        });
        return message.sid;
    } catch (error) {
        console.error('WhatsApp send error:', error.message);
        throw error;
    }
};

export default client;
