const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ─── SonicPesa Configuration ───
const SONICPESA_API_KEY = process.env.SONICPESA_API_KEY;
const SONICPESA_API_SECRET = process.env.SONICPESA_API_SECRET;
const SONICPESA_ENV = process.env.SONICPESA_ENV || 'sandbox';

const SONICPESA_BASE_URL = SONICPESA_ENV === 'production' || SONICPESA_ENV === 'live'
    ? 'https://api.sonicpesa.com/v1'
    : 'https://sandbox-api.sonicpesa.com/v1';

console.log(`🔗 SonicPesa Environment: ${SONICPESA_ENV}`);
console.log(`📡 API URL: ${SONICPESA_BASE_URL}`);

// ─── Donation Endpoint ───
app.post('/api/donate', async (req, res) => {
    try {
        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const paymentRef = `BIGDONATE-${Date.now()}`;

        // ─── SonicPesa API Call ───
        const response = await axios.post(
            `${SONICPESA_BASE_URL}/payments`,
            {
                phone: cleanPhone,
                amount: parseInt(amount),
                network: 'VODACOM',
                callback_url: `${req.protocol}://${req.get('host')}/api/webhook`,
                reference: paymentRef
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SONICPESA_API_KEY}`
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.status === 'pending') {
            return res.json({
                success: true,
                transactionId: response.data.transaction_id,
                message: 'USSD prompt sent to your phone'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: response.data.message || 'Payment initiation failed'
            });
        }

    } catch (error) {
        console.error('[SonicPesa] Error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Payment failed. Please try again.'
        });
    }
});

// ─── Webhook ───
app.post('/api/webhook', async (req, res) => {
    try {
        const { transaction_id, status, reference } = req.body;
        console.log(`[Webhook] ${transaction_id}: ${status}`);
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        res.status(500).json({ error: 'Webhook error' });
    }
});

// ─── Serve ───
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ BIGDONATE running on port ${PORT}`);
});