/**
 * JS/lantern_festival.js - Chinese Dragon Lantern Festival Ambient Background
 * Features: Floating Sky Lanterns, Flying Golden Dragon, Hanging Palace Lanterns & Festival Sparks
 */

(() => {
    const canvas = document.getElementById("festivalCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, dpr = 1;

    // ==================== SKY LANTERNS (孔明灯) ====================
    class SkyLantern {
        constructor(initial = false) {
            this.reset(initial);
        }

        reset(initial = false) {
            this.x = Math.random() * W;
            this.y = initial ? Math.random() * H : H + 30 + Math.random() * 80;
            this.w = 12 + Math.random() * 20;
            this.h = this.w * 1.35;
            this.speedY = 0.35 + Math.random() * 0.7;
            this.swaySpeed = 0.001 + Math.random() * 0.002;
            this.swayAmp = 10 + Math.random() * 25;
            this.phase = Math.random() * Math.PI * 2;
            this.alpha = 0.45 + Math.random() * 0.5;
            // Warm lantern gradient hue (amber-gold to deep crimson)
            this.glowR = Math.floor(255);
            this.glowG = Math.floor(140 + Math.random() * 80);
            this.glowB = Math.floor(30 + Math.random() * 40);
        }

        update(t) {
            this.y -= this.speedY;
            this.x += Math.sin(t * this.swaySpeed + this.phase) * 0.35;

            if (this.y < -60) {
                this.reset(false);
            }
        }

        draw(t) {
            const flicker = 0.88 + 0.12 * Math.sin(t * 0.01 + this.phase * 5);
            const a = this.alpha * flicker;

            ctx.save();
            ctx.translate(this.x, this.y);

            // Ambient outer glow
            const glow = ctx.createRadialGradient(0, 0, this.w * 0.2, 0, 0, this.w * 2.2);
            glow.addColorStop(0, `rgba(${this.glowR},${this.glowG},${this.glowB},${a * 0.6})`);
            glow.addColorStop(0.5, `rgba(${this.glowR},80,20,${a * 0.2})`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, this.w * 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Lantern Paper Body (curved cylinder)
            const bodyGrad = ctx.createLinearGradient(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
            bodyGrad.addColorStop(0, `rgba(255, 230, 150, ${a * 0.95})`);
            bodyGrad.addColorStop(0.5, `rgba(${this.glowR}, ${this.glowG}, ${this.glowB}, ${a * 0.85})`);
            bodyGrad.addColorStop(1, `rgba(180, 40, 20, ${a * 0.9})`);

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, [4, 4, 8, 8]);
            ctx.fill();

            // Inner Candle Flame
            const flameGrad = ctx.createRadialGradient(0, this.h * 0.25, 1, 0, this.h * 0.25, this.w * 0.4);
            flameGrad.addColorStop(0, `rgba(255, 255, 255, ${a})`);
            flameGrad.addColorStop(0.6, `rgba(255, 220, 100, ${a * 0.9})`);
            flameGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.arc(0, this.h * 0.25, this.w * 0.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ==================== SOARING GOLDEN WINGED DRAGON (应龙 / 腾龙) ====================
    class CelestialDragon {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = -260;
            this.y = H * (0.16 + Math.random() * 0.38);
            this.speed = 1.8 + Math.random() * 0.7;
            this.segmentCount = 36;
            this.segmentDist = 15;
            this.segments = Array.from({ length: this.segmentCount }, (_, i) => ({
                x: this.x - i * this.segmentDist,
                y: this.y,
                size: Math.max(8, 30 - i * 0.65),
                angle: 0
            }));
            this.waveAmp = 42;
            this.waveFreq = 0.0028;
            this.wingFlapPhase = 0;
            this.breathParticles = [];
        }

        update(t) {
            this.x += this.speed;
            this.y += Math.sin(t * 0.0009) * 0.45;

            // Head undulation
            const headY = this.y + Math.sin(t * this.waveFreq * 4 + this.x * 0.007) * this.waveAmp;
            this.segments[0].x = this.x;
            this.segments[0].y = headY;

            // Follower segments with orientation tracking
            for (let i = 1; i < this.segmentCount; i++) {
                const prev = this.segments[i - 1];
                const curr = this.segments[i];
                const dx = prev.x - curr.x;
                const dy = prev.y - curr.y;
                const dist = Math.hypot(dx, dy);

                curr.angle = Math.atan2(dy, dx);

                if (dist > this.segmentDist) {
                    curr.x = prev.x - (dx / dist) * this.segmentDist;
                    curr.y = prev.y - (dy / dist) * this.segmentDist;
                }
            }

            // Head orientation matches direction to segment 1
            const hdx = this.segments[0].x - this.segments[1].x;
            const hdy = this.segments[0].y - this.segments[1].y;
            this.segments[0].angle = Math.atan2(hdy, hdx);

            // Dragon breath embers
            if (Math.random() < 0.4) {
                const head = this.segments[0];
                const hAngle = head.angle;
                this.breathParticles.push({
                    x: head.x + Math.cos(hAngle) * 35,
                    y: head.y + Math.sin(hAngle) * 35,
                    vx: Math.cos(hAngle + (Math.random() - 0.5) * 0.5) * (this.speed + 1.2),
                    vy: Math.sin(hAngle + (Math.random() - 0.5) * 0.5) * (this.speed + 0.8),
                    life: 1,
                    decay: 0.02 + Math.random() * 0.03,
                    size: 2 + Math.random() * 3
                });
            }

            for (let i = this.breathParticles.length - 1; i >= 0; i--) {
                const p = this.breathParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                if (p.life <= 0) this.breathParticles.splice(i, 1);
            }

            if (this.segments[this.segmentCount - 1].x > W + 300) {
                this.reset();
            }
        }

        draw(t) {
            ctx.save();

            // 1. Dragon Breath Embers
            for (const p of this.breathParticles) {
                ctx.fillStyle = `rgba(255, ${Math.floor(180 * p.life + 75)}, 50, ${p.life * 0.85})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }

            // 2. Dragon Pearl (火龙珠) orbiting in front of dragon
            const head = this.segments[0];
            const pearlDist = 65;
            const pearlOrbit = t * 0.003;
            const pearlX = head.x + Math.cos(head.angle) * pearlDist + Math.cos(pearlOrbit) * 18;
            const pearlY = head.y + Math.sin(head.angle) * pearlDist + Math.sin(pearlOrbit * 1.5) * 22;

            const pearlGlow = ctx.createRadialGradient(pearlX, pearlY, 2, pearlX, pearlY, 32);
            pearlGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            pearlGlow.addColorStop(0.3, 'rgba(255, 215, 0, 0.7)');
            pearlGlow.addColorStop(0.7, 'rgba(239, 68, 68, 0.25)');
            pearlGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = pearlGlow;
            ctx.beginPath();
            ctx.arc(pearlX, pearlY, 32, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff7ed';
            ctx.beginPath();
            ctx.arc(pearlX, pearlY, 7, 0, Math.PI * 2);
            ctx.fill();

            // 3. Draw Body Segments (from tail to head)
            for (let i = this.segmentCount - 1; i >= 0; i--) {
                const seg = this.segments[i];
                const ratio = (this.segmentCount - i) / this.segmentCount;
                const size = seg.size;

                // Segment aura glow
                const g = ctx.createRadialGradient(seg.x, seg.y, size * 0.2, seg.x, seg.y, size * 2.2);
                g.addColorStop(0, `rgba(255, 215, 0, ${0.45 * ratio})`);
                g.addColorStop(0.5, `rgba(249, 115, 22, ${0.18 * ratio})`);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(seg.x, seg.y, size * 2.2, 0, Math.PI * 2);
                ctx.fill();

                // Underbelly (lighter gold)
                ctx.save();
                ctx.translate(seg.x, seg.y);
                ctx.rotate(seg.angle);

                // Body Scale Bead
                const bodyGrad = ctx.createLinearGradient(0, -size * 0.7, 0, size * 0.7);
                bodyGrad.addColorStop(0, '#b91c1c'); // Crimson spine
                bodyGrad.addColorStop(0.4, '#d97706'); // Imperial amber
                bodyGrad.addColorStop(0.8, '#ffd700'); // Gold scale
                bodyGrad.addColorStop(1, '#fef08a'); // Pale belly

                ctx.fillStyle = bodyGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, size * 0.9, size * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();

                // Dorsal Serrated Fire Fin
                if (i > 1 && i < this.segmentCount - 1) {
                    const finHeight = size * 0.9;
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 235, 120, 0.85)' : 'rgba(239, 68, 68, 0.85)';
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 0.65);
                    ctx.lineTo(-size * 0.4, -size * 0.65 - finHeight);
                    ctx.lineTo(size * 0.3, -size * 0.65);
                    ctx.closePath();
                    ctx.fill();
                }

                // Claws attached to segments 8 (front) and 20 (back)
                if (i === 8 || i === 20) {
                    this.drawClaw(ctx, size, t, i === 8 ? 1 : -1);
                }

                // Tail flame fan on last 3 segments
                if (i === this.segmentCount - 1) {
                    this.drawTailFan(ctx, size, t);
                }

                ctx.restore();

                // 4. MAJESTIC DRAGON WINGS on segments 4 and 5
                if (i === 4) {
                    this.drawDragonWings(ctx, seg, t);
                }
            }

            // 5. PROPER IMPERIAL DRAGON HEAD (DETAILED)
            this.drawDetailedHead(ctx, head, t);

            ctx.restore();
        }

        drawClaw(c, size, t, legDir) {
            c.save();
            const clawAngle = Math.sin(t * 0.003 + legDir) * 0.35 + 0.6;
            c.rotate(clawAngle);

            // Leg thigh
            c.strokeStyle = '#b91c1c';
            c.lineWidth = size * 0.32;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(0, size * 1.1);
            c.stroke();

            // Foot & 4 Sharp Golden Talons
            c.translate(0, size * 1.1);
            c.strokeStyle = '#ffd700';
            c.lineWidth = 2.5;

            [-0.45, -0.15, 0.15, 0.45].forEach(ang => {
                c.save();
                c.rotate(ang);
                c.beginPath();
                c.moveTo(0, 0);
                c.lineTo(0, size * 0.65);
                c.lineTo(size * 0.2, size * 0.85); // curved claw tip
                c.stroke();
                c.restore();
            });

            c.restore();
        }

        drawDragonWings(c, seg, t) {
            c.save();
            c.translate(seg.x, seg.y);
            c.rotate(seg.angle);

            // Flapping motion: dynamic wing span & angle
            const flap = Math.sin(t * 0.0045);
            const wingSpreadY = flap * 45; // undulating flap
            const wingLen = 145;

            // Draw Top Wing & Bottom Wing
            [-1, 1].forEach(side => {
                c.save();
                c.scale(1, side);

                const jointX = -10;
                const jointY = -12;
                const elbowX = 35;
                const elbowY = -85 - wingSpreadY * side;
                const tip1X = 110;
                const tip1Y = -135 - wingSpreadY * side * 1.3;
                const tip2X = 80;
                const tip2Y = -115 - wingSpreadY * side;
                const tip3X = 40;
                const tip3Y = -80 - wingSpreadY * side * 0.8;

                // Wing membrane gradient (glowing amber/crimson silk)
                const wingGrad = c.createLinearGradient(jointX, jointY, tip1X, tip1Y);
                wingGrad.addColorStop(0, 'rgba(185, 28, 28, 0.75)');
                wingGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.6)');
                wingGrad.addColorStop(0.85, 'rgba(255, 215, 0, 0.55)');
                wingGrad.addColorStop(1, 'rgba(254, 240, 138, 0.7)');

                // Membrane webs
                c.fillStyle = wingGrad;
                c.beginPath();
                c.moveTo(jointX, jointY);
                c.quadraticCurveTo((jointX + elbowX) / 2, (jointY + elbowY) / 2 - 15, elbowX, elbowY);
                c.quadraticCurveTo((elbowX + tip1X) / 2, (elbowY + tip1Y) / 2 - 15, tip1X, tip1Y);
                c.quadraticCurveTo(tip1X - 15, tip2Y - 10, tip2X, tip2Y);
                c.quadraticCurveTo(tip2X - 15, tip3Y - 10, tip3X, tip3Y);
                c.quadraticCurveTo(tip3X - 20, jointY - 10, jointX - 25, jointY);
                c.closePath();
                c.fill();

                // Golden Wing Bone Armature
                c.strokeStyle = '#ffd700';
                c.lineWidth = 3.5;
                c.lineCap = 'round';
                c.beginPath();
                c.moveTo(jointX, jointY);
                c.lineTo(elbowX, elbowY);
                c.lineTo(tip1X, tip1Y);
                c.stroke();

                // Bone struts
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(elbowX, elbowY);
                c.lineTo(tip2X, tip2Y);
                c.moveTo(elbowX, elbowY);
                c.lineTo(tip3X, tip3Y);
                c.stroke();

                // Wing Thumb Claw
                c.fillStyle = '#fffbeb';
                c.beginPath();
                c.arc(elbowX, elbowY, 4, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.moveTo(elbowX, elbowY);
                c.lineTo(elbowX + 12, elbowY - 6);
                c.lineTo(elbowX + 2, elbowY + 4);
                c.fill();

                c.restore();
            });

            c.restore();
        }

        drawTailFan(c, size, t) {
            c.save();
            const tailWave = Math.sin(t * 0.006) * 18;
            c.translate(-size, 0);

            // Fiery Tassel Fan
            for (let k = -2; k <= 2; k++) {
                c.save();
                c.rotate((k * 0.22) + tailWave * 0.01);
                const fanGrad = c.createLinearGradient(0, 0, -size * 3.5, 0);
                fanGrad.addColorStop(0, '#ffd700');
                fanGrad.addColorStop(0.5, '#ea580c');
                fanGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
                c.fillStyle = fanGrad;
                c.beginPath();
                c.moveTo(0, -size * 0.3);
                c.quadraticCurveTo(-size * 2, -size * 0.6, -size * 3.5, 0);
                c.quadraticCurveTo(-size * 2, size * 0.6, 0, size * 0.3);
                c.closePath();
                c.fill();
                c.restore();
            }
            c.restore();
        }

        drawDetailedHead(c, head, t) {
            c.save();
            c.translate(head.x, head.y);
            c.rotate(head.angle);

            // Ambient Dragon Crown Glow
            const headGlow = c.createRadialGradient(15, 0, 8, 15, 0, 70);
            headGlow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
            headGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
            headGlow.addColorStop(1, 'rgba(0,0,0,0)');
            c.fillStyle = headGlow;
            c.beginPath();
            c.arc(15, 0, 70, 0, Math.PI * 2);
            c.fill();

            // 1. Flowing Mane / Crown Hair (flowing behind head)
            for (let m = 0; m < 5; m++) {
                const maneWave = Math.sin(t * 0.007 + m) * 12;
                const mGrad = c.createLinearGradient(0, 0, -60, (m - 2) * 14);
                mGrad.addColorStop(0, '#ffd700');
                mGrad.addColorStop(0.4, '#dc2626');
                mGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
                c.fillStyle = mGrad;
                c.beginPath();
                c.moveTo(-5, (m - 2) * 6);
                c.quadraticCurveTo(-35, (m - 2) * 12 + maneWave, -70, (m - 2) * 18 + maneWave * 1.5);
                c.quadraticCurveTo(-35, (m - 2) * 8, 5, (m - 2) * 5);
                c.closePath();
                c.fill();
            }

            // 2. Imperial Antler Horns (Branching Stags Horns)
            [-1, 1].forEach(hSide => {
                c.save();
                c.scale(1, hSide);
                c.strokeStyle = '#ffd700';
                c.lineWidth = 3.5;
                c.lineCap = 'round';

                // Main antler beam
                c.beginPath();
                c.moveTo(-2, -10);
                c.quadraticCurveTo(-25, -35, -55, -45);
                c.stroke();

                // Branch 1
                c.lineWidth = 2.5;
                c.beginPath();
                c.moveTo(-22, -28);
                c.quadraticCurveTo(-28, -48, -42, -58);
                c.stroke();

                // Branch 2
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(-38, -38);
                c.quadraticCurveTo(-46, -55, -62, -62);
                c.stroke();

                c.restore();
            });

            // 3. Head & Snout Structure (Císařská Dračí Lebka)
            const skullGrad = c.createLinearGradient(-15, -18, 45, 15);
            skullGrad.addColorStop(0, '#991b1b');
            skullGrad.addColorStop(0.35, '#d97706');
            skullGrad.addColorStop(0.75, '#ffd700');
            skullGrad.addColorStop(1, '#fef08a');
            c.fillStyle = skullGrad;

            c.beginPath();
            c.moveTo(-15, -14); // Back of crown
            c.lineTo(10, -18);  // Brow ridge
            c.lineTo(26, -16);  // Forehead
            c.lineTo(44, -7);   // Upper snout / nose horn
            c.lineTo(48, -3);   // Snout tip
            c.lineTo(42, 6);    // Upper lip
            c.lineTo(20, 8);    // Jaw hinge
            c.lineTo(34, 16);   // Lower open jaw
            c.lineTo(30, 20);   // Chin
            c.lineTo(8, 14);    // Throat
            c.lineTo(-12, 12);  // Under-neck
            c.closePath();
            c.fill();

            // 4. Sharp Pearly Teeth & Fangs
            c.fillStyle = '#ffffff';
            // Upper fangs
            c.beginPath();
            c.moveTo(40, -1);
            c.lineTo(38, 8);
            c.lineTo(35, 1);
            c.fill();

            c.beginPath();
            c.moveTo(28, 4);
            c.lineTo(26, 10);
            c.lineTo(23, 5);
            c.fill();

            // Lower fangs
            c.beginPath();
            c.moveTo(32, 16);
            c.lineTo(34, 9);
            c.lineTo(36, 17);
            c.fill();

            // 5. Fierce Glowing Dragon Eye
            c.save();
            const eyeX = 14;
            const eyeY = -6;

            // Eye socket shadow
            c.fillStyle = '#450a0a';
            c.beginPath();
            c.ellipse(eyeX, eyeY, 7, 5, -0.15, 0, Math.PI * 2);
            c.fill();

            // Glowing Amber Iris
            const eyeGlow = c.createRadialGradient(eyeX, eyeY, 1, eyeX, eyeY, 6);
            eyeGlow.addColorStop(0, '#ffffff');
            eyeGlow.addColorStop(0.4, '#ffd700');
            eyeGlow.addColorStop(0.85, '#ea580c');
            eyeGlow.addColorStop(1, '#7f1d1d');
            c.fillStyle = eyeGlow;
            c.beginPath();
            c.ellipse(eyeX, eyeY, 5, 4, -0.15, 0, Math.PI * 2);
            c.fill();

            // Dark Slit Pupil
            c.fillStyle = '#0f0406';
            c.beginPath();
            c.ellipse(eyeX + 0.5, eyeY, 1.4, 3.5, 0.1, 0, Math.PI * 2);
            c.fill();

            // Eye highlight
            c.fillStyle = '#ffffff';
            c.beginPath();
            c.arc(eyeX - 1.5, eyeY - 1.5, 1.2, 0, Math.PI * 2);
            c.fill();
            c.restore();

            // 6. Imperial Chin Beard (龙髯)
            c.save();
            const beardWave = Math.sin(t * 0.008) * 8;
            c.strokeStyle = '#fef08a';
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(28, 18);
            c.quadraticCurveTo(25, 38 + beardWave, 10, 52 + beardWave * 1.3);
            c.stroke();
            c.beginPath();
            c.moveTo(22, 17);
            c.quadraticCurveTo(16, 35 + beardWave, 2, 48 + beardWave * 1.2);
            c.stroke();
            c.restore();

            // 7. Dynamic Twin Whiskers (龙须)
            c.save();
            [-1, 1].forEach((wSide, wIdx) => {
                c.strokeStyle = 'rgba(255, 230, 120, 0.95)';
                c.lineWidth = 2.2;
                c.lineCap = 'round';

                const wPhase = t * 0.007 + wIdx * 1.8;
                const cp1x = 75 + Math.cos(wPhase) * 15;
                const cp1y = (wSide * 18) + Math.sin(wPhase) * 22;
                const cp2x = 115 + Math.sin(wPhase * 1.3) * 20;
                const cp2y = (wSide * 28) + Math.cos(wPhase) * 26;
                const endX = 160 + Math.cos(wPhase * 0.9) * 25;
                const endY = (wSide * 20) + Math.sin(wPhase * 1.2) * 32;

                c.beginPath();
                c.moveTo(42, -2 + wSide * 5);
                c.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
                c.stroke();

                // Whisker tip spark
                c.fillStyle = '#fffbeb';
                c.beginPath();
                c.arc(endX, endY, 2.5, 0, Math.PI * 2);
                c.fill();
            });
            c.restore();

            c.restore();
        }
    }

    // ==================== FESTIVAL SPARKS & FIREFLIES ====================
    class Sparkle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.r = 0.8 + Math.random() * 2.2;
            this.vy = -(0.2 + Math.random() * 0.5);
            this.vx = (Math.random() - 0.5) * 0.4;
            this.life = 60 + Math.random() * 140;
            this.maxLife = this.life;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (--this.life <= 0 || this.y < -10) this.reset();
        }

        draw() {
            const a = (this.life / this.maxLife) * 0.85;
            ctx.fillStyle = `rgba(255, 215, 100, ${a})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ==================== HANGING PALACE LANTERNS (红灯笼) ====================
    function drawHangingLantern(x, y, size, angle, t) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Hanging string
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.8);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Top Gold Cap
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-size * 0.35, 0, size * 0.7, size * 0.15);

        // Lantern Body
        const lg = ctx.createRadialGradient(0, size * 0.55, size * 0.1, 0, size * 0.55, size * 0.65);
        lg.addColorStop(0, '#fef08a');
        lg.addColorStop(0.4, '#dc2626');
        lg.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.55, size * 0.5, size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold Vertical Ribs
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.55, size * 0.28, size * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, size * 0.1);
        ctx.lineTo(0, size);
        ctx.stroke();

        // Bottom Gold Cap & Hanging Tassel (流苏)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-size * 0.35, size, size * 0.7, size * 0.15);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        const tasselSway = Math.sin(t * 0.002 + x) * 6;
        ctx.beginPath();
        ctx.moveTo(0, size * 1.15);
        ctx.quadraticCurveTo(tasselSway * 0.5, size * 1.5, tasselSway, size * 1.9);
        ctx.stroke();

        // Radial Lantern Ambient Warmth
        const glow = ctx.createRadialGradient(0, size * 0.55, 4, 0, size * 0.55, size * 1.8);
        glow.addColorStop(0, 'rgba(255, 180, 40, 0.3)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, size * 0.55, size * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ==================== SCENE SETUP & ANIMATION LOOP ====================
    let lanterns = [];
    let dragon = null;
    let sparkles = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.max(25, Math.round(W / 45));
        lanterns = Array.from({ length: count }, () => new SkyLantern(true));
        dragon = new CelestialDragon();
        sparkles = Array.from({ length: Math.min(70, Math.round(W / 20)) }, () => new Sparkle());
    }

    function render(t) {
        // Deep Night Sky with Imperial Festival Ambiance
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0c0205');
        bgGrad.addColorStop(0.5, '#1e050a');
        bgGrad.addColorStop(1, '#090103');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Distant Pagoda / Mountain Silhouettes
        ctx.fillStyle = 'rgba(20, 3, 6, 0.75)';
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W + 40; x += 40) {
            const h = 70 + Math.sin(x * 0.005) * 35 + Math.cos(x * 0.012) * 20;
            ctx.lineTo(x, H - h);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();

        // 1. Soaring Golden Dragon
        if (dragon) {
            dragon.update(t);
            dragon.draw(t);
        }

        // 2. Floating Sky Lanterns
        for (const l of lanterns) {
            l.update(t);
            l.draw(t);
        }

        // 3. Embers and Sparks
        for (const s of sparkles) {
            s.update();
            s.draw();
        }

        // 4. Hanging Decorative Palace Lanterns at the top corners
        const sway1 = Math.sin(t * 0.0015) * 0.05;
        const sway2 = Math.sin(t * 0.0018 + 1.5) * 0.05;
        drawHangingLantern(70, -10, 48, sway1, t);
        drawHangingLantern(140, -15, 38, sway2, t);
        if (W > 700) {
            drawHangingLantern(W - 70, -10, 48, -sway1, t);
            drawHangingLantern(W - 140, -15, 38, -sway2, t);
        }

        requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(render);
})();
