(() => {
    const canvas = document.getElementById("ocean");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = false; 

    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const FISH_COLORS = ["#ff9f6b", "#ffd36b", "#6bd3ff", "#8ef0c8", "#ff7aa8", "#b79bff"];
    const CORAL_COLORS = ["#ff6b8b", "#ff9f5a", "#c76bff", "#ffcf5a", "#5fe0d0"];
    const WEED_COLORS = ["#2f9e6b", "#3fbf7f", "#1f8a74", "#5ac26d", "#2b7f5a"];

    let W = 0, H = 0, dpr = 1, seaH = 100;
    let fish = [], bubbles = [], weeds = [], blades = [], vents = [];
    let decor = null;
    const mouse = { x: -9999, y: -9999 };

    const duneY = x => H - seaH * 0.72 + Math.sin(x / 170) * 9 + Math.sin(x / 61 + 1) * 3;
    const swimMax = () => H - seaH - 30;

    function branch(c, x, y, len, ang, d, w, col) {
        if (d === 0) { c.fillStyle = col; c.beginPath(); c.arc(x, y, w * 0.9, 0, 6.3); c.fill(); return; }
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round";
        c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
        branch(c, x2, y2, len * 0.76, ang - rand(0.3, 0.6), d - 1, w * 0.72, col);
        branch(c, x2, y2, len * 0.76, ang + rand(0.3, 0.6), d - 1, w * 0.72, col);
    }

    function fanCoral(c, x, y, r, col) {
        const g = c.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, col); g.addColorStop(1, "rgba(255,255,255,0.35)");
        c.fillStyle = g; c.globalAlpha = 0.85;
        c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, Math.PI * 1.1, Math.PI * 1.9); c.closePath(); c.fill();
        c.globalAlpha = 0.4; c.strokeStyle = "#fff"; c.lineWidth = 1;
        for (let a = 1.15; a < 1.9; a += 0.07) {
            c.beginPath(); c.moveTo(x, y);
            c.lineTo(x + Math.cos(a * Math.PI) * r, y + Math.sin(a * Math.PI) * r); c.stroke();
        }
        c.globalAlpha = 1;
    }

    function domeCoral(c, x, y, r, col) {
        c.fillStyle = col;
        c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0, Math.PI, 0); c.fill();
        c.strokeStyle = "rgba(0,0,0,0.18)"; c.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            c.beginPath(); c.ellipse(x, y, r * i / 4, r * 0.7 * i / 4, 0, Math.PI, 0); c.stroke();
        }
    }

    function buildDecor() {
        decor = document.createElement("canvas");
        decor.width = W * dpr; decor.height = H * dpr;
        const c = decor.getContext("2d");
        c.scale(dpr, dpr);

        const g = c.createLinearGradient(0, H - seaH, 0, H);
        g.addColorStop(0, "#d8c58f"); g.addColorStop(0.5, "#a98f5a"); g.addColorStop(1, "#4b3f27");
        c.fillStyle = g;
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) c.lineTo(x, duneY(x));
        c.lineTo(W, H); c.closePath(); c.fill();

        for (let i = 0; i < W / 4; i++) {
            const x = rand(0, W), y = rand(duneY(x) + 4, H);
            c.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
            c.fillRect(x, y, 2, 2);
        }

        for (let i = 0; i < Math.max(4, W / 220); i++) {
            const x = rand(0, W), r = rand(14, 34), y = duneY(x) + 4;
            const rg = c.createRadialGradient(x - r * 0.3, y - r * 0.6, 2, x, y, r * 1.2);
            rg.addColorStop(0, "#7fa0ad"); rg.addColorStop(1, "#2f4a58");
            c.fillStyle = rg;
            c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, Math.PI, 0); c.fill();
        }

        const count = Math.max(4, Math.round(W / 140));
        for (let i = 0; i < count; i++) {
            const x = rand(10, W - 10), y = duneY(x) + 6, col = pick(CORAL_COLORS);
            const type = Math.random();
            if (type < 0.5) branch(c, x, y, rand(20, 32), -Math.PI / 2 + rand(-0.2, 0.2), 5, 7, col);
            else if (type < 0.8) fanCoral(c, x, y, rand(35, 60), col);
            else domeCoral(c, x, y, rand(22, 36), col);
        }
    }

    function buildPlants() {
        weeds = Array.from({ length: Math.round(W / 55) }, () => ({
            x: rand(0, W), h: rand(90, 230), w: rand(6, 11), phase: rand(0, 6.3),
            speed: rand(0.0008, 0.0015), color: pick(WEED_COLORS)
        }));
        blades = Array.from({ length: Math.round(W / 8) }, () => ({
            x: rand(0, W), h: rand(16, 42), phase: rand(0, 6.3), color: pick(WEED_COLORS)
        }));
        vents = Array.from({ length: Math.max(3, Math.round(W / 350)) }, () => ({ x: rand(40, W - 40) }));
    }

    function drawWeed(wd, t) {
        const n = 12, segH = wd.h / n;
        let x = wd.x, y = duneY(wd.x) + 8;
        ctx.strokeStyle = wd.color; ctx.lineCap = "round";
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < n; i++) {
            const k = (i + 1) / n;
            const nx = wd.x + Math.sin(t * wd.speed + wd.phase + k * 2.2) * wd.h * 0.14 * k;
            const ny = y - segH;
            ctx.lineWidth = wd.w * (1 - k * 0.8) * (0.75 + 0.25 * Math.sin(k * 9 + wd.phase)) + 1;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
            x = nx; y = ny;
        }
        ctx.globalAlpha = 1;
    }

    function drawBlade(b, t) {
        const base = duneY(b.x) + 6;
        const sway = Math.sin(t / 700 + b.phase) * b.h * 0.25;
        ctx.strokeStyle = b.color; ctx.lineWidth = 2.2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(b.x, base);
        ctx.quadraticCurveTo(b.x + sway * 0.5, base - b.h * 0.55, b.x + sway, base - b.h);
        ctx.stroke();
    }

    class Fish {
        constructor(initial, opts) { this.opts = opts || null; this.reset(initial); }

        reset(initial) {
            const o = this.opts;
            this.size = o ? rand(9, 13) : rand(14, 38);
            this.dir = o ? o.dir : (Math.random() < 0.5 ? 1 : -1);
            this.speed = o ? o.speed * rand(0.95, 1.05) : rand(0.4, 1.4) * (40 / this.size + 0.5);
            this.color = o ? o.color : pick(FISH_COLORS);
            this.x = initial ? rand(0, W) : (this.dir === 1 ? -80 : W + 80) + (o ? rand(-60, 60) : 0);
            this.baseY = (o ? o.y + rand(-35, 35) : rand(H * 0.08, swimMax()));
            this.y = this.baseY;
            this.phase = rand(0, 6.3);
            this.vx = this.dir * this.speed;
            this.facing = this.dir;
        }

        update(t) {
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 140) { this.vx += (dx / dist) * 0.08; this.baseY += (dy / dist) * 1.2; }
            this.vx += (this.dir * this.speed - this.vx) * 0.02;
            if (Math.abs(this.vx) > 0.05) this.facing = Math.sign(this.vx);
            this.x += this.vx;
            this.baseY = Math.min(swimMax(), Math.max(H * 0.05, this.baseY));
            this.y = this.baseY + Math.sin(t / 700 + this.phase) * 8;
            if (this.x < -120 || this.x > W + 120) this.reset(false);
        }

        draw(t) {
            const s = this.size, wag = Math.sin(t / 120 + this.phase) * 0.35;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.facing, 1);
            ctx.globalAlpha = 0.6; ctx.fillStyle = this.color;

            ctx.save(); // ocas
            ctx.translate(-s * 0.9, 0); ctx.rotate(wag);
            ctx.beginPath(); ctx.moveTo(s * 0.3, 0); ctx.lineTo(-s * 0.55, -s * 0.5);
            ctx.lineTo(-s * 0.35, 0); ctx.lineTo(-s * 0.55, s * 0.5); ctx.closePath(); ctx.fill();
            ctx.restore();

            ctx.beginPath(); // hřbetní ploutev
            ctx.moveTo(-s * 0.2, -s * 0.38);
            ctx.quadraticCurveTo(s * 0.1, -s * 0.85, s * 0.45, -s * 0.38); ctx.fill();

            ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.52, 0, 0, 6.3); ctx.fill(); // tělo

            ctx.fillStyle = "rgba(255,255,255,0.25)"; // bříško
            ctx.beginPath(); ctx.ellipse(0, s * 0.17, s * 0.85, s * 0.28, 0, 0, 6.3); ctx.fill();

            ctx.globalAlpha = 0.9; ctx.fillStyle = "#fff"; // oko
            ctx.beginPath(); ctx.arc(s * 0.58, -s * 0.1, s * 0.13, 0, 6.3); ctx.fill();
            ctx.fillStyle = "#0a2233";
            ctx.beginPath(); ctx.arc(s * 0.62, -s * 0.1, s * 0.065, 0, 6.3); ctx.fill();
            ctx.restore();
        }
    }

    function buildFish() {
        fish = Array.from({ length: W < 700 ? 5 : 9 }, () => new Fish(true));
        const schools = W < 700 ? 1 : 2;
        for (let s = 0; s < schools; s++) {
            const opts = { dir: Math.random() < 0.5 ? 1 : -1, speed: rand(0.9, 1.4), color: pick(FISH_COLORS), y: rand(H * 0.15, swimMax() - 40) };
            for (let i = 0; i < 6; i++) fish.push(new Fish(true, opts));
        }
    }

    class Bubble {
        constructor(x, y) {
            this.r = rand(2, 11);
            this.x = x; this.y = y;
            this.speed = rand(0.7, 1.8) + this.r * 0.05;
            this.wobble = rand(0.5, 2);
            this.phase = rand(0, 6.3);
        }
        update(t) {
            this.y -= this.speed;
            this.x += Math.sin(t / 500 + this.phase) * 0.45 * this.wobble;
            this.r += 0.004;
        }
        draw() {
            const fade = Math.min(1, Math.max(0, this.y / (H * 0.12)));
            ctx.globalAlpha = fade;
            const g = ctx.createRadialGradient(this.x - this.r * 0.35, this.y - this.r * 0.35, this.r * 0.1, this.x, this.y, this.r);
            g.addColorStop(0, "rgba(255,255,255,0.6)"); g.addColorStop(1, "rgba(180,235,255,0.08)");
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.3);
            ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1; ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    function spawnBubbles() {
        if (bubbles.length > 160) return;
        if (Math.random() < 0.08) { // náhodné bubliny z písku
            const x = rand(0, W); bubbles.push(new Bubble(x, duneY(x)));
        }
        for (const v of vents) { // pramen bublin
            if (Math.random() < 0.07) bubbles.push(new Bubble(v.x + rand(-5, 5), duneY(v.x) - 2));
        }
    }

    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        seaH = Math.min(130, Math.max(70, H * 0.13));
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildDecor(); buildPlants();
        if (!fish.length) buildFish();
        else fish.forEach(f => { f.baseY = Math.min(f.baseY, swimMax()); });
    }

    function render(t, animate) {
        ctx.clearRect(0, 0, W, H);
        if (animate) {
            spawnBubbles();
            bubbles = bubbles.filter(b => b.y > -20);
            bubbles.forEach(b => b.update(t));
            fish.forEach(f => f.update(t));
        }
        bubbles.forEach(b => b.draw());
        fish.forEach(f => f.draw(t));
        ctx.drawImage(decor, 0, 0, W, H);
        weeds.forEach(w => drawWeed(w, t));
        blades.forEach(b => drawBlade(b, t));
    }

    let running = true;
    function frame(t) {
        if (!running) return;
        render(t, true);
        requestAnimationFrame(frame);
    }

    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });
    window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
        running = !document.hidden;
        if (running && !reduceMotion) requestAnimationFrame(frame);
    });

    build();
    if (reduceMotion) {
        for (let i = 0; i < 30; i++) bubbles.push(new Bubble(rand(0, W), rand(0, H * 0.8)));
        render(0, false);
    } else {
        requestAnimationFrame(frame);
    }
})();
