const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ─── SonicPesa Configuration ───
const ACCESS_KEY = process.env.SONICPESA_API_KEY;
const ENV = process.env.SONICPESA_ENV || 'sandbox';

// ─── Official SonicPesa Endpoint ───
const API_URL = 'https://api.sonicpesa.com/api/v1/payment/create_order';

console.log(`🔗 SonicPesa Environment: ${ENV}`);
console.log(`📡 API URL: ${API_URL}`);

// ─── Donation Endpoint ───
app.post('/api/donate', async (req, res) => {
    try {
        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing phone or amount'
            });
        }

        const cleanPhone = phone.replace(/\D/g, '');

        // ─── SonicPesa Payload (from official docs) ───
        const payload = {
            buyer_email: `${cleanPhone}@donor.com`, // Placeholder email
            buyer_name: 'Donor',
            buyer_phone: cleanPhone,
            amount: parseInt(amount),
            currency: 'TZS'
        };

        console.log('📤 Sending to SonicPesa:', JSON.stringify(payload, null, 2));

        // ─── Send request ───
        const response = await axios.post(
            API_URL,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': ACCESS_KEY
                },
                timeout: 45000
            }
        );

        console.log('📥 SonicPesa Response:', JSON.stringify(response.data, null, 2));

        // ─── Check response ───
        if (response.data && response.data.status === 'success') {
            return res.json({
                success: true,
                transactionId: response.data.data?.order_id || response.data.data?.reference,
                message: 'USSD prompt sent to your phone'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: response.data?.message || 'Payment initiation failed'
            });
        }

    } catch (error) {
        console.error('❌ SonicPesa Error:');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            return res.status(500).json({
                success: false,
                message: error.response.data?.message || 'Payment gateway error'
            });
        } else if (error.request) {
            console.error('No response from SonicPesa');
            return res.status(500).json({
                success: false,
                message: 'SonicPesa API is not responding. Please try again later.'
            });
        } else {
            console.error('Error:', error.message);
            return res.status(500).json({
                success: false,
                message: error.message || 'Payment failed'
            });
        }
    }
});

// ─── Webhook ───
app.post('/api/webhook', async (req, res) => {
    try {
        console.log('[Webhook] Received:', JSON.stringify(req.body, null, 2));
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