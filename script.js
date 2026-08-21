// ─── NEON MATRIX RAIN (Blue / Grey) ───
const matrixCanvas = document.getElementById('matrixCanvas');
const mctx = matrixCanvas.getContext('2d');

// ─── All special symbols ───
const symbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$&£¢€¥π×∆✓°¢^~+{$$:#+#&$#(✓¢=%";
const matrixChars = symbols.split('');

let drops = [];
const fontSize = 20;
let columns;

function resizeMatrix() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    columns = Math.floor(matrixCanvas.width / fontSize);
    drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }
}
window.addEventListener('resize', resizeMatrix);
resizeMatrix();

function drawMatrix() {
    // Black background with slight fade trail
    mctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    // Set font
    mctx.font = `${fontSize}px 'Courier New', monospace`;
    mctx.textAlign = 'center';

    for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * fontSize + fontSize / 2;
        const y = drops[i] * fontSize + fontSize / 2;

        // Neon blue/grey glow
        const brightness = Math.random() * 0.6 + 0.4;
        // Mix of blue and grey: blue component high, green and red vary
        const r = Math.floor(80 + 60 * brightness);
        const g = Math.floor(120 + 100 * brightness);
        const b = Math.floor(200 + 55 * brightness);
        const color = `rgba(${r}, ${g}, ${b}, ${0.8 + 0.2 * brightness})`;

        mctx.shadowColor = `rgba(0, 180, 255, ${0.3 * brightness})`;
        mctx.shadowBlur = 20;
        mctx.fillStyle = color;
        mctx.fillText(char, x, y);

        // Reset shadow
        mctx.shadowBlur = 0;

        // Move down
        if (y > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
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
            body: JSON.stringify({ phone, amount })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Payment failed');
        }

        processing.style.display = 'none';
        success.style.display = 'block';

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