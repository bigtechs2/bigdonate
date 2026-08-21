// ─── DOM Elements ───
const form = document.getElementById('donateForm');
const donationForm = document.getElementById('donationForm');
const processing = document.getElementById('processing');
const success = document.getElementById('success');
const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');

let confettiPieces = [];
let animationId = null;

// ─── Resize Canvas ───
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Confetti ───
class Confetti {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.w = Math.random() * 12 + 4;
        this.h = Math.random() * 8 + 4;
        this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
        this.speed = Math.random() * 3 + 1;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        this.drift = (Math.random() - 0.5) * 1.5;
        this.shape = Math.random() > 0.5 ? 'square' : 'circle';
    }

    update() {
        this.y += this.speed;
        this.x += this.drift + Math.sin(this.y * 0.01) * 0.5;
        this.rotation += this.rotationSpeed;
        if (this.y > canvas.height + 20) {
            this.y = -20;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        if (this.shape === 'square') {
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function startConfetti() {
    confettiPieces = [];
    for (let i = 0; i < 150; i++) {
        confettiPieces.push(new Confetti());
    }
    if (animationId) cancelAnimationFrame(animationId);
    animateConfetti();
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const piece of confettiPieces) {
        piece.update();
        piece.draw();
    }
    animationId = requestAnimationFrame(animateConfetti);
}

function stopConfetti() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ─── Donation Handler ───
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const amount = document.getElementById('amount').value.trim();
    const network = document.getElementById('network').value;

    if (!phone || !amount || !network) {
        alert('Please fill in all fields!');
        return;
    }

    // Validate phone number
    const phoneRegex = /^255[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
        alert('Please enter a valid Tanzania phone number (e.g., 255XXXXXXXXX)');
        return;
    }

    if (parseInt(amount) < 1) {
        alert('Amount must be at least 1 TZS');
        return;
    }

    // ─── Show Processing ───
    donationForm.style.display = 'none';
    processing.style.display = 'block';
    success.style.display = 'none';

    // ─── Call SonicPesa API ───
    try {
        const response = await fetch('/api/donate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amount: amount,
                network: network
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Payment failed');
        }

        // ─── SUCCESS ───
        processing.style.display = 'none';
        success.style.display = 'block';
        startConfetti();

        // Play party emoji rain animation
        setTimeout(() => {
            stopConfetti();
        }, 8000);

    } catch (error) {
        alert(`❌ Payment failed: ${error.message}`);
        donationForm.style.display = 'block';
        processing.style.display = 'none';
    }
});

// ─── Reset Function ───
function resetDonation() {
    stopConfetti();
    success.style.display = 'none';
    donationForm.style.display = 'block';
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Expose reset to global scope ───
window.resetDonation = resetDonation;