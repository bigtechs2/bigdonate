const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ─── SonicPesa Configuration ───
const SONICPESA = {
    apiKey: process.env.SONICPESA_API_KEY || 'your_api_key_here',
    apiSecret: process.env.SONICPESA_API_SECRET || 'your_api_secret_here',
    environment: process.env.SONICPESA_ENV || 'sandbox', // 'sandbox' or 'production'
    baseUrl: process.env.SONICPESA_ENV === 'production' 
        ? 'https://api.sonicpesa.com/v1' 
        : 'https://sandbox-api.sonicpesa.com/v1'
};

// ─── Create Payment Endpoint ───
app.post('/api/donate', async (req, res) => {
    try {
        const { phone, amount, network } = req.body;

        // Validate input
        if (!phone || !amount || !network) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Format phone number (remove any non-digit characters)
        const cleanPhone = phone.replace(/\D/g, '');

        // ─── SonicPesa API Call ───
        const response = await axios.post(
            `${SONICPESA.baseUrl}/payments`,
            {
                phone: cleanPhone,
                amount: parseInt(amount),
                network: network, // 'VODACOM', 'AIRTEL', 'TIGO', 'HALOTEL', 'TTCL', 'YAS'
                callback_url: `${req.protocol}://${req.get('host')}/api/webhook`,
                reference: `BIGDONATE-${Date.now()}`
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SONICPESA.apiKey}`
                }
            }
        );

        // Check if payment was initiated
        if (response.data && response.data.status === 'pending') {
            return res.json({
                success: true,
                transactionId: response.data.transaction_id,
                message: 'Payment initiated. Please check your phone for USSD prompt.'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: response.data.message || 'Payment failed'
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

// ─── Webhook Endpoint (for payment confirmation) ───
app.post('/api/webhook', async (req, res) => {
    try {
        const { transaction_id, status, reference } = req.body;

        console.log(`[Webhook] Transaction ${transaction_id}: ${status}`);

        // Update your database here if needed

        // Always return 200 OK
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('[Webhook] Error:', error);
        res.status(500).json({ error: 'Webhook error' });
    }
});

// ─── Serve main page ───
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start server ───
app.listen(PORT, () => {
    console.log(`✅ BIGDONATE running on port ${PORT}`);
    console.log(`🔗 SonicPesa Environment: ${SONICPESA.environment}`);
    console.log(`📱 Mode: ${SONICPESA.environment === 'production' ? 'LIVE 🔴' : 'TEST 🧪'}`);
});