// ─── MATRIX RAIN ───
const matrixCanvas = document.getElementById('matrixCanvas');
const mctx = matrixCanvas.getContext('2d');
let matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/";
let matrixDrops = [];

function resizeMatrix() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    matrixDrops = [];
    const columns = Math.floor(matrixCanvas.width / 20);
    for (let i = 0; i < columns; i++) {
        matrixDrops[i] = Math.random() * -100;
    }
}
window.addEventListener('resize', resizeMatrix);
resizeMatrix();

function drawMatrix() {
    mctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    mctx.fillStyle = '#333';
    mctx.font = '16px monospace';
    for (let i = 0; i < matrixDrops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * 20;
        const y = matrixDrops[i] * 20;
        mctx.fillText(char, x, y);
        if (y > matrixCanvas.height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
    }
}
setInterval(drawMatrix, 50);

// ─── DOM Elements ───
const form = document.getElementById('donateForm');
const donationForm = document.getElementById('donationForm');
const processing = document.getElementById('processing');
const success = document.getElementById('success');

// ─── Donation Handler ───
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const amount = document.getElementById('amount').value.trim();

    if (!phone || !amount) {
        alert('Please fill in all fields!');
        return;
    }

    const phoneRegex = /^255[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
        alert('Please enter a valid Tanzania phone number (e.g., 255XXXXXXXXX)');
        return;
    }

    if (parseInt(amount) < 1) {
        alert('Amount must be at least 1 TZS');
        return;
    }

    donationForm.style.display = 'none';
    processing.style.display = 'block';
    success.style.display = 'none';

    try {
        const response = await fetch('/api/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amount: amount
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Payment failed');
        }

        processing.style.display = 'none';
        success.style.display = 'block';

        // Stop matrix rain during celebration
        setTimeout(() => {
            // Keep success visible
        }, 100);

    } catch (error) {
        alert(`❌ Payment failed: ${error.message}`);
        donationForm.style.display = 'block';
        processing.style.display = 'none';
    }
});

// ─── Reset ───
function resetDonation() {
    success.style.display = 'none';
    donationForm.style.display = 'block';
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.resetDonation = resetDonation;