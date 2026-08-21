const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ─── SonicPesa Config ───
const ACCESS_KEY = process.env.SONICPESA_API_KEY;
const SECRET_KEY = process.env.SONICPESA_API_SECRET;
const ENV = process.env.SONICPESA_ENV || 'sandbox';

const BASE_URL = ENV === 'production' || ENV === 'live'
    ? 'https://api.sonicpesa.com/v1'
    : 'https://sandbox-api.sonicpesa.com/v1';

console.log(`🔗 SonicPesa Environment: ${ENV}`);
console.log(`📡 API URL: ${BASE_URL}`);

// ─── Helper: Basic Auth ───
const authHeader = 'Basic ' + Buffer.from(`${ACCESS_KEY}:${SECRET_KEY}`).toString('base64');

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

        // ─── SonicPesa Payload ───
        const payload = {
            phone: cleanPhone,
            amount: parseInt(amount),
            network: 'VODACOM', // SonicPesa will detect if omitted, but we set default
            reference: paymentRef,
            callback_url: `${req.protocol}://${req.get('host')}/api/webhook`
        };

        console.log('📤 Sending to SonicPesa:', payload);

        const response = await axios.post(
            `${BASE_URL}/payments`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                timeout: 30000
            }
        );

        console.log('📥 SonicPesa Response:', response.data);

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
        // ─── Detailed error logging ───
        console.error('❌ SonicPesa Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            return res.status(500).json({
                success: false,
                message: error.response.data?.message || error.response.data?.error || 'Payment failed. Please try again.'
            });
        } else if (error.request) {
            console.error('No response from SonicPesa');
            return res.status(500).json({
                success: false,
                message: 'No response from payment gateway. Please try again.'
            });
        } else {
            console.error('Error:', error.message);
            return res.status(500).json({
                success: false,
                message: error.message || 'Payment failed. Please try again.'
            });
        }
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