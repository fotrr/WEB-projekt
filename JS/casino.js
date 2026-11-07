/**
 * JS/casino.js - Meruňková Šplouchačka (Dragon Palace Imperial Casino)
 * Standalone JavaScript Engine: 3x5 Video Slot, Tiered Wins, Wilds, Free Spins,
 * Blackjack, Baccarat, Canvas Physics Roulette, and ELpaso Admin Panel.
 */

const CASINO_CHIPS = [
    { value: 10, label: '$10', colorClass: 'chip-10' },
    { value: 25, label: '$25', colorClass: 'chip-25' },
    { value: 50, label: '$50', colorClass: 'chip-50' },
    { value: 100, label: '$100', colorClass: 'chip-100' },
    { value: 500, label: '$500', colorClass: 'chip-500' }
];

const WIN_TIERS = [
    { threshold: 4500, title: 'DRAGON MASTER MIND', tierClass: 'tier-mastermind', badge: '🐉' },
    { threshold: 3000, title: 'INHUMAN WIN', tierClass: 'tier-inhuman', badge: '💥' },
    { threshold: 2000, title: 'BRUTAL WIN', tierClass: 'tier-brutal', badge: '⚡' },
    { threshold: 1200, title: 'SUPER SONIC WIN', tierClass: 'tier-supersonic', badge: '🚀' },
    { threshold: 760, title: 'ULTRA WIN', tierClass: 'tier-ultra', badge: '💎' },
    { threshold: 400, title: 'SUPER WIN', tierClass: 'tier-super', badge: '🌟' }
];

const PAYLINES = [
    [1, 1, 1, 1, 1], // Line 1: Middle row
    [0, 0, 0, 0, 0], // Line 2: Top row
    [2, 2, 2, 2, 2], // Line 3: Bottom row
    [0, 1, 2, 1, 0], // Line 4: V-shape
    [2, 1, 0, 1, 2], // Line 5: Inverted V
    [0, 0, 1, 2, 2], // Line 6: Step down
    [2, 2, 1, 0, 0], // Line 7: Step up
    [1, 0, 0, 0, 1], // Line 8: Top bowl
    [1, 2, 2, 2, 1], // Line 9: Bottom bowl
    [0, 1, 0, 1, 0]  // Line 10: Zigzag
];

// ============================== SOUND SYNTHESIS ==============================

class DragonAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    getContext() {
        if (!this.enabled) return null;
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    chip() {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    card() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    win() {
        const ctx = this.getContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime + idx * 0.07;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        });
    }

    bigWinFanfare() {
        const ctx = this.getContext();
        if (!ctx) return;
        const chords = [
            [523.25, 659.25, 783.99],
            [587.33, 739.99, 880.00],
            [659.25, 830.61, 987.77],
            [783.99, 987.77, 1174.66],
            [1046.50, 1318.51, 1567.98]
        ];
        chords.forEach((chord, step) => {
            chord.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const now = ctx.currentTime + step * 0.16;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.5);
            });
        });
    }

    lose() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.28);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    spinTick() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.025);
    }

    reelStop() {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.09);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }
}

const SFX = new DragonAudio();

// ============================== CARD UTILS ==============================

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];

    for (const suit of suits) {
        const color = (suit === '♥' || suit === '♦') ? 'red' : 'black';
        for (const val of values) {
            let num = parseInt(val, 10);
            if (val === 'A') num = 11;
            else if (['J', 'Q', 'K'].includes(val)) num = 10;
            deck.push({ suit, value: val, numValue: num, color });
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

function renderImperialCard(card, hidden = false) {
    if (hidden) {
        return `<div class="imperial-card hidden"></div>`;
    }
    return `
        <div class="imperial-card ${card.color}">
            <div class="card-top">${card.value}${card.suit}</div>
            <div class="card-center">${card.suit}</div>
            <div class="card-bottom">${card.value}${card.suit}</div>
        </div>
    `;
}

// ============================== CASINO ENGINE ==============================

class MerunkovaSplouchacka {
    constructor() {
        this.balance = 1000;
        this.selectedChip = 25;
        this.activeGame = 'slots';

        // Search & Admin State
        this.searchQuery = '';
        this.adminUnlocked = false;
        this.showAdminModal = false;

        // Blackjack State
        this.bjDeck = [];
        this.bjPlayerHand = [];
        this.bjDealerHand = [];
        this.bjBet = 0;
        this.bjStatus = 'idle';
        this.bjResultMsg = '';
        this.customBjBet = 25;

        // 3x5 Video Slot State
        this.slotSymbols = [
            { id: 'dragon', icon: '🐉', name: 'Císařský Drak', isWild: true, payout: { 3: 100, 4: 350, 5: 1200 } },
            { id: 'gong', icon: '🪭', name: 'Zlatý Gong', isScatter: true, payout: { 3: 20, 4: 100, 5: 500 } },
            { id: 'apricot', icon: '🍑', name: 'Zlatá Meruňka', payout: { 3: 40, 4: 150, 5: 600 } },
            { id: 'crown', icon: '👑', name: 'Císařská Koruna', payout: { 3: 25, 4: 90, 5: 350 } },
            { id: 'lantern', icon: '🏮', name: 'Palácová Lucerna', payout: { 3: 18, 4: 60, 5: 220 } },
            { id: 'ingot', icon: '🪙', name: 'Zlatý Tael', payout: { 3: 12, 4: 40, 5: 150 } },
            { id: 'bamboo', icon: '🎋', name: 'Bambus Štěstí', payout: { 3: 8, 4: 25, 5: 100 } },
            { id: 'sakura', icon: '🌸', name: 'Květ Sakury', payout: { 3: 5, 4: 15, 5: 60 } }
        ];

        this.slotMatrix = [];
        this.slotSpinning = false;
        this.slotBet = 25;
        this.customSlotBet = 25;
        this.slotSpeed = 1;
        this.autoSpinRemaining = 0;
        this.slotResultMsg = '';
        this.winningCells = new Set();

        this.freeSpinsRemaining = 0;
        this.freeSpinsTotalWin = 0;
        this.freeSpinsMultiplier = 3;

        this.activeCelebration = null;

        // Baccarat State
        this.bacDeck = [];
        this.bacPlayerHand = [];
        this.bacBankerHand = [];
        this.bacSelectedBet = null;
        this.bacBetAmount = 0;
        this.bacStatus = 'idle';
        this.bacResultMsg = '';
        this.bacHistory = [];
        this.customBacBet = 25;

        // Roulette State
        this.rBets = [];
        this.rSpinning = false;
        this.rWheelAngle = 0;
        this.rResultMsg = '';
        this.rHistory = [];
        this.customRBet = 25;
        this.rParticles = [];

        this.rouletteWheelNumbers = [
            0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
            5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
        ];
        this.redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

        this.initSlotMatrix();
        this.loadBalance();
    }

    initSlotMatrix() {
        this.slotMatrix = Array.from({ length: 5 }, () =>
            Array.from({ length: 3 }, () => this.getRandomSymbol())
        );
    }

    getRandomSymbol() {
        const rand = Math.random();
        if (rand < 0.06) return this.slotSymbols[0]; // Wild Dragon
        if (rand < 0.12) return this.slotSymbols[1]; // Scatter Gong
        if (rand < 0.22) return this.slotSymbols[2]; // Apricot
        if (rand < 0.35) return this.slotSymbols[3]; // Crown
        if (rand < 0.50) return this.slotSymbols[4]; // Lantern
        if (rand < 0.65) return this.slotSymbols[5]; // Ingot
        if (rand < 0.82) return this.slotSymbols[6]; // Bamboo
        return this.slotSymbols[7]; // Sakura
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    loadBalance() {
        try {
            const saved = localStorage.getItem('riv-casino-balance');
            if (saved) {
                const num = parseInt(saved, 10);
                if (!isNaN(num) && num >= 0) this.balance = num;
            }
        } catch {
            this.balance = 1000;
        }
    }

    saveBalance() {
        try {
            localStorage.setItem('riv-casino-balance', String(this.balance));
        } catch {}
    }

    setBalance(amt) {
        this.balance = Math.max(0, amt);
        this.saveBalance();
        this.updateHeaderDisplay();
    }

    render() {
        const root = document.getElementById('casino-app');
        if (!root) return;

        root.innerHTML = `
            <div class="casino-palace-wrap">

                <!-- Dragon Palace Imperial Header -->
                <header class="palace-header">
                    <div class="header-inner">
                        <div class="palace-title-box">
                            <h1>🐉 Meruňková Šplouchačka</h1>
                            <p>Císařský Dračí Palác Hazardních Her & Ovocné Šplouchance</p>
                        </div>

                        <!-- Search Bar & Secret ELpaso Trigger -->
                        <div class="search-admin-container">
                            <div class="dragon-search-box">
                                <span class="dragon-search-icon">🔍</span>
                                <input type="text" class="dragon-search-input" id="casinoSearch"
                                       placeholder="Hledat hry a pravidla…" value="${this.searchQuery}" autocomplete="off">
                            </div>

                            ${this.adminUnlocked ? `
                                <button class="btn-admin-secret" id="btnOpenAdmin">
                                    ⚡ Pokladna Paláce (Admin)
                                </button>
                            ` : ''}
                        </div>

                        <!-- Bankroll & Chips -->
                        <div class="palace-bankroll">
                            <div class="bankroll-vault">
                                <span class="vault-label">🪙 Pokladnice:</span>
                                <span class="vault-amount" id="balanceDisplay">$${this.balance.toLocaleString()}</span>
                            </div>

                            <div class="chip-rack" id="chipSelector">
                                ${CASINO_CHIPS.map(c => `
                                    <div class="dragon-chip ${c.colorClass} ${this.selectedChip === c.value ? 'active' : ''}" data-chip="${c.value}">
                                        ${c.label}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Palace Navigation Tabs -->
                <nav class="palace-tabs">
                    <button class="palace-tab-btn ${this.activeGame === 'slots' ? 'active' : ''}" data-tab="slots">
                        🎰 3x5 Meruňkové Válce
                    </button>
                    <button class="palace-tab-btn ${this.activeGame === 'blackjack' ? 'active' : ''}" data-tab="blackjack">
                        🃏 Dračí Blackjack
                    </button>
                    <button class="palace-tab-btn ${this.activeGame === 'baccarat' ? 'active' : ''}" data-tab="baccarat">
                        🎴 Císařský Baccarat
                    </button>
                    <button class="palace-tab-btn ${this.activeGame === 'roulette' ? 'active' : ''}" data-tab="roulette">
                        🎡 Zlatá Ruleta
                    </button>
                </nav>

                <!-- Arena Main Container -->
                <main class="palace-arena" id="palaceArena">
                    ${this.renderActiveGame()}
                </main>
            </div>

            <!-- Admin Modal if Open -->
            ${this.showAdminModal ? this.renderAdminModal() : ''}

            <!-- Tiered Celebration Modal if Open -->
            ${this.activeCelebration ? this.renderCelebrationModal() : ''}
        `;

        this.attachGameControls();
        window.dispatchEvent(new CustomEvent('casino:render', { detail: { game: this.activeGame, spinning: this.slotSpinning } }));
        if (this.activeCelebration) this.animateCelebrationAmount();
        if (this.activeGame === 'roulette') {
            this.drawRouletteCanvas(this.rWheelAngle);
        }
    }

    animateCelebrationAmount() {
        const amount = Number(this.activeCelebration?.amount || 0);
        const display = document.getElementById('celebrationAmount');
        if (!display) return;
        if (window.gsap) {
            const counter = { value: 0 };
            window.gsap.to(counter, { value: amount, duration: 2.1, ease: 'power3.out', onUpdate: () => {
                display.textContent = `+$${Math.floor(counter.value).toLocaleString('cs-CZ')}`;
            }, onComplete: () => { display.textContent = `+$${amount.toLocaleString('cs-CZ')}`; } });
        } else display.textContent = `+$${amount.toLocaleString('cs-CZ')}`;
    }

    updateHeaderDisplay() {
        const el = document.getElementById('balanceDisplay');
        if (el) el.textContent = `$${this.balance.toLocaleString()}`;
    }

    renderActiveGame() {
        switch (this.activeGame) {
            case 'slots': return this.renderSlots();
            case 'blackjack': return this.renderBlackjack();
            case 'baccarat': return this.renderBaccarat();
            case 'roulette': return this.renderRoulette();
        }
    }

    renderCelebrationModal() {
        if (!this.activeCelebration) return '';
        const c = this.activeCelebration;

        return `
            <div class="tiered-win-modal-fullscreen" id="celebrationBackdrop"><canvas id="celebrationCanvas"></canvas>
                <div class="celebration-center-content">
                    <div class="celebration-dragon-crest">${c.badge}</div>
                    <div class="celebration-tier-title ${c.tierClass}">
                        ${c.title}!
                    </div>
                    <div class="celebration-ticker" id="celebrationAmount" data-value="${c.amount}">
                        +$0
                    </div>
                    <p class="celebration-subtitle">
                        Výhra tvoří ${c.percent}% vsazené částky
                    </p>
                    <button class="btn-palace btn-palace-gold mt-4" id="btnDismissCelebration">
                        Vyzvednout Císařský Poklad
                    </button>
                    <div class="tiered-win-dismiss">Kliknutím zavřete oslavu</div>
                </div>
            </div>
        `;
    }

    createWinCelebration(amount, wager) {
        const percent = Math.round(amount / Math.max(1, wager) * 100);
        const tier = percent >= 1000 ? { title: 'DRAČÍ JACKPOT', tierClass: 'tier-mastermind', badge: '🐉' }
            : percent >= 500 ? { title: 'MEGA VÝHRA', tierClass: 'tier-inhuman', badge: '💥' }
            : percent >= 300 ? { title: 'VELKÁ VÝHRA', tierClass: 'tier-brutal', badge: '⚡' }
            : percent >= 200 ? { title: 'SKVĚLÁ VÝHRA', tierClass: 'tier-ultra', badge: '💎' }
            : percent >= 100 ? { title: 'VÝHRA', tierClass: 'tier-super', badge: '🌟' }
            : { title: 'MALÁ VÝHRA', tierClass: 'tier-super', badge: '✨' };
        return { ...tier, amount, percent };
    }

    renderAdminModal() {
        return `
            <div class="admin-modal-backdrop" id="adminBackdrop">
                <div class="admin-palace-modal">
                    <div class="admin-modal-title">
                        🐉 Pokladnice Císaře (ELpaso Admin)
                    </div>
                    <p class="admin-modal-desc">
                        Tajný přístup povolen. Zde můžete libovolně upravit stav své pokladny.
                    </p>

                    <div class="admin-input-group">
                        <label for="adminMoneyInput">Nastavit přesný zůstatek ($):</label>
                        <input type="number" class="admin-money-input" id="adminMoneyInput" value="${this.balance}">
                    </div>

                    <div class="admin-quick-grid">
                        <button class="admin-quick-btn" data-add-money="10000">+$10,000</button>
                        <button class="admin-quick-btn" data-add-money="50000">+$50,000</button>
                        <button class="admin-quick-btn" data-add-money="250000">+$250,000</button>
                        <button class="admin-quick-btn" data-add-money="1000000">+$1,000,000</button>
                        <button class="admin-quick-btn" data-add-money="5000000">+$5,000,000</button>
                        <button class="admin-quick-btn" id="btnAdminReset">Vynulovat ($0)</button>
                    </div>

                    <div class="admin-modal-actions">
                        <button class="btn-palace btn-palace-gold" id="btnSaveAdminMoney">
                            Potvrdit a Uložit
                        </button>
                        <button class="btn-palace btn-palace-red" id="btnCloseAdmin">
                            Zavřít
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================== 3x5 SLOTS ==============================

    renderSlots() {
        return `
            <div class="slot-machine-palace">
                <div class="dragon-cabinet">
                    <div class="dragon-cabinet-roof">
                        🍑 3x5 VÁLCE MERUŇKOVÉ ŠPLOUCHAČKY (10 VÝHERNÍCH LINIÍ) 🍑
                    </div>

                    ${this.freeSpinsRemaining > 0 ? `
                        <div class="freespins-active-banner">
                            🔥 VOLNÁ ZATOČENÍ (FREE SPINS): ${this.freeSpinsRemaining} ZBÝVÁ | NÁSOBITEL 3X | BONUS: $${this.freeSpinsTotalWin.toLocaleString()}
                        </div>
                    ` : ''}

                    <div class="slot-machine-face">
                      <div class="reels-stage-3x5" id="reelsStage">
                          ${[0, 1, 2, 3, 4].map(colIdx => {
                            const spinning = this.slotSpinning && this.pendingSlotMatrix;
                            const symbols = spinning ? [...this.slotMatrix[colIdx], ...Array.from({length:15}, () => this.getRandomSymbol()), ...this.pendingSlotMatrix[colIdx]] : this.slotMatrix[colIdx];
                            const finalStart = symbols.length - 3;
                            return `<div class="reel-column-3x5 ${spinning ? 'spinning' : ''}" id="reelCol${colIdx}"><div class="reel-strip" id="reelStrip${colIdx}">
                              ${symbols.map((sym, index) => {
                                const isFinal = spinning && index >= finalStart;
                                const rowIdx = isFinal ? index - finalStart : index;
                                const cellId = spinning ? (isFinal ? `id="slotCell_${colIdx}_${rowIdx}"` : '') : `id="slotCell_${colIdx}_${rowIdx}"`;
                                const isWin = !spinning && this.winningCells.has(`${colIdx},${rowIdx}`);
                                const extraCls = sym.isWild ? 'wild-cell' : (sym.isScatter ? 'scatter-cell' : '');
                                return `<div class="slot-cell ${isWin ? 'win-cell' : ''} ${extraCls}" ${cellId}><div class="symbol-icon">${sym.icon}</div><div class="symbol-badge">${sym.isWild ? 'WILD' : (sym.isScatter ? 'SCATTER' : sym.name.split(' ')[1] || sym.name)}</div></div>`;
                              }).join('')}
                            </div></div>`;
                          }).join('')}
                      </div>
                      <div id="slotLeverMount" class="slot-lever-mount"></div>
                    </div>

                    <div class="paylines-indicator">
                        🐉 WILD (Drak) nahrazuje symboly | 🪭 3x SCATTER (Gong) spouští 10 FREE SPINS s 3x násobitelem!
                    </div>

                    ${this.slotResultMsg ? `<div class="palace-result ${this.getResultClass(this.slotResultMsg)}">${this.slotResultMsg}</div>` : ''}

                    <div class="palace-paytable">
                        <div>🐉 Drak (WILD): až 1200x</div>
                        <div>🍑 Meruňka: až 600x</div>
                        <div>👑 Koruna: až 350x</div>
                        <div>🏮 Lucerna: až 220x</div>
                        <div>🪙 Tael: až 150x</div>
                        <div>🎋 Bambus: až 100x</div>
                    </div>
                </div>

                <div class="palace-controls">
                    <div class="slot-bet-controls-bar">
                        <div class="bet-input-cluster"><label for="slotCustomBet">Sázka</label><input class="slot-custom-bet-input" id="slotCustomBet" type="number" min="1" step="1" value="${this.customSlotBet}"></div>
                        <label class="slot-speed-control" for="slotSpeedSlider"><span>Rychlost válců</span><input id="slotSpeedSlider" type="range" min="0.75" max="4" step="0.25" value="${this.slotSpeed}" ${this.slotSpinning ? 'disabled' : ''}><output id="slotSpeedValue">${this.slotSpeed.toFixed(2).replace(/\.0$/, '')}×</output></label>
                        <div class="autospin-cluster">${[10, 25, 50].map(n => `<button class="btn-autospin-choice" data-autospin="${n}">Auto ${n}×</button>`).join('')}${this.autoSpinRemaining ? `<button class="btn-stop-autospin" id="btnStopAuto">Zastavit (${this.autoSpinRemaining})</button>` : ''}</div>
                    </div>
                    <button class="btn-palace btn-palace-gold" id="btnSpinSlots" ${this.slotSpinning ? 'disabled' : ''}>
                        ${this.freeSpinsRemaining > 0 ? `🔥 Volné Zatočení (${this.freeSpinsRemaining} zdarma)` : `🎰 Roztočit Válce ($${this.customSlotBet || this.selectedChip})`}
                    </button>
                </div>
            </div>
        `;
    }

    async spinSlots() {
        if (this.slotSpinning) return;
        const isFreeSpin = this.freeSpinsRemaining > 0;
        if (!isFreeSpin) {
            if (this.balance < this.selectedChip) {
                alert('Nedostatek financí! Použijte tajný kód ELpaso pro doplnění pokladny.');
                return;
            }
            this.slotBet = Math.max(1, Math.floor(Number(this.customSlotBet) || this.selectedChip));
            if (this.balance < this.slotBet) { alert('Nedostatek financí.'); return; }
            this.setBalance(this.balance - this.slotBet);
        } else {
            this.freeSpinsRemaining--;
        }

        this.slotSpinning = true;
        this.slotResultMsg = '';
        this.winningCells.clear();
        const finalMatrix = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => this.getRandomSymbol()));
        this.pendingSlotMatrix = finalMatrix;
        this.renderArena();
        if (window.gsap) window.gsap.to('.slot-lever .lever-arm', { y: 0, z: 0, rotationX: -30, duration: 0.38, ease: 'power2.in', yoyo: true, repeat: 1, transformOrigin: '50% 96%' });

        const reelPromises = Array.from({length:5}, (_, col) => new Promise(resolve => {
            const viewport = document.getElementById(`reelCol${col}`);
            const strip = document.getElementById(`reelStrip${col}`);
            if (!viewport || !strip) { resolve(); return; }
            const firstCell = strip.querySelector('.slot-cell');
            const cellHeight = firstCell?.getBoundingClientRect().height || 122;
            const gap = parseFloat(getComputedStyle(strip).rowGap) || 12;
            const travel = (18 * (cellHeight + gap));
            const duration = Math.max(.42, (1.18 + col * .14) / this.slotSpeed);
            const complete = () => { this.stopColumn(col, finalMatrix); resolve(); };
            if (window.gsap) window.gsap.to(strip, { y: -travel, duration, delay: col * .075 / this.slotSpeed, ease: 'power2.out', onComplete: () => window.gsap.to(strip, { y: -travel + 5, duration: .07, yoyo: true, repeat: 1, ease: 'power1.inOut', onComplete: complete }) });
            else { strip.style.transition = `transform ${duration}s cubic-bezier(.16,.75,.22,1)`; requestAnimationFrame(() => { strip.style.transform = `translateY(-${travel}px)`; }); setTimeout(complete, (duration + col * .075 / this.slotSpeed) * 1000); }
        }));
        await Promise.all(reelPromises);

        this.slotMatrix = finalMatrix;
        this.pendingSlotMatrix = null;
        this.slotSpinning = false;
        this.evaluateSlotWins(isFreeSpin);
    }

    stopColumn(colIdx, finalMatrix) {
        const colEl = document.getElementById(`reelCol${colIdx}`);
        if (colEl) colEl.classList.remove('spinning', 'reel-in-motion');

        for (let r = 0; r < 3; r++) {
            const cell = document.getElementById(`slotCell_${colIdx}_${r}`);
            if (cell) {
                const sym = finalMatrix[colIdx][r];
                cell.querySelector('.symbol-icon').textContent = sym.icon;
                cell.querySelector('.symbol-badge').textContent = sym.isWild ? 'WILD' : (sym.isScatter ? 'SCATTER' : sym.name.split(' ')[1] || sym.name);
                cell.className = `slot-cell ${sym.isWild ? 'wild-cell' : (sym.isScatter ? 'scatter-cell' : '')}`;
            }
        }
        SFX.reelStop();
    }

    evaluateSlotWins(isFreeSpin) {
        let totalWin = 0;
        const lineBet = Math.max(1, Math.floor(this.slotBet / 10));
        let winningLinesCount = 0;

        for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
            const lineDef = PAYLINES[lineIdx];
            const lineSymbols = lineDef.map((row, col) => this.slotMatrix[col][row]);

            let baseSymbol = lineSymbols.find(s => !s.isWild && !s.isScatter) || lineSymbols[0];
            if (baseSymbol.isScatter) continue;

            let matches = 0;
            for (let c = 0; c < 5; c++) {
                const sym = lineSymbols[c];
                if (sym.id === baseSymbol.id || sym.isWild) {
                    matches++;
                } else {
                    break;
                }
            }

            if (matches >= 3) {
                const payoutMult = baseSymbol.payout[matches] || 0;
                if (payoutMult > 0) {
                    let win = lineBet * payoutMult;
                    if (isFreeSpin) win *= this.freeSpinsMultiplier;
                    totalWin += win;
                    winningLinesCount++;

                    for (let c = 0; c < matches; c++) {
                        this.winningCells.add(`${c},${lineDef[c]}`);
                    }
                }
            }
        }

        let scatterCount = 0;
        for (let c = 0; c < 5; c++) {
            for (let r = 0; r < 3; r++) {
                if (this.slotMatrix[c][r].isScatter) {
                    scatterCount++;
                    this.winningCells.add(`${c},${r}`);
                }
            }
        }

        let scatterWinMsg = '';
        if (scatterCount >= 3) {
            const scatterAward = this.slotBet * (scatterCount === 3 ? 10 : (scatterCount === 4 ? 40 : 150));
            totalWin += scatterAward;
            this.freeSpinsRemaining += 10;
            scatterWinMsg = `🪭 3x SCATTER! Uděleno 10 VOLNÝCH ZATOČENÍ s 3X NÁSOBITELEM!`;
            SFX.win();
        }

        if (totalWin > 0) {
            this.setBalance(this.balance + totalWin);
            if (isFreeSpin) this.freeSpinsTotalWin += totalWin;

            const celebration = this.createWinCelebration(totalWin, this.slotBet);
            if (celebration.percent >= 300) SFX.bigWinFanfare(); else SFX.win();
            this.activeCelebration = celebration;
            this.slotResultMsg = `🏆 ${celebration.title}! Výhra $${totalWin.toLocaleString()} (${celebration.percent}% sázky)!`;

            if (scatterWinMsg) {
                this.slotResultMsg += ` | ${scatterWinMsg}`;
            }
        } else {
            SFX.lose();
            this.slotResultMsg = 'Žádná výherní kombinace na 10 liniích. Zkus štěstí znovu!';
        }

        if (this.activeCelebration) this.render();
        else this.renderArena();
    }

    // ============================== BLACKJACK ==============================

    getBlackjackScore(hand) {
        let score = hand.reduce((sum, c) => sum + c.numValue, 0);
        let aces = hand.filter(c => c.value === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    renderBlackjack() {
        const dealerScore = this.bjStatus === 'playing'
            ? (this.bjDealerHand.length > 0 ? this.bjDealerHand[0].numValue : 0)
            : this.getBlackjackScore(this.bjDealerHand);
        const playerScore = this.getBlackjackScore(this.bjPlayerHand);

        return `
            <div class="bj-table-zone">
                <div class="table-label">
                    Karty Krupiéra Paláce
                    ${this.bjDealerHand.length > 0 ? `<span class="table-score">${this.bjStatus === 'playing' ? `${dealerScore} + ?` : dealerScore}</span>` : ''}
                </div>
                <div class="cards-row" id="dealerCards">
                    ${this.bjDealerHand.map((c, i) => renderImperialCard(c, this.bjStatus === 'playing' && i === 1)).join('')}
                    ${this.bjDealerHand.length === 0 ? '<div style="opacity:0.4;">Krupiér očekává sázku...</div>' : ''}
                </div>
            </div>

            ${this.bjResultMsg ? `<div class="palace-result ${this.getResultClass(this.bjResultMsg)}">${this.bjResultMsg}</div>` : ''}

            <div class="bj-table-zone">
                <div class="cards-row" id="playerCards">
                    ${this.bjPlayerHand.map(c => renderImperialCard(c)).join('')}
                    ${this.bjPlayerHand.length === 0 ? '<div style="opacity:0.4;">Zvolte žeton a rozdejte karty</div>' : ''}
                </div>
                <div class="table-label">
                    Vaše Ruka
                    ${this.bjPlayerHand.length > 0 ? `<span class="table-score">${playerScore}</span>` : ''}
                    ${this.bjBet > 0 ? `<span class="table-score" style="color:#fb923c;">Sázka: $${this.bjBet}</span>` : ''}
                </div>
            </div>

            <div class="palace-controls">
                ${this.bjStatus === 'idle' || this.bjStatus === 'resolved' ? `
                    <div class="slot-bet-controls-bar" style="margin-bottom:12px;">
                        <div class="bet-input-cluster"><label for="bjCustomBet">Sázka</label><input class="slot-custom-bet-input" id="bjCustomBet" type="number" min="1" step="1" value="${this.customBjBet}"></div>
                    </div>
                    <button class="btn-palace btn-palace-gold" id="btnBjDeal">
                        Rozdat Karty ($${this.customBjBet || this.selectedChip})
                    </button>
                ` : `
                    <button class="btn-palace btn-palace-gold" id="btnBjHit">Hit (Karta)</button>
                    <button class="btn-palace btn-palace-red" id="btnBjStand">Stand (Stát)</button>
                    <button class="btn-palace btn-palace-amber" id="btnBjDouble" ${this.balance < this.bjBet || this.bjPlayerHand.length > 2 ? 'disabled' : ''}>
                        Double Down ($${this.bjBet})
                    </button>
                `}
            </div>
        `;
    }

    bjDeal() {
        const bet = Math.max(1, Math.floor(Number(this.customBjBet) || this.selectedChip));
        if (this.balance < bet) {
            alert('Nedostatek financí! Použijte tajný kód ELpaso v hledáčku pro doplnění peněz.');
            return;
        }

        SFX.chip();
        this.bjBet = bet;
        this.setBalance(this.balance - this.bjBet);

        this.bjDeck = createDeck();
        this.bjPlayerHand = [this.bjDeck.pop(), this.bjDeck.pop()];
        this.bjDealerHand = [this.bjDeck.pop(), this.bjDeck.pop()];
        this.bjStatus = 'playing';
        this.bjResultMsg = '';

        SFX.card();
        const pScore = this.getBlackjackScore(this.bjPlayerHand);
        const dScore = this.getBlackjackScore(this.bjDealerHand);

        if (pScore === 21 && dScore === 21) {
            this.bjStatus = 'resolved';
            this.setBalance(this.balance + this.bjBet);
            this.bjResultMsg = 'Remíza! Oboustranný Blackjack!';
        } else if (pScore === 21) {
            this.bjStatus = 'resolved';
            const winAmt = Math.floor(this.bjBet * 2.5);
            this.setBalance(this.balance + winAmt);
            SFX.win();
            this.bjResultMsg = `Císařský Blackjack! Výhra $${winAmt.toLocaleString()}! 🏆`;
        } else if (dScore === 21) {
            this.bjStatus = 'resolved';
            SFX.lose();
            this.bjResultMsg = 'Krupiér má Blackjack. Palác vítězí.';
        }

        this.renderArena();
    }

    bjHit() {
        if (this.bjStatus !== 'playing') return;
        SFX.card();
        this.bjPlayerHand.push(this.bjDeck.pop());
        const score = this.getBlackjackScore(this.bjPlayerHand);

        if (score > 21) {
            this.bjStatus = 'resolved';
            SFX.lose();
            this.bjResultMsg = `Přetaženo (${score})! Palác vítězí.`;
        }
        this.renderArena();
    }

    bjStand() {
        if (this.bjStatus !== 'playing') return;
        this.bjStatus = 'resolved';

        while (this.getBlackjackScore(this.bjDealerHand) < 17) {
            this.bjDealerHand.push(this.bjDeck.pop());
        }

        const pScore = this.getBlackjackScore(this.bjPlayerHand);
        const dScore = this.getBlackjackScore(this.bjDealerHand);

        if (dScore > 21) {
            const winAmt = this.bjBet * 2;
            this.setBalance(this.balance + winAmt);
            SFX.win();
            this.bjResultMsg = `Krupiér přetáhl (${dScore})! Vyhráváte $${winAmt.toLocaleString()}! 🎉`;
        } else if (pScore > dScore) {
            const winAmt = this.bjBet * 2;
            this.setBalance(this.balance + winAmt);
            SFX.win();
            this.bjResultMsg = `Vítězství! Vaše ${pScore} přebíjí ${dScore}! (+$${winAmt.toLocaleString()}) ✨`;
        } else if (pScore === dScore) {
            this.setBalance(this.balance + this.bjBet);
            this.bjResultMsg = `Remíza při ${pScore}. Sázka vrácena.`;
        } else {
            SFX.lose();
            this.bjResultMsg = `Palác vítězí s ${dScore} proti vašim ${pScore}.`;
        }

        this.renderArena();
    }

    bjDouble() {
        if (this.bjStatus !== 'playing' || this.balance < this.bjBet) return;
        this.setBalance(this.balance - this.bjBet);
        this.bjBet *= 2;
        SFX.chip();
        this.bjPlayerHand.push(this.bjDeck.pop());
        SFX.card();

        const pScore = this.getBlackjackScore(this.bjPlayerHand);
        if (pScore > 21) {
            this.bjStatus = 'resolved';
            SFX.lose();
            this.bjResultMsg = `Přetaženo (${pScore})! Palác vítězí.`;
            this.renderArena();
            return;
        }

        this.bjStand();
    }

    // ============================== BACCARAT ==============================

    getBaccaratScore(hand) {
        const sum = hand.reduce((total, c) => {
            if (['10', 'J', 'Q', 'K'].includes(c.value)) return total;
            if (c.value === 'A') return total + 1;
            return total + c.numValue;
        }, 0);
        return sum % 10;
    }

    renderBaccarat() {
        const pScore = this.bacPlayerHand.length ? this.getBaccaratScore(this.bacPlayerHand) : 0;
        const bScore = this.bacBankerHand.length ? this.getBaccaratScore(this.bacBankerHand) : 0;

        return `
            <div class="baccarat-palace-table">
                <div class="baccarat-sides">
                    <div class="bj-table-zone">
                        <div class="table-label">
                            Hráč (Punto)
                            ${this.bacPlayerHand.length ? `<span class="table-score">${pScore}</span>` : ''}
                        </div>
                        <div class="cards-row">
                            ${this.bacPlayerHand.map(c => renderImperialCard(c)).join('')}
                            ${this.bacPlayerHand.length === 0 ? '<div style="opacity:0.4;">Čeká na sázku...</div>' : ''}
                        </div>
                    </div>

                    <div class="bj-table-zone">
                        <div class="table-label">
                            Bankéř (Banco)
                            ${this.bacBankerHand.length ? `<span class="table-score">${bScore}</span>` : ''}
                        </div>
                        <div class="cards-row">
                            ${this.bacBankerHand.map(c => renderImperialCard(c)).join('')}
                            ${this.bacBankerHand.length === 0 ? '<div style="opacity:0.4;">Čeká na sázku...</div>' : ''}
                        </div>
                    </div>
                </div>

                ${this.bacResultMsg ? `<div class="palace-result ${this.getResultClass(this.bacResultMsg)}">${this.bacResultMsg}</div>` : ''}

                <div class="baccarat-imperial-bets">
                    <div class="imperial-bet-box ${this.bacSelectedBet === 'player' ? 'active' : ''}" data-bac-bet="player">
                        <div class="bet-box-title">HRÁČ (PUNTO)</div>
                        <div class="bet-box-odds">Výplata 1 : 1</div>
                        <div class="bet-box-chip">${this.bacSelectedBet === 'player' ? `$${this.bacBetAmount}` : ''}</div>
                    </div>

                    <div class="imperial-bet-box ${this.bacSelectedBet === 'tie' ? 'active' : ''}" data-bac-bet="tie">
                        <div class="bet-box-title">REMÍZA (TIE)</div>
                        <div class="bet-box-odds">Výplata 8 : 1</div>
                        <div class="bet-box-chip">${this.bacSelectedBet === 'tie' ? `$${this.bacBetAmount}` : ''}</div>
                    </div>

                    <div class="imperial-bet-box ${this.bacSelectedBet === 'banker' ? 'active' : ''}" data-bac-bet="banker">
                        <div class="bet-box-title">BANKÉŘ (BANCO)</div>
                        <div class="bet-box-odds">Výplata 0.95 : 1 (5% provize)</div>
                        <div class="bet-box-chip">${this.bacSelectedBet === 'banker' ? `$${this.bacBetAmount}` : ''}</div>
                    </div>
                </div>

                <div class="past-numbers" style="justify-content:center;">
                    <span style="font-size:0.85rem;color:#ffd700;margin-right:8px;">Historie:</span>
                    ${this.bacHistory.slice(-10).map(h => `
                        <div class="number-seal" style="background:${h === 'P' ? '#1d4ed8' : (h === 'B' ? '#b91c1c' : '#059669')}">
                            ${h}
                        </div>
                    `).join('')}
                </div>

                <div class="palace-controls">
                    <div class="slot-bet-controls-bar" style="margin-bottom:12px;">
                        <div class="bet-input-cluster"><label for="bacCustomBet">Sázka</label><input class="slot-custom-bet-input" id="bacCustomBet" type="number" min="1" step="1" value="${this.customBacBet}"></div>
                    </div>
                    <button class="btn-palace btn-palace-gold" id="btnBacDeal" ${!this.bacSelectedBet ? 'disabled' : ''}>
                        Rozdat Baccarat ($${this.customBacBet || this.selectedChip})
                    </button>
                </div>
            </div>
        `;
    }

    selectBaccaratBet(type) {
        SFX.chip();
        this.bacSelectedBet = type;
        this.bacBetAmount = Math.max(1, Math.floor(Number(this.customBacBet) || this.selectedChip));
        this.renderArena();
    }

    dealBaccarat() {
        if (!this.bacSelectedBet) return;
        if (this.balance < this.bacBetAmount) {
            alert('Nedostatek financí pro hru!');
            return;
        }

        this.setBalance(this.balance - this.bacBetAmount);
        this.bacDeck = createDeck();
        this.bacPlayerHand = [this.bacDeck.pop(), this.bacDeck.pop()];
        this.bacBankerHand = [this.bacDeck.pop(), this.bacDeck.pop()];

        let pScore = this.getBaccaratScore(this.bacPlayerHand);
        let bScore = this.getBaccaratScore(this.bacBankerHand);

        if (pScore >= 8 || bScore >= 8) {
            this.resolveBaccarat(pScore, bScore);
            return;
        }

        let playerThirdCardVal = null;
        if (pScore <= 5) {
            const p3 = this.bacDeck.pop();
            this.bacPlayerHand.push(p3);
            playerThirdCardVal = ['10', 'J', 'Q', 'K'].includes(p3.value) ? 0 : (p3.value === 'A' ? 1 : p3.numValue);
            pScore = this.getBaccaratScore(this.bacPlayerHand);
        }

        if (playerThirdCardVal === null) {
            if (bScore <= 5) {
                this.bacBankerHand.push(this.bacDeck.pop());
            }
        } else {
            if (bScore <= 2) {
                this.bacBankerHand.push(this.bacDeck.pop());
            } else if (bScore === 3 && playerThirdCardVal !== 8) {
                this.bacBankerHand.push(this.bacDeck.pop());
            } else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(playerThirdCardVal)) {
                this.bacBankerHand.push(this.bacDeck.pop());
            } else if (bScore === 5 && [4, 5, 6, 7].includes(playerThirdCardVal)) {
                this.bacBankerHand.push(this.bacDeck.pop());
            } else if (bScore === 6 && [6, 7].includes(playerThirdCardVal)) {
                this.bacBankerHand.push(this.bacDeck.pop());
            }
        }

        bScore = this.getBaccaratScore(this.bacBankerHand);
        this.resolveBaccarat(pScore, bScore);
    }

    resolveBaccarat(pScore, bScore) {
        let winner;
        if (pScore > bScore) winner = 'player';
        else if (bScore > pScore) winner = 'banker';
        else winner = 'tie';

        this.bacHistory.push(winner === 'player' ? 'P' : (winner === 'banker' ? 'B' : 'T'));

        if (this.bacSelectedBet === winner) {
            let winAmt = 0;
            if (winner === 'player') winAmt = this.bacBetAmount * 2;
            else if (winner === 'banker') winAmt = Math.floor(this.bacBetAmount * 1.95);
            else if (winner === 'tie') winAmt = this.bacBetAmount * 9;

            this.setBalance(this.balance + winAmt);
            SFX.win();
            this.bacResultMsg = `Vítězství! ${winner.toUpperCase()} vyhrává s ${Math.max(pScore, bScore)} body! (+$${winAmt.toLocaleString()}) 🏆`;
        } else {
            SFX.lose();
            this.bacResultMsg = `${winner.toUpperCase()} zvítězil s ${Math.max(pScore, bScore)} body.`;
        }

        this.renderArena();
    }

    // ============================== ROULETTE ==============================

    renderRoulette() {
        const totalBets = this.rBets.reduce((sum, b) => sum + b.amount, 0);

        return `
            <div class="roulette-palace-stage">
                <div class="wheel-canvas-box">
                    <canvas id="rouletteCanvas" width="600" height="600"></canvas>
                </div>

                ${this.rResultMsg ? `<div class="palace-result ${this.getResultClass(this.rResultMsg)}">${this.rResultMsg}</div>` : ''}

                <div class="palace-roulette-board">
                    <div class="roulette-grid-classic">
                        <div class="palace-cell r-green r-zero ${this.hasRouletteBet('number', 0) ? 'has-bet' : ''}" data-r-type="number" data-r-val="0">0${this.renderRouletteChip('number', 0)}</div>
                        ${Array.from({ length: 12 }, (_, col) => [3 + col * 3, 2 + col * 3, 1 + col * 3].map((num, row) => `
                            <div class="palace-cell ${this.redNumbers.has(num) ? 'r-red' : 'r-black'} ${this.hasRouletteBet('number', num) ? 'has-bet' : ''}" style="grid-column:${col + 2};grid-row:${row + 1}" data-r-type="number" data-r-val="${num}">${num}${this.renderRouletteChip('number', num)}</div>
                        `).join('')).join('')}
                        <div class="roulette-dozen" style="grid-column:14;grid-row:1">2:1</div><div class="roulette-dozen" style="grid-column:14;grid-row:2">2:1</div><div class="roulette-dozen" style="grid-column:14;grid-row:3">2:1</div>
                    </div>

                    <div class="outside-bets-grid">
                        <button class="outside-palace-btn ${this.hasRouletteBet('1-18') ? 'has-bet' : ''}" data-r-type="1-18">1-18 (1:1)${this.renderRouletteChip('1-18')}</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('even') ? 'has-bet' : ''}" data-r-type="even">SUDÁ (1:1)${this.renderRouletteChip('even')}</button>
                        <button class="outside-palace-btn r-bet-red ${this.hasRouletteBet('red') ? 'has-bet' : ''}" data-r-type="red">ČERVENÁ (1:1)${this.renderRouletteChip('red')}</button>
                        <button class="outside-palace-btn r-bet-black ${this.hasRouletteBet('black') ? 'has-bet' : ''}" data-r-type="black">ČERNÁ (1:1)${this.renderRouletteChip('black')}</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('odd') ? 'has-bet' : ''}" data-r-type="odd">LICHÁ (1:1)${this.renderRouletteChip('odd')}</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('19-36') ? 'has-bet' : ''}" data-r-type="19-36">19-36 (1:1)${this.renderRouletteChip('19-36')}</button>
                    </div>
                </div>

                <div class="past-numbers" style="justify-content:center;">
                    <span style="font-size:0.85rem;color:#ffd700;margin-right:8px;">Předchozí čísla:</span>
                    ${this.rHistory.slice(-8).map(n => `
                        <div class="number-seal" style="background:${n === 0 ? '#059669' : (this.redNumbers.has(n) ? '#b91c1c' : '#18181b')}">
                            ${n}
                        </div>
                    `).join('')}
                </div>

                <div class="palace-controls">
                    <div class="slot-bet-controls-bar" style="margin-bottom:12px;">
                        <div class="bet-input-cluster"><label for="rCustomBet">Sázka na klik</label><input class="slot-custom-bet-input" id="rCustomBet" type="number" min="1" step="1" value="${this.customRBet}"></div>
                    </div>
                    <button class="btn-palace btn-palace-red" id="btnClearRoulette" ${this.rBets.length === 0 || this.rSpinning ? 'disabled' : ''}>
                        Smazat Sázky
                    </button>
                    <button class="btn-palace btn-palace-gold" id="btnSpinRoulette" ${this.rBets.length === 0 || this.rSpinning ? 'disabled' : ''}>
                        🎡 Roztočit Ruletu (Celkem: $${totalBets})
                    </button>
                </div>
            </div>
        `;
    }

    // Částice pro efekty při výhře
    spawnWinParticles(cx, cy, count, colors) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.rParticles.push({
                x: cx, y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.008 + Math.random() * 0.015,
                size: 2 + Math.random() * 4,
                color
            });
        }
    }

    updateParticles() {
        for (let i = this.rParticles.length - 1; i >= 0; i--) {
            const p = this.rParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravitace
            p.life -= p.decay;
            if (p.life <= 0) this.rParticles.splice(i, 1);
        }
    }

    drawParticles(ctx) {
        for (const p of this.rParticles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    drawRouletteCanvas(angleRad, ballAngleRad = null, winNumber = -1, winFlash = 0) {
        const cvs = document.getElementById('rouletteCanvas');
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        const W = cvs.width;
        const H = cvs.height;
        const cx = W / 2;
        const cy = H / 2;
        const R = cx - 4;

        ctx.clearRect(0, 0, W, H);

        // Pozadí s glow efektem při výhře
        if (winFlash > 0) {
            const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
            glowGrad.addColorStop(0, `rgba(255, 215, 0, ${winFlash * 0.3})`);
            glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, W, H);
        }

        ctx.save();
        const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R);
        rimGrad.addColorStop(0, '#581c87');
        rimGrad.addColorStop(0.3, '#7f1d1d');
        rimGrad.addColorStop(0.7, '#d97706');
        rimGrad.addColorStop(1, '#ffd700');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        // Ohraničení kolečka
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();

        const totalSlices = this.rouletteWheelNumbers.length;
        const sliceAngle = (Math.PI * 2) / totalSlices;

        ctx.translate(cx, cy);
        ctx.rotate(angleRad);

        for (let i = 0; i < totalSlices; i++) {
            const num = this.rouletteWheelNumbers[i];
            const startA = i * sliceAngle;
            const endA = startA + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, R * 0.86, startA, endA);
            ctx.closePath();

            if (num === 0) {
                ctx.fillStyle = '#059669';
            } else if (this.redNumbers.has(num)) {
                ctx.fillStyle = '#b91c1c';
            } else {
                ctx.fillStyle = '#18181b';
            }
            ctx.fill();

            // Zvýraznit vyhrávající číslo
            if (winNumber >= 0 && num === winNumber && winFlash > 0) {
                ctx.fillStyle = `rgba(255, 215, 0, ${winFlash * 0.5})`;
                ctx.fill();
            }

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Čísla s lepým stínem
            ctx.save();
            ctx.rotate(startA + sliceAngle / 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 2;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), R * 0.72, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Vnitřní prsten s detaily
        const innerRingR = R * 0.55;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, innerRingR, 0, Math.PI * 2);
        ctx.stroke();

        // Dekorativní tečky na vnitřním prstenci
        for (let i = 0; i < 36; i++) {
            const a = (i / 36) * Math.PI * 2;
            const dx = Math.cos(a) * innerRingR;
            const dy = Math.sin(a) * innerRingR;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const hubGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, R * 0.45);
        hubGrad.addColorStop(0, '#ffd700');
        hubGrad.addColorStop(0.6, '#b45309');
        hubGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Drak ve středu s pulzací
        const pulseScale = 1 + Math.sin(Date.now() / 300) * 0.05;
        ctx.save();
        ctx.scale(pulseScale, pulseScale);
        ctx.fillStyle = '#ffd700';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐉', 0, 0);
        ctx.restore();

        ctx.restore();

        // Needle s glow efektem
        ctx.save();
        const needleGlow = ctx.createRadialGradient(cx, 14, 0, cx, 14, 15);
        needleGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        needleGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = needleGlow;
        ctx.fillRect(cx - 15, 0, 30, 28);

        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, 4);
        ctx.lineTo(cx - 9, 24);
        ctx.lineTo(cx + 9, 24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Ball s trail efektem
        if (ballAngleRad !== null) {
            const ballDist = R * 0.73;
            const bx = cx + Math.cos(ballAngleRad) * ballDist;
            const by = cy + Math.sin(ballAngleRad) * ballDist;

            // Trail (stopy)
            for (let i = 1; i <= 5; i++) {
                const trailAngle = ballAngleRad - i * 0.08;
                const tx = cx + Math.cos(trailAngle) * ballDist;
                const ty = cy + Math.sin(trailAngle) * ballDist;
                ctx.globalAlpha = 0.3 - i * 0.05;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(tx, ty, 4.5 - i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Hlavní míček
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(bx, by, 5, 0, Math.PI * 2);
            ctx.fill();

            // Odraz světla na míčku
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(bx - 1.5, by - 1.5, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Částice
        this.updateParticles();
        this.drawParticles(ctx);
    }

    hasRouletteBet(type, val) {
        return this.rBets.some(b => b.type === type && (val === undefined || b.value === val));
    }

    renderRouletteChip(type, value) {
        const bet = this.rBets.find(b => b.type === type && b.value === value);
        if (!bet) return '';
        const stackSize = Math.min(5, Math.max(1, Math.ceil(bet.amount / 25)));
        return `<span class="roulette-chip-stack" title="Sázka $${bet.amount}">${Array.from({length: stackSize}, (_, i) => `<i style="--stack-level:${i}"></i>`).join('')}<b>$${bet.amount.toLocaleString()}</b></span>`;
    }

    addRouletteBet(type, value) {
        if (this.rSpinning) return;
        const bet = Math.max(1, Math.floor(Number(this.customRBet) || this.selectedChip));
        if (this.balance < bet) {
            alert('Nedostatek financí pro sázku!');
            return;
        }

        SFX.chip();
        this.setBalance(this.balance - bet);

        const existing = this.rBets.find(b => b.type === type && (value === undefined || b.value === value));
        if (existing) {
            existing.amount += bet;
        } else {
            this.rBets.push({ type, value, amount: bet });
        }

        this.renderArena();
        this.drawRouletteCanvas(this.rWheelAngle);
    }

    clearRouletteBets() {
        if (this.rSpinning) return;
        const total = this.rBets.reduce((sum, b) => sum + b.amount, 0);
        this.setBalance(this.balance + total);
        this.rBets = [];
        this.renderArena();
        this.drawRouletteCanvas(this.rWheelAngle);
    }

    spinRoulette() {
        if (this.rSpinning || this.rBets.length === 0) return;
        this.rSpinning = true;
        this.rResultMsg = '';
        this.rParticles = []; // Reset částic
        this.renderArena();

        const winIdx = Math.floor(Math.random() * this.rouletteWheelNumbers.length);
        const winNum = this.rouletteWheelNumbers[winIdx];
        const sliceAngle = (Math.PI * 2) / this.rouletteWheelNumbers.length;

        const desiredOffset = -Math.PI / 2 - (winIdx + 0.5) * sliceAngle;
        const extraTurns = Math.PI * 2 * 8; // Více otáček
        const totalWheelDelta = extraTurns + ((desiredOffset - (this.rWheelAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2));

        const startWheelAngle = this.rWheelAngle;
        const duration = 5000; // Delší animace
        const startTime = performance.now();

        let lastTickAngle = 0;
        let winFlash = 0;
        let winPhase = 0; // 0 = spin, 1 = reveal, 2 = particles

        const animateWheel = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 3.2);

            this.rWheelAngle = startWheelAngle + totalWheelDelta * easeOut;

            // Míček s více otáčkami a realistickým pohybem
            const ballTurns = Math.PI * 2 * 12 * (1 - easeOut);
            const ballAngle = -Math.PI / 2 + (1 - progress) * ballTurns;

            // Míček se postupně blíží ke středu
            const ballDistProgress = Math.max(0, 1 - progress * 1.5);
            const ballDist = 0.73 - ballDistProgress * 0.15;

            this.drawRouletteCanvas(this.rWheelAngle, ballAngle, winPhase >= 1 ? winNum : -1, winFlash);

            if (Math.abs(this.rWheelAngle - lastTickAngle) > 0.35) {
                SFX.spinTick();
                lastTickAngle = this.rWheelAngle;
            }

            if (progress < 1) {
                requestAnimationFrame(animateWheel);
            } else {
                this.rSpinning = false;
                this.rHistory.push(winNum);

                const winningColor = winNum === 0 ? 'green' : (this.redNumbers.has(winNum) ? 'red' : 'black');

                let totalPayout = 0;
                for (const b of this.rBets) {
                    if (b.type === 'number' && b.value === winNum) {
                        totalPayout += b.amount * 36;
                    } else if (b.type === 'red' && winningColor === 'red') {
                        totalPayout += b.amount * 2;
                    } else if (b.type === 'black' && winningColor === 'black') {
                        totalPayout += b.amount * 2;
                    } else if (b.type === 'even' && winNum !== 0 && winNum % 2 === 0) {
                        totalPayout += b.amount * 2;
                    } else if (b.type === 'odd' && winNum !== 0 && winNum % 2 !== 0) {
                        totalPayout += b.amount * 2;
                    } else if (b.type === '1-18' && winNum >= 1 && winNum <= 18) {
                        totalPayout += b.amount * 2;
                    } else if (b.type === '19-36' && winNum >= 19 && winNum <= 36) {
                        totalPayout += b.amount * 2;
                    }
                }

                // Animace výhry s efekty
                winPhase = 1;
                const cvs = document.getElementById('rouletteCanvas');
                const cx = cvs ? cvs.width / 2 : 300;
                const cy = cvs ? cvs.height / 2 : 300;

                if (totalPayout > 0) {
                    // Větší výhra = více částic
                    const particleCount = Math.min(200, 50 + Math.floor(totalPayout / 100));
                    const colors = ['#ffd700', '#ff6b35', '#ff4444', '#ffffff', '#ffaa00', '#ff00ff'];
                    this.spawnWinParticles(cx, cy, particleCount, colors);
                }

                // Animace flash efektu
                const flashDuration = 2000;
                const flashStart = performance.now();

                const animateWin = (now) => {
                    const flashElapsed = now - flashStart;
                    const flashProgress = Math.min(1, flashElapsed / flashDuration);

                    // Flash bliká 3x
                    winFlash = Math.max(0, Math.sin(flashProgress * Math.PI * 6) * (1 - flashProgress));

                    this.drawRouletteCanvas(this.rWheelAngle, -Math.PI / 2, winNum, winFlash);

                    if (flashProgress < 1) {
                        requestAnimationFrame(animateWin);
                    } else {
                        // Finální stav
                        if (totalPayout > 0) {
                            this.setBalance(this.balance + totalPayout);
                            const totalWager = this.rBets.reduce((sum, bet) => sum + bet.amount, 0);
                            this.activeCelebration = this.createWinCelebration(totalPayout, totalWager);
                            if (this.activeCelebration.percent >= 300) SFX.bigWinFanfare(); else SFX.win();
                            this.rResultMsg = `Zlatá kulička padla na ${winNum} (${winningColor.toUpperCase()})! Vyhráváte $${totalPayout.toLocaleString()}! 🎉`;
                        } else {
                            SFX.lose();
                            this.rResultMsg = `Kulička padla na číslo ${winNum} (${winningColor.toUpperCase()}).`;
                        }

                        this.rBets = [];
                        if (this.activeCelebration) this.render();
                        else { this.renderArena(); this.drawRouletteCanvas(this.rWheelAngle); }
                    }
                };

                requestAnimationFrame(animateWin);
            }
        };

        requestAnimationFrame(animateWheel);
    }

    // ============================== EVENTS ==============================

    getResultClass(msg) {
        if (msg.includes('JACKPOT') || msg.includes('Vyhráváte') || msg.includes('Vítězství') || msg.includes('Výhra') || msg.includes('WIN')) return 'palace-win';
        if (msg.includes('Remíza')) return 'palace-push';
        return 'palace-lose';
    }

    renderArena() {
        const arena = document.getElementById('palaceArena');
        if (arena) {
            arena.innerHTML = this.renderActiveGame();
            this.attachGameControls();
            window.dispatchEvent(new CustomEvent('casino:render', { detail: { game: this.activeGame, spinning: this.slotSpinning } }));
            if (window.gsap) {
                const targets = arena.querySelectorAll(`${this.slotSpinning ? '.palace-cell, .wheel-canvas-box' : '.slot-cell, .palace-cell, .wheel-canvas-box'}`);
                window.gsap.fromTo(targets, { y: 12, opacity: 0.65 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.012, ease: 'power2.out', clearProps: 'transform' });
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input && input.id === 'casinoSearch') {
                this.searchQuery = input.value;
                if (this.searchQuery.trim().toLowerCase() === 'elpaso') {
                    if (!this.adminUnlocked) {
                        this.adminUnlocked = true;
                        SFX.win();
                        this.render();
                    }
                }
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target;

            // Dismiss Celebration
            if (target.closest('#btnDismissCelebration') || target.id === 'celebrationBackdrop') {
                this.activeCelebration = null;
                this.render();
                return;
            }

            if (target.closest('#btnOpenAdmin')) {
                SFX.chip();
                this.showAdminModal = true;
                this.render();
                return;
            }

            if (target.closest('#btnCloseAdmin') || target.id === 'adminBackdrop') {
                this.showAdminModal = false;
                this.render();
                return;
            }

            if (target.closest('#btnSaveAdminMoney')) {
                const inp = document.getElementById('adminMoneyInput');
                if (inp) {
                    const amt = parseInt(inp.value, 10);
                    if (!isNaN(amt) && amt >= 0) {
                        this.setBalance(amt);
                        SFX.win();
                        this.showAdminModal = false;
                        this.render();
                    }
                }
                return;
            }

            const addBtn = target.closest('[data-add-money]');
            if (addBtn && addBtn.dataset.addMoney) {
                const add = parseInt(addBtn.dataset.addMoney, 10);
                this.setBalance(this.balance + add);
                SFX.win();
                const inp = document.getElementById('adminMoneyInput');
                if (inp) inp.value = String(this.balance);
                return;
            }

            if (target.closest('#btnAdminReset')) {
                this.setBalance(0);
                SFX.lose();
                const inp = document.getElementById('adminMoneyInput');
                if (inp) inp.value = '0';
                return;
            }

            const tabBtn = target.closest('.palace-tab-btn');
            if (tabBtn && tabBtn.dataset.tab) {
                this.activeGame = tabBtn.dataset.tab;
                this.render();
                return;
            }

            const chipBtn = target.closest('.dragon-chip');
            if (chipBtn && chipBtn.dataset.chip) {
                SFX.chip();
                this.selectedChip = parseInt(chipBtn.dataset.chip, 10);
                document.querySelectorAll('.dragon-chip').forEach(c => c.classList.remove('active'));
                chipBtn.classList.add('active');
                return;
            }
        });
    }

    attachGameControls() {
        document.getElementById('btnSpinSlots')?.addEventListener('click', () => this.spinSlots());
        document.getElementById('slotCustomBet')?.addEventListener('input', e => { this.customSlotBet = Math.max(1, Math.floor(Number(e.target.value) || 1)); });
        document.getElementById('slotSpeedSlider')?.addEventListener('input', e => {
            this.slotSpeed = Math.max(0.75, Math.min(4, Number(e.target.value) || 1));
            const output = document.getElementById('slotSpeedValue');
            if (output) output.textContent = `${this.slotSpeed.toFixed(2).replace(/\.0$/, '')}×`;
        });
        document.querySelectorAll('[data-autospin]').forEach(btn => btn.addEventListener('click', () => { this.autoSpinRemaining = Number(btn.dataset.autospin); this.runAutoSpin(); }));
        document.getElementById('btnStopAuto')?.addEventListener('click', () => { this.autoSpinRemaining = 0; this.renderArena(); });

        document.getElementById('bjCustomBet')?.addEventListener('input', e => { this.customBjBet = Math.max(1, Math.floor(Number(e.target.value) || 1)); });
        document.getElementById('btnBjDeal')?.addEventListener('click', () => this.bjDeal());
        document.getElementById('btnBjHit')?.addEventListener('click', () => this.bjHit());
        document.getElementById('btnBjStand')?.addEventListener('click', () => this.bjStand());
        document.getElementById('btnBjDouble')?.addEventListener('click', () => this.bjDouble());

        document.getElementById('bacCustomBet')?.addEventListener('input', e => { this.customBacBet = Math.max(1, Math.floor(Number(e.target.value) || 1)); });
        document.querySelectorAll('[data-bac-bet]').forEach(el => {
            el.addEventListener('click', () => {
                const betType = el.dataset.bacBet;
                if (betType) this.selectBaccaratBet(betType);
            });
        });
        document.getElementById('btnBacDeal')?.addEventListener('click', () => this.dealBaccarat());

        document.getElementById('rCustomBet')?.addEventListener('input', e => { this.customRBet = Math.max(1, Math.floor(Number(e.target.value) || 1)); });
        document.querySelectorAll('[data-r-type]').forEach(el => {
            el.addEventListener('click', () => {
                const target = el;
                const rType = target.dataset.rType;
                const rVal = target.dataset.rVal ? parseInt(target.dataset.rVal, 10) : undefined;
                this.addRouletteBet(rType, rVal);
            });
        });
        document.getElementById('btnSpinRoulette')?.addEventListener('click', () => this.spinRoulette());
        document.getElementById('btnClearRoulette')?.addEventListener('click', () => this.clearRouletteBets());
    }

    async runAutoSpin() {
        if (!this.autoSpinRemaining || this.slotSpinning) return;
        this.autoSpinRemaining--;
        await this.spinSlots();
        if (this.autoSpinRemaining > 0 && this.balance >= this.customSlotBet) setTimeout(() => this.runAutoSpin(), 420 / this.slotSpeed);
        else { this.autoSpinRemaining = 0; this.renderArena(); }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const casino = new MerunkovaSplouchacka();
        casino.init();
    });
}
