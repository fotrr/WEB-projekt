(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const STORE_KEY = "riv-theme";

    /* ====================== Světlý / tmavý režim ====================== */
    const toggleBtn = document.getElementById("themeToggle");
    const isDark = () => root.dataset.theme === "dark";
    const syncBtn = () => { if (toggleBtn) toggleBtn.setAttribute("aria-pressed", String(isDark())); };

    function applyTheme(t, save) {
        const run = () => {
            root.dataset.theme = t;
            syncBtn();
            window.dispatchEvent(new Event("themechange"));
        };
        if (save) { try { localStorage.setItem(STORE_KEY, t); } catch (e) {} }
        // plynulý přechod mezi režimy tam, kde ho prohlížeč umí
        if (document.startViewTransition && !reduceMotion) document.startViewTransition(run);
        else run();
    }

    syncBtn();
    if (toggleBtn) toggleBtn.addEventListener("click", () => applyTheme(isDark() ? "light" : "dark", true));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) {
        mq.addEventListener("change", e => {
            let saved = null;
            try { saved = localStorage.getItem(STORE_KEY); } catch (err) {}
            if (!saved) applyTheme(e.matches ? "dark" : "light", false);
        });
    }

    /* ============================== Moře ============================== */
    const canvas = document.getElementById("ocean");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Barevné palety pro oba režimy (stejný počet barev, ať se dá přepínat podle indexu)
    const LIGHT = {
        fish:   ["#f2a07b", "#f5cf7a", "#7cc6e8", "#9be3c8", "#f08fb0", "#b9a8f0"],
        coral:  ["#f08a8a", "#f4b183", "#b8a1e3", "#f2d17a", "#86d3c6"],
        weed:   ["#6fb58f", "#7cc59b", "#5aa68f", "#8ccf9a", "#5d9e84"],
        crab:   ["#e8806a", "#ef9a6c", "#d9695f"],
        jelly:  ["214,170,240", "240,170,205", "170,205,245"],
        star:   ["#f4a77c", "#ee8f9c", "#f2c27a"],
        sand:   ["#f6ecd0", "#e6d4a6", "#c9b27d"],
        grain:  ["rgba(255,255,255,0.35)", "rgba(120,90,40,0.10)"],
        ripple: "rgba(255,255,255,0.35)",
        rock:   ["#c3d3d9", "#7d97a1"],
        shell:  "#fbf3e2",
        urchin: "#6a5a86",
        far:    "rgba(110,165,190,",
        rays:   "255,255,255", rayA: 0.32,
        dust:   "255,255,255", dustA: 0.75,
        bubble: ["rgba(255,255,255,0.75)", "rgba(160,215,235,0.15)", "rgba(255,255,255,0.9)"],
        fishA:  0.8
    };
    const DARK = {
        fish:   ["#ff9a6b", "#ffd36b", "#58c8ff", "#6ff0c0", "#ff6fa5", "#a98bff"],
        coral:  ["#ff6b8b", "#ff9f5a", "#b06bff", "#ffcf5a", "#42d6c4"],
        weed:   ["#2f9e6b", "#3fbf7f", "#1f8a74", "#5ac26d", "#2b7f5a"],
        crab:   ["#ff7b66", "#ff9a5e", "#e8605a"],
        jelly:  ["150,200,255", "200,150,255", "120,240,230"],
        star:   ["#e9875f", "#e0708a", "#e6ad5c"],
        sand:   ["#6b6048", "#4a412d", "#2b2417"],
        grain:  ["rgba(255,255,255,0.10)", "rgba(0,0,0,0.20)"],
        ripple: "rgba(255,255,255,0.10)",
        rock:   ["#4f6772", "#1f3340"],
        shell:  "#b7ab92",
        urchin: "#3b3158",
        far:    "rgba(6,48,76,",
        rays:   "140,220,255", rayA: 0.15,
        dust:   "190,235,255", dustA: 0.55,
        bubble: ["rgba(200,240,255,0.6)", "rgba(120,200,235,0.08)", "rgba(200,240,255,0.5)"],
        fishA:  0.9
    };
    const pal = () => (isDark() ? DARK : LIGHT);

    // Seedovaný generátor: pozadí (dno, korály...) má při přepnutí režimu stejné rozložení
    const mulberry32 = a => () => {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const DECOR_SEED = (Math.random() * 4294967296) >>> 0;
    let rnd = Math.random;
    const rand = (a, b) => a + rnd() * (b - a);
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const ri = n => Math.floor(Math.random() * n);

    const shade = (hex, f) => {
        const n = parseInt(hex.slice(1), 16);
        const c = v => Math.min(255, Math.round(v * f));
        return `rgb(${c(n >> 16 & 255)},${c(n >> 8 & 255)},${c(n & 255)})`;
    };

    let W = 0, H = 0, dpr = 1, seaH = 100;
    let fish = [], bubbles = [], weeds = [], blades = [], vents = [];
    let crabs = [], jellies = [], dust = [];
    let decor = null, decorFar = null;
    const mouse = { x: -9999, y: -9999 };

    const duneY = x => H - seaH * 0.72 + Math.sin(x / 170) * 9 + Math.sin(x / 61 + 1) * 3;
    const farY = x => H - seaH * 1.3 + Math.sin(x / 260 + 2) * 16 + Math.sin(x / 95) * 5;
    const swimMax = () => H - seaH - 30;

    /* ------------------------- Tvary pro pozadí ------------------------- */
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

    function starfish(c, x, y, r, col) {
        c.save();
        c.translate(x, y); c.scale(1, 0.55); c.rotate(rand(0, 6.3));
        c.fillStyle = col; c.strokeStyle = col; c.lineWidth = r * 0.25; c.lineJoin = "round";
        c.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = i * Math.PI / 5, rr = i % 2 === 0 ? r : r * 0.42;
            c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.closePath(); c.stroke(); c.fill();
        c.fillStyle = "rgba(255,255,255,0.45)";
        for (let i = 0; i < 5; i++) {
            const a = i * 2 * Math.PI / 5;
            c.beginPath(); c.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.08, 0, 6.3); c.fill();
        }
        c.restore();
    }

    function shell(c, x, y, r, col) {
        c.fillStyle = col;
        c.beginPath(); c.moveTo(x, y); c.arc(x, y, r, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
        c.strokeStyle = "rgba(0,0,0,0.16)"; c.lineWidth = 1;
        for (let a = 1.12; a < 1.95; a += 0.12) {
            c.beginPath(); c.moveTo(x, y);
            c.lineTo(x + Math.cos(a * Math.PI) * r, y + Math.sin(a * Math.PI) * r); c.stroke();
        }
    }

    function urchin(c, x, y, r, col) {
        c.strokeStyle = col; c.lineWidth = 1.3; c.lineCap = "round";
        for (let i = 0; i < 16; i++) {
            const a = Math.PI + (i / 15) * Math.PI;
            c.beginPath(); c.moveTo(x, y);
            c.lineTo(x + Math.cos(a) * r * 1.7, y + Math.sin(a) * r * 1.7); c.stroke();
        }
        c.fillStyle = col;
        c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, Math.PI, 0); c.fill();
    }

    function mkLayer() {
        const cv = document.createElement("canvas");
        cv.width = W * dpr; cv.height = H * dpr;
        const c = cv.getContext("2d");
        c.scale(dpr, dpr);
        return [cv, c];
    }

    // vzdálená vrstva: mlžné pozadí, které dodává hloubku
    function buildFar(c, p) {
        const g = c.createLinearGradient(0, H - seaH * 1.7, 0, H);
        g.addColorStop(0, p.far + "0.28)"); g.addColorStop(1, p.far + "0.55)");
        c.fillStyle = g;
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) c.lineTo(x, farY(x));
        c.lineTo(W, H); c.closePath(); c.fill();

        for (let i = 0; i < Math.max(2, W / 420); i++) {
            const x = rand(0, W), r = rand(40, 90);
            c.fillStyle = p.far + "0.32)";
            c.beginPath(); c.ellipse(x, farY(x) + 6, r, r * 0.55, 0, Math.PI, 0); c.fill();
        }

        c.lineCap = "round";
        for (let i = 0; i < W / 90; i++) {
            const x = rand(0, W), h = rand(110, 240), y0 = farY(x) + 4, sway = rand(0, 6.3);
            c.strokeStyle = p.far + "0.2)"; c.lineWidth = rand(5, 9);
            c.beginPath(); c.moveTo(x, y0);
            for (let k = 1; k <= 10; k++) c.lineTo(x + Math.sin(k * 0.7 + sway) * h * 0.06 * (k / 10), y0 - h * k / 10);
            c.stroke();
        }

        for (let i = 0; i < W / 260; i++) {
            const x = rand(10, W - 10);
            branch(c, x, farY(x) + 6, rand(16, 26), -Math.PI / 2 + rand(-0.2, 0.2), 5, 6, p.far + "0.26)");
        }
    }

    function buildDecor() {
        rnd = mulberry32(DECOR_SEED);
        const p = pal();

        let c;
        [decorFar, c] = mkLayer();
        buildFar(c, p);

        [decor, c] = mkLayer();
        const g = c.createLinearGradient(0, H - seaH, 0, H);
        g.addColorStop(0, p.sand[0]); g.addColorStop(0.5, p.sand[1]); g.addColorStop(1, p.sand[2]);
        c.fillStyle = g;
        c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) c.lineTo(x, duneY(x));
        c.lineTo(W, H); c.closePath(); c.fill();

        for (let i = 0; i < W / 4; i++) {
            const x = rand(0, W), y = rand(duneY(x) + 4, H);
            c.fillStyle = rnd() < 0.5 ? p.grain[0] : p.grain[1];
            c.fillRect(x, y, 2, 2);
        }

        // vlnky v písku
        c.strokeStyle = p.ripple; c.lineWidth = 1.2; c.lineCap = "round";
        for (let i = 0; i < W / 70; i++) {
            const x = rand(0, W), y = duneY(x) + rand(10, seaH * 0.6), r = rand(12, 28);
            c.beginPath(); c.ellipse(x, y, r, r * 0.16, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
        }

        for (let i = 0; i < Math.max(4, W / 220); i++) {
            const x = rand(0, W), r = rand(14, 34), y = duneY(x) + 4;
            const rg = c.createRadialGradient(x - r * 0.3, y - r * 0.6, 2, x, y, r * 1.2);
            rg.addColorStop(0, p.rock[0]); rg.addColorStop(1, p.rock[1]);
            c.fillStyle = rg;
            c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, Math.PI, 0); c.fill();
        }

        for (let i = 0; i < Math.max(2, W / 480); i++) {
            const x = rand(20, W - 20);
            urchin(c, x, duneY(x) + rand(6, 14), rand(5, 8), p.urchin);
        }

        const count = Math.max(4, Math.round(W / 140));
        for (let i = 0; i < count; i++) {
            const x = rand(10, W - 10), y = duneY(x) + 6, col = pick(p.coral);
            const type = rnd();
            if (type < 0.5) branch(c, x, y, rand(20, 32), -Math.PI / 2 + rand(-0.2, 0.2), 5, 7, col);
            else if (type < 0.8) fanCoral(c, x, y, rand(35, 60), col);
            else domeCoral(c, x, y, rand(22, 36), col);
        }

        for (let i = 0; i < Math.max(3, W / 320); i++) {
            const x = rand(20, W - 20);
            starfish(c, x, duneY(x) + rand(10, seaH * 0.45), rand(9, 15), pick(p.star));
        }
        for (let i = 0; i < Math.max(3, W / 300); i++) {
            const x = rand(20, W - 20);
            shell(c, x, duneY(x) + rand(14, seaH * 0.5), rand(6, 11), p.shell);
        }

        rnd = Math.random;
    }

    function buildPlants() {
        weeds = Array.from({ length: Math.round(W / 55) }, () => ({
            x: rand(0, W), h: rand(90, 230), w: rand(6, 11), phase: rand(0, 6.3),
            speed: rand(0.0008, 0.0015), ci: ri(5)
        }));
        blades = Array.from({ length: Math.round(W / 8) }, () => ({
            x: rand(0, W), h: rand(16, 42), phase: rand(0, 6.3), ci: ri(5)
        }));
        vents = Array.from({ length: Math.max(3, Math.round(W / 350)) }, () => ({ x: rand(40, W - 40) }));
    }

    function buildDust() {
        dust = Array.from({ length: Math.min(90, Math.round(W / 16)) }, () => ({
            x: rand(0, W), y: rand(0, H * 0.9), r: rand(0.6, 1.9),
            vy: rand(0.05, 0.22), ph: rand(0, 6.3), a: rand(0.25, 0.8)
        }));
    }

    function drawWeed(wd, t) {
        const n = 12, segH = wd.h / n;
        let x = wd.x, y = duneY(wd.x) + 8;
        ctx.strokeStyle = pal().weed[wd.ci]; ctx.lineCap = "round";
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
        ctx.strokeStyle = pal().weed[b.ci]; ctx.lineWidth = 2.2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(b.x, base);
        ctx.quadraticCurveTo(b.x + sway * 0.5, base - b.h * 0.55, b.x + sway, base - b.h);
        ctx.stroke();
    }

    /* ----------------------- Světelné paprsky a hladina ----------------------- */
    function drawRays(t) {
        const p = pal(), n = W < 700 ? 3 : 6;
        for (let i = 0; i < n; i++) {
            const k = n > 1 ? i / (n - 1) : 0.5;
            const x0 = W * (0.05 + 0.9 * k) + Math.sin(t / 7000 + i * 1.7) * 60;
            const wTop = 30 + 20 * Math.sin(t / 5000 + i);
            const wBot = 170 + 60 * Math.sin(t / 6000 + i * 2);
            const slant = H * 0.25, yEnd = H * 0.9;
            const a = p.rayA * (0.65 + 0.35 * Math.sin(t / 4200 + i * 2.3));
            const g = ctx.createLinearGradient(x0, 0, x0 + slant, yEnd);
            g.addColorStop(0, `rgba(${p.rays},${a})`);
            g.addColorStop(1, `rgba(${p.rays},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x0 - wTop / 2, -10); ctx.lineTo(x0 + wTop / 2, -10);
            ctx.lineTo(x0 + slant + wBot / 2, yEnd); ctx.lineTo(x0 + slant - wBot / 2, yEnd);
            ctx.closePath(); ctx.fill();
        }
        // vlnění hladiny nahoře
        ctx.strokeStyle = `rgba(${p.rays},0.2)`; ctx.lineWidth = 1.2;
        for (let l = 0; l < 2; l++) {
            ctx.beginPath();
            for (let x = 0; x <= W + 12; x += 12) {
                const y = 8 + l * 9 + Math.sin(x / 70 + t / 1400 + l * 2) * 3;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    function drawDust(t, animate) {
        const p = pal();
        for (const d of dust) {
            if (animate) {
                d.y += d.vy;
                d.x += Math.sin(t / 2000 + d.ph) * 0.15;
                if (d.y > H - seaH * 0.7) { d.y = -5; d.x = rand(0, W); }
            }
            ctx.fillStyle = `rgba(${p.dust},${d.a * p.dustA})`;
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.3); ctx.fill();
        }
    }

    /* ------------------------------- Ryby ------------------------------- */
    class Fish {
        constructor(initial, opts) { this.opts = opts || null; this.reset(initial); }

        reset(initial) {
            const o = this.opts;
            this.z = o ? 0.9 : rand(0.55, 1); // hloubka: menší a bledší ryby jsou dál
            this.size = o ? rand(9, 13) : rand(14, 38) * this.z;
            this.dir = o ? o.dir : (Math.random() < 0.5 ? 1 : -1);
            this.speed = o ? o.speed * rand(0.95, 1.05) : rand(0.25, 0.8) * (40 / this.size + 0.5) * (0.6 + 0.4 * this.z);
            this.ci = o ? o.ci : ri(6);
            this.stripe = !o && Math.random() < 0.4;
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
            if (dist > 0 && dist < 140) { this.vx += (dx / dist) * 0.08; this.baseY += (dy / dist) * 1.2; }
            this.vx += (this.dir * this.speed - this.vx) * 0.02;
            if (Math.abs(this.vx) > 0.05) this.facing = Math.sign(this.vx);
            this.x += this.vx;
            this.baseY = Math.min(swimMax(), Math.max(H * 0.05, this.baseY));
            this.y = this.baseY + Math.sin(t / 900 + this.phase) * 5;
            if (this.x < -120 || this.x > W + 120) this.reset(false);
        }

        draw(t) {
            const p = pal();
            const s = this.size, wag = Math.sin(t / 120 + this.phase) * 0.35;
            const A = p.fishA * (0.45 + 0.55 * this.z);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.facing, 1);
            ctx.globalAlpha = A; ctx.fillStyle = p.fish[this.ci];

            ctx.save(); // ocas
            ctx.translate(-s * 0.9, 0); ctx.rotate(wag);
            ctx.beginPath(); ctx.moveTo(s * 0.3, 0); ctx.lineTo(-s * 0.55, -s * 0.5);
            ctx.lineTo(-s * 0.35, 0); ctx.lineTo(-s * 0.55, s * 0.5); ctx.closePath(); ctx.fill();
            ctx.restore();

            ctx.beginPath(); // hřbetní ploutev
            ctx.moveTo(-s * 0.2, -s * 0.38);
            ctx.quadraticCurveTo(s * 0.1, -s * 0.85, s * 0.45, -s * 0.38); ctx.fill();

            ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.52, 0, 0, 6.3); ctx.fill(); // tělo

            if (this.stripe) { // pruhy
                ctx.save();
                ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.52, 0, 0, 6.3); ctx.clip();
                ctx.fillStyle = "rgba(255,255,255,0.35)";
                ctx.fillRect(-s * 0.15, -s, s * 0.18, s * 2);
                ctx.fillRect(s * 0.35, -s, s * 0.12, s * 2);
                ctx.restore();
            }

            ctx.fillStyle = "rgba(255,255,255,0.25)"; // bříško
            ctx.beginPath(); ctx.ellipse(0, s * 0.17, s * 0.85, s * 0.28, 0, 0, 6.3); ctx.fill();

            ctx.globalAlpha = Math.min(1, A + 0.15); ctx.fillStyle = "#fff"; // oko
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
            const opts = { dir: Math.random() < 0.5 ? 1 : -1, speed: rand(0.6, 0.9), ci: ri(6), y: rand(H * 0.15, swimMax() - 40) };
            for (let i = 0; i < 6; i++) fish.push(new Fish(true, opts));
        }
    }

    /* ------------------------------- Krabi ------------------------------- */
    class Crab {
        constructor() {
            this.ci = ri(3);
            this.s = rand(11, 17) * (W < 700 ? 0.85 : 1);
            this.x = rand(40, Math.max(41, W - 40));
            this.dir = Math.random() < 0.5 ? 1 : -1;
            this.state = "walk";
            this.timer = rand(80, 260);
            this.speed = rand(0.18, 0.4);
            this.ph = rand(0, 6.3);
            this.claw = rand(0, 6.3);
            this.v = 0;
        }

        update() {
            const dx = this.x - mouse.x, dy = duneY(this.x) - mouse.y;
            const dist = Math.hypot(dx, dy);
            let target = 0;
            if (dist > 0 && dist < 130) { // uteče před kurzorem
                this.dir = dx >= 0 ? 1 : -1;
                target = this.dir * this.speed * 3.2;
                this.state = "flee";
            } else {
                if (this.state === "flee") { this.state = "walk"; this.timer = rand(60, 160); }
                if (--this.timer <= 0) {
                    if (this.state === "walk") { this.state = "idle"; this.timer = rand(60, 200); }
                    else { this.state = "walk"; this.timer = rand(120, 400); if (Math.random() < 0.5) this.dir *= -1; }
                }
                target = this.state === "walk" ? this.dir * this.speed : 0;
            }
            this.v += (target - this.v) * 0.08;
            this.x += this.v;
            if (this.x < 30) { this.x = 30; this.dir = 1; }
            if (this.x > W - 30) { this.x = W - 30; this.dir = -1; }
            this.ph += Math.abs(this.v) * 0.22;
        }

        draw(t) {
            const p = pal(), s = this.s;
            const base = p.crab[this.ci], dk = shade(base, 0.68), lt = shade(base, 1.2);
            const moving = Math.abs(this.v) > 0.05;
            const slope = Math.atan2(duneY(this.x + 5) - duneY(this.x - 5), 10);

            ctx.save();
            ctx.translate(this.x, duneY(this.x) - s * 0.72 + 2);
            ctx.rotate(slope * 0.7);
            ctx.lineCap = "round"; ctx.lineJoin = "round";

            // nohy (3 páry)
            ctx.strokeStyle = dk; ctx.lineWidth = s * 0.13;
            for (const side of [-1, 1]) {
                for (let i = 0; i < 3; i++) {
                    const a = this.ph + i * 2.1 + (side > 0 ? Math.PI : 0);
                    const sw = moving ? Math.sin(a) * s * 0.17 : 0;
                    const lf = moving ? Math.max(0, Math.cos(a)) * s * 0.18 : 0;
                    const hx = side * s * (0.5 + i * 0.08), hy = s * (0.05 + i * 0.1);
                    const kx = hx + side * s * 0.5, ky = hy - s * 0.2 - lf;
                    const fx = kx + side * s * 0.22 + sw, fy = s * 0.72 - lf;
                    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
                }
            }

            // krunýř
            const bg = ctx.createRadialGradient(-s * 0.25, -s * 0.3, s * 0.1, 0, 0, s * 1.05);
            bg.addColorStop(0, lt); bg.addColorStop(0.6, base); bg.addColorStop(1, dk);
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.62, 0, 0, 6.3); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.28)";
            ctx.beginPath(); ctx.ellipse(-s * 0.28, -s * 0.28, s * 0.38, s * 0.13, -0.2, 0, 6.3); ctx.fill();
            ctx.fillStyle = "rgba(0,0,0,0.14)";
            for (const [x, y, r] of [[0.15, 0.05, 0.09], [-0.3, 0.15, 0.07], [0.4, 0.2, 0.07]]) {
                ctx.beginPath(); ctx.ellipse(x * s, y * s, r * s, r * s * 0.7, 0, 0, 6.3); ctx.fill();
            }

            // klepeta
            for (const side of [-1, 1]) {
                const raise = moving
                    ? Math.sin(this.ph * 2 + side) * s * 0.04
                    : s * 0.12 + Math.sin(t / 450 + this.claw + side * 1.3) * s * 0.1;
                const ex = side * s * 1.0, ey = -s * 0.35 - raise;
                const cx = side * s * 1.2, cy = -s * 0.85 - raise;
                ctx.strokeStyle = dk; ctx.lineWidth = s * 0.17;
                ctx.beginPath(); ctx.moveTo(side * s * 0.72, -s * 0.08); ctx.lineTo(ex, ey); ctx.lineTo(cx, cy + s * 0.2); ctx.stroke();
                ctx.save();
                ctx.translate(cx, cy); ctx.rotate(side * 0.35);
                ctx.fillStyle = base;
                ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.38, 0, 0, 6.3); ctx.fill();
                ctx.fillStyle = "rgba(255,255,255,0.25)";
                ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.1, s * 0.09, s * 0.14, 0, 0, 6.3); ctx.fill();
                ctx.strokeStyle = dk; ctx.lineWidth = Math.max(1, s * 0.06);
                ctx.beginPath(); ctx.moveTo(0, -s * 0.02); ctx.lineTo(side * s * 0.05, -s * 0.38); ctx.stroke();
                ctx.restore();
            }

            // oči na stopkách
            for (const side of [-1, 1]) {
                const ex = side * s * 0.34, ey = -s * 0.84;
                ctx.strokeStyle = dk; ctx.lineWidth = s * 0.08;
                ctx.beginPath(); ctx.moveTo(side * s * 0.26, -s * 0.5); ctx.lineTo(ex, ey); ctx.stroke();
                ctx.fillStyle = "#fff";
                ctx.beginPath(); ctx.arc(ex, ey, s * 0.14, 0, 6.3); ctx.fill();
                ctx.fillStyle = "#0a2233";
                ctx.beginPath(); ctx.arc(ex + Math.sign(this.v) * s * 0.03, ey, s * 0.07, 0, 6.3); ctx.fill();
            }
            ctx.restore();
        }
    }

    function buildCrabs() {
        crabs = Array.from({ length: Math.min(5, Math.max(2, Math.round(W / 380))) }, () => new Crab());
    }

    /* ----------------------------- Medúzy ----------------------------- */
    class Jelly {
        constructor() { this.reset(true); }

        reset(initial) {
            this.s = rand(16, 28);
            this.ci = ri(3);
            this.x = rand(W * 0.08, W * 0.92);
            this.y = initial ? rand(H * 0.12, swimMax() * 0.85) : swimMax() + 50;
            this.ph = rand(0, 6.3);
            this.drift = rand(0.08, 0.25);
        }

        update(t) {
            const pulse = Math.sin(t / 700 + this.ph);
            this.y += pulse > 0 ? -(0.1 + pulse * 0.45) : 0.06;
            this.x += Math.sin(t / 3200 + this.ph) * this.drift;
            if (this.y < -70) this.reset(false);
        }

        draw(t) {
            const p = pal(), c = p.jelly[this.ci], s = this.s;
            const pulse = Math.sin(t / 700 + this.ph);
            const w = s * (1 - 0.1 * pulse), h = s * 0.75 * (1 + 0.14 * pulse);
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.lineCap = "round";

            // chapadla
            ctx.strokeStyle = `rgba(${c},0.45)`; ctx.lineWidth = 1.4;
            for (let j = 0; j < 6; j++) {
                const tx = -w * 0.75 + j * (w * 1.5 / 5);
                ctx.beginPath(); ctx.moveTo(tx, 0);
                for (let k = 1; k <= 5; k++) ctx.lineTo(tx + Math.sin(t / 450 + j * 0.9 + k * 0.8) * s * 0.12 * k / 2, k * s * 0.34);
                ctx.stroke();
            }
            // ústní ramena
            ctx.strokeStyle = `rgba(${c},0.3)`; ctx.lineWidth = 3.2;
            for (const side of [-1, 1]) {
                ctx.beginPath(); ctx.moveTo(side * w * 0.18, 0);
                for (let k = 1; k <= 4; k++) ctx.lineTo(side * w * 0.18 + Math.sin(t / 520 + k * 0.9 + side) * s * 0.1 * k / 2, k * s * 0.3);
                ctx.stroke();
            }

            // zvon (v tmavém režimu se jemně svítí)
            if (isDark()) { ctx.shadowColor = `rgba(${c},0.8)`; ctx.shadowBlur = 16; }
            ctx.fillStyle = `rgba(${c},0.55)`;
            ctx.beginPath();
            ctx.moveTo(-w, 0);
            ctx.bezierCurveTo(-w, -h * 1.5, w, -h * 1.5, w, 0);
            ctx.quadraticCurveTo(w * 0.5, h * 0.22, 0, 0);
            ctx.quadraticCurveTo(-w * 0.5, h * 0.22, -w, 0);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.beginPath(); ctx.ellipse(-w * 0.3, -h * 0.85, w * 0.28, h * 0.18, -0.4, 0, 6.3); ctx.fill();
            ctx.restore();
        }
    }

    function buildJellies() {
        jellies = Array.from({ length: W < 700 ? 1 : 3 }, () => new Jelly());
    }

    /* ------------------------------ Bubliny ------------------------------ */
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
            const b = pal().bubble;
            const fade = Math.min(1, Math.max(0, this.y / (H * 0.12)));
            ctx.globalAlpha = fade;
            const g = ctx.createRadialGradient(this.x - this.r * 0.35, this.y - this.r * 0.35, this.r * 0.1, this.x, this.y, this.r);
            g.addColorStop(0, b[0]); g.addColorStop(1, b[1]);
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.3);
            ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = b[2]; ctx.lineWidth = 1; ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    function spawnBubbles() {
        if (bubbles.length > 70) return;
        if (Math.random() < 0.035) { // náhodné bubliny z písku
            const x = rand(0, W); bubbles.push(new Bubble(x, duneY(x)));
        }
        for (const v of vents) { // pramen bublin
            if (Math.random() < 0.035) bubbles.push(new Bubble(v.x + rand(-5, 5), duneY(v.x) - 2));
        }
    }

    /* ------------------------- Sestavení a smyčka ------------------------- */
    function build() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        seaH = Math.min(130, Math.max(70, H * 0.13));
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildDecor(); buildPlants(); buildDust();

        if (!fish.length) buildFish();
        else fish.forEach(f => { f.baseY = Math.min(f.baseY, swimMax()); });
        if (!crabs.length) buildCrabs();
        else crabs.forEach(c => { c.x = Math.min(c.x, W - 30); });
        if (!jellies.length) buildJellies();
        else jellies.forEach(j => { j.x = Math.min(j.x, W * 0.92); j.y = Math.min(j.y, swimMax()); });

        if (reduceMotion) {
            if (!bubbles.length) for (let i = 0; i < 30; i++) bubbles.push(new Bubble(rand(0, W), rand(0, H * 0.8)));
            render(0, false);
        }
    }

    function render(t, animate) {
        ctx.clearRect(0, 0, W, H);
        if (animate) {
            spawnBubbles();
            bubbles = bubbles.filter(b => b.y > -20);
            bubbles.forEach(b => b.update(t));
            fish.forEach(f => f.update(t));
            crabs.forEach(c => c.update());
            jellies.forEach(j => j.update(t));
        }
        drawRays(t);
        ctx.drawImage(decorFar, 0, 0, W, H);
        drawDust(t, animate);
        jellies.forEach(j => j.draw(t));
        bubbles.forEach(b => b.draw());
        fish.forEach(f => f.draw(t));
        ctx.drawImage(decor, 0, 0, W, H);
        crabs.forEach(c => c.draw(t));
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
    document.documentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });
    window.addEventListener("themechange", () => {
        buildDecor();
        if (reduceMotion) render(0, false);
    });
    document.addEventListener("visibilitychange", () => {
        const was = running;
        running = !document.hidden;
        if (running && !was && !reduceMotion) requestAnimationFrame(frame);
    });

    build();
    if (!reduceMotion) requestAnimationFrame(frame);
})();