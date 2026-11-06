/**
 * TS/casino.ts - Meruňková Šplouchačka (Dragon Palace Imperial Casino)
 * 3x5 Video Slot with Paylines, Wilds, Free Spins, Tiered Win Celebrations,
 * Blackjack, Baccarat, Canvas Physics Roulette, and ELpaso Admin Panel.
 */

import { DRAGON_PALACE_THEME, CASINO_CHIPS } from './css.ts';

// ============================== TYPES & INTERFACES ==============================

export type GameType = 'blackjack' | 'slots' | 'baccarat' | 'roulette';
export type Suit = '♠' | '♥' | '♦' | '♣';

export interface Card {
    suit: Suit;
    value: string;
    numValue: number;
    color: 'red' | 'black';
}

export interface SlotSymbol {
    id: string;
    icon: string;
    name: string;
    isWild?: boolean;
    isScatter?: boolean;
    payout: { [matches: number]: number };
}

export interface CelebrationTier {
    threshold: number;
    title: string;
    tierClass: string;
    badge: string;
}

export const WIN_TIERS: CelebrationTier[] = [
    { threshold: 4500, title: 'DRAGON MASTER MIND', tierClass: 'tier-mastermind', badge: '🐉' },
    { threshold: 3000, title: 'INHUMAN WIN', tierClass: 'tier-inhuman', badge: '💥' },
    { threshold: 2000, title: 'BRUTAL WIN', tierClass: 'tier-brutal', badge: '⚡' },
    { threshold: 1200, title: 'SUPER SONIC WIN', tierClass: 'tier-supersonic', badge: '🚀' },
    { threshold: 760, title: 'ULTRA WIN', tierClass: 'tier-ultra', badge: '💎' },
    { threshold: 400, title: 'SUPER WIN', tierClass: 'tier-super', badge: '🌟' }
];

export type BaccaratBet = 'player' | 'banker' | 'tie';

export interface RouletteBet {
    type: 'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36' | 'number';
    value?: number;
    amount: number;
}

// 10 Classic Paylines on a 3x5 Matrix (col: 0..4, row: 0..2)
export const PAYLINES: number[][] = [
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
    private ctx: AudioContext | null = null;
    public enabled: boolean = true;

    private getContext(): AudioContext | null {
        if (!this.enabled) return null;
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public chip(): void {
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

    public card(): void {
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

    public win(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
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

    public bigWinFanfare(): void {
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

    public lose(): void {
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

    public spinTick(): void {
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

    public reelStop(): void {
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

function createDeck(): Card[] {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

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

function renderImperialCard(card: Card, hidden = false): string {
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

export class MerunkovaSplouchacka {
    private balance: number = 1000;
    private selectedChip: number = 25;
    private activeGame: GameType = 'slots';

    // Search & Admin State
    private searchQuery: string = '';
    private adminUnlocked: boolean = false;
    private showAdminModal: boolean = false;

    // Blackjack State
    private bjDeck: Card[] = [];
    private bjPlayerHand: Card[] = [];
    private bjDealerHand: Card[] = [];
    private bjBet: number = 0;
    private bjStatus: 'idle' | 'playing' | 'resolved' = 'idle';
    private bjResultMsg: string = '';

    // 3x5 Video Slot State
    private slotSymbols: SlotSymbol[] = [
        { id: 'dragon', icon: '🐉', name: 'Císařský Drak', isWild: true, payout: { 3: 100, 4: 350, 5: 1200 } },
        { id: 'gong', icon: '🪭', name: 'Zlatý Gong', isScatter: true, payout: { 3: 20, 4: 100, 5: 500 } },
        { id: 'apricot', icon: '🍑', name: 'Zlatá Meruňka', payout: { 3: 40, 4: 150, 5: 600 } },
        { id: 'crown', icon: '👑', name: 'Císařská Koruna', payout: { 3: 25, 4: 90, 5: 350 } },
        { id: 'lantern', icon: '🏮', name: 'Palácová Lucerna', payout: { 3: 18, 4: 60, 5: 220 } },
        { id: 'ingot', icon: '🪙', name: 'Zlatý Tael', payout: { 3: 12, 4: 40, 5: 150 } },
        { id: 'bamboo', icon: '🎋', name: 'Bambus Štěstí', payout: { 3: 8, 4: 25, 5: 100 } },
        { id: 'sakura', icon: '🌸', name: 'Květ Sakury', payout: { 3: 5, 4: 15, 5: 60 } }
    ];

    // 5 columns x 3 rows matrix
    private slotMatrix: SlotSymbol[][] = [];
    private slotSpinning: boolean = false;
    private slotBet: number = 25;
    private slotResultMsg: string = '';
    private winningCells: Set<string> = new Set();

    // Free Spins State
    private freeSpinsRemaining: number = 0;
    private freeSpinsTotalWin: number = 0;
    private freeSpinsMultiplier: number = 3;

    // Celebration Overlay State
    private activeCelebration: CelebrationTier & { amount: number } | null = null;

    // Baccarat State
    private bacDeck: Card[] = [];
    private bacPlayerHand: Card[] = [];
    private bacBankerHand: Card[] = [];
    private bacSelectedBet: BaccaratBet | null = null;
    private bacBetAmount: number = 0;
    private bacStatus: 'idle' | 'resolved' = 'idle';
    private bacResultMsg: string = '';
    private bacHistory: ('P' | 'B' | 'T')[] = [];

    // Roulette State
    private rBets: RouletteBet[] = [];
    private rSpinning: boolean = false;
    private rWheelAngle: number = 0;
    private rResultMsg: string = '';
    private rHistory: number[] = [];

    private readonly rouletteWheelNumbers = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];
    private readonly redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

    constructor() {
        this.initSlotMatrix();
        this.loadBalance();
    }

    private initSlotMatrix(): void {
        this.slotMatrix = Array.from({ length: 5 }, () =>
            Array.from({ length: 3 }, () => this.getRandomSymbol())
        );
    }

    private getRandomSymbol(): SlotSymbol {
        // Weighted distribution: Scatters & Wilds slightly rarer
        const rand = Math.random();
        if (rand < 0.06) return this.slotSymbols[0]; // Wild Dragon (6%)
        if (rand < 0.12) return this.slotSymbols[1]; // Scatter Gong (6%)
        if (rand < 0.22) return this.slotSymbols[2]; // Apricot (10%)
        if (rand < 0.35) return this.slotSymbols[3]; // Crown (13%)
        if (rand < 0.50) return this.slotSymbols[4]; // Lantern (15%)
        if (rand < 0.65) return this.slotSymbols[5]; // Ingot (15%)
        if (rand < 0.82) return this.slotSymbols[6]; // Bamboo (17%)
        return this.slotSymbols[7]; // Sakura (18%)
    }

    public init(): void {
        this.render();
        this.setupEventListeners();
    }

    private loadBalance(): void {
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

    private saveBalance(): void {
        try {
            localStorage.setItem('riv-casino-balance', String(this.balance));
        } catch {}
    }

    public setBalance(amt: number): void {
        this.balance = Math.max(0, amt);
        this.saveBalance();
        this.updateHeaderDisplay();
    }

    // ============================== HTML RENDER ==============================

    public render(): void {
        const root = document.getElementById('casino-app');
        if (!root) return;

        root.innerHTML = `
            <div class="palace-ambience"></div>
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
                                       placeholder="Hledat / kód (zkus ELpaso)..." value="${this.searchQuery}" autocomplete="off">
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
        if (this.activeGame === 'roulette') {
            this.drawRouletteCanvas(this.rWheelAngle);
        }
    }

    private updateHeaderDisplay(): void {
        const el = document.getElementById('balanceDisplay');
        if (el) el.textContent = `$${this.balance.toLocaleString()}`;
    }

    private renderActiveGame(): string {
        switch (this.activeGame) {
            case 'slots': return this.renderSlots();
            case 'blackjack': return this.renderBlackjack();
            case 'baccarat': return this.renderBaccarat();
            case 'roulette': return this.renderRoulette();
        }
    }

    // ============================== TIERED CELEBRATION MODAL ==============================

    private renderCelebrationModal(): string {
        if (!this.activeCelebration) return '';
        const c = this.activeCelebration;

        return `
            <div class="tiered-win-modal-backdrop" id="celebrationBackdrop">
                <div class="tiered-win-dialog">
                    <div class="tiered-win-badge">${c.badge}</div>
                    <div class="tiered-win-title ${c.tierClass}">
                        ${c.title}!
                    </div>
                    <div class="tiered-win-amount" id="celebrationAmount">
                        +$${c.amount.toLocaleString()}
                    </div>
                    <p style="color:#fde68a;font-size:1.1rem;margin:0;">
                        Císařský Palác vzdává poctu tvému obřímu zisku!
                    </p>
                    <button class="btn-palace btn-palace-gold mt-4" id="btnDismissCelebration">
                        Vyzvednout Císařský Poklad
                    </button>
                    <div class="tiered-win-dismiss">Kliknutím kdekoliv zavřete</div>
                </div>
            </div>
        `;
    }

    // ============================== ADMIN MODAL ==============================

    private renderAdminModal(): string {
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

    // ============================== 3x5 VIDEO SLOTS ==============================

    private renderSlots(): string {
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

                    <!-- 3x5 Reels Matrix Stage -->
                    <div class="reels-stage-3x5" id="reelsStage">
                        ${[0, 1, 2, 3, 4].map(colIdx => `
                            <div class="reel-column-3x5 ${this.slotSpinning ? 'spinning' : ''}" id="reelCol${colIdx}">
                                ${[0, 1, 2].map(rowIdx => {
                                    const sym = this.slotMatrix[colIdx][rowIdx];
                                    const isWin = this.winningCells.has(`${colIdx},${rowIdx}`);
                                    const extraCls = sym.isWild ? 'wild-cell' : (sym.isScatter ? 'scatter-cell' : '');
                                    return `
                                        <div class="slot-cell ${isWin ? 'win-cell' : ''} ${extraCls}" id="slotCell_${colIdx}_${rowIdx}">
                                            <div class="symbol-icon">${sym.icon}</div>
                                            <div class="symbol-badge">${sym.isWild ? 'WILD' : (sym.isScatter ? 'SCATTER' : sym.name.split(' ')[1] || sym.name)}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `).join('')}
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
                    <button class="btn-palace btn-palace-gold" id="btnSpinSlots" ${this.slotSpinning ? 'disabled' : ''}>
                        ${this.freeSpinsRemaining > 0 ? `🔥 Volné Zatočení (${this.freeSpinsRemaining} zdarma)` : `🎰 Roztočit Válce ($${this.selectedChip})`}
                    </button>
                </div>
            </div>
        `;
    }

    private spinSlots(): void {
        if (this.slotSpinning) return;

        const isFreeSpin = this.freeSpinsRemaining > 0;
        if (!isFreeSpin) {
            if (this.balance < this.selectedChip) {
                alert('Nedostatek financí! Použijte tajný kód ELpaso pro doplnění pokladny.');
                return;
            }
            this.slotBet = this.selectedChip;
            this.setBalance(this.balance - this.slotBet);
        } else {
            this.freeSpinsRemaining--;
        }

        this.slotSpinning = true;
        this.slotResultMsg = '';
        this.winningCells.clear();
        this.renderArena();

        // Target new 3x5 matrix outcome
        const finalMatrix: SlotSymbol[][] = Array.from({ length: 5 }, () =>
            Array.from({ length: 3 }, () => this.getRandomSymbol())
        );

        // Rapid cycling animation with sequential stop
        let ticks = 0;
        const stoppedCols = [false, false, false, false, false];

        const spinTimer = setInterval(() => {
            ticks++;
            SFX.spinTick();

            // Randomize symbols for columns still spinning
            for (let c = 0; c < 5; c++) {
                if (!stoppedCols[c]) {
                    for (let r = 0; r < 3; r++) {
                        const cell = document.getElementById(`slotCell_${c}_${r}`);
                        if (cell) {
                            const tempSym = this.slotSymbols[Math.floor(Math.random() * this.slotSymbols.length)];
                            cell.querySelector('.symbol-icon')!.textContent = tempSym.icon;
                        }
                    }
                }
            }

            // Sequential Stops:
            // Col 0 at ~0.8s (13 ticks)
            if (ticks >= 13 && !stoppedCols[0]) {
                this.stopColumn(0, finalMatrix);
                stoppedCols[0] = true;
            }
            // Col 1 at ~1.1s (18 ticks)
            if (ticks >= 18 && !stoppedCols[1]) {
                this.stopColumn(1, finalMatrix);
                stoppedCols[1] = true;
            }
            // Col 2 at ~1.4s (23 ticks)
            if (ticks >= 23 && !stoppedCols[2]) {
                this.stopColumn(2, finalMatrix);
                stoppedCols[2] = true;
            }
            // Col 3 at ~1.7s (28 ticks)
            if (ticks >= 28 && !stoppedCols[3]) {
                this.stopColumn(3, finalMatrix);
                stoppedCols[3] = true;
            }
            // Col 4 at ~2.0s (33 ticks)
            if (ticks >= 33) {
                clearInterval(spinTimer);
                this.stopColumn(4, finalMatrix);
                stoppedCols[4] = true;

                this.slotMatrix = finalMatrix;
                this.slotSpinning = false;
                this.evaluateSlotWins(isFreeSpin);
            }
        }, 60);
    }

    private stopColumn(colIdx: number, finalMatrix: SlotSymbol[][]): void {
        const colEl = document.getElementById(`reelCol${colIdx}`);
        if (colEl) colEl.classList.remove('spinning');

        for (let r = 0; r < 3; r++) {
            const cell = document.getElementById(`slotCell_${colIdx}_${r}`);
            if (cell) {
                const sym = finalMatrix[colIdx][r];
                cell.querySelector('.symbol-icon')!.textContent = sym.icon;
                cell.className = `slot-cell ${sym.isWild ? 'wild-cell' : (sym.isScatter ? 'scatter-cell' : '')}`;
            }
        }
        SFX.reelStop();
    }

    private evaluateSlotWins(isFreeSpin: boolean): void {
        let totalWin = 0;
        const lineBet = Math.max(1, Math.floor(this.slotBet / 10));
        let winningLinesCount = 0;

        // 1. Evaluate 10 Paylines
        for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
            const lineDef = PAYLINES[lineIdx];
            const lineSymbols = lineDef.map((row, col) => this.slotMatrix[col][row]);

            // Find first non-wild symbol (or default to dragon wild)
            let baseSymbol = lineSymbols.find(s => !s.isWild && !s.isScatter) || lineSymbols[0];

            if (baseSymbol.isScatter) continue; // Scatters pay separately

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

                    // Mark winning cells for visual glow
                    for (let c = 0; c < matches; c++) {
                        this.winningCells.add(`${c},${lineDef[c]}`);
                    }
                }
            }
        }

        // 2. Evaluate Scatters (🪭 Gong)
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

        // 3. Process Total Win
        if (totalWin > 0) {
            this.setBalance(this.balance + totalWin);
            if (isFreeSpin) this.freeSpinsTotalWin += totalWin;

            // Check Tiered Win Celebrations
            const matchedTier = WIN_TIERS.find(t => totalWin >= t.threshold);

            if (matchedTier) {
                SFX.bigWinFanfare();
                this.activeCelebration = { ...matchedTier, amount: totalWin };
                this.slotResultMsg = `🏆 ${matchedTier.title}! Výhra $${totalWin.toLocaleString()}!`;
            } else {
                SFX.win();
                this.slotResultMsg = `✨ Výhra na ${winningLinesCount} liniích! Získáno $${totalWin.toLocaleString()}!`;
            }

            if (scatterWinMsg) {
                this.slotResultMsg += ` | ${scatterWinMsg}`;
            }
        } else {
            SFX.lose();
            this.slotResultMsg = 'Žádná výherní kombinace na 10 liniích. Zkus štěstí znovu!';
        }

        this.renderArena();
    }

    // ============================== BLACKJACK ==============================

    private getBlackjackScore(hand: Card[]): number {
        let score = hand.reduce((sum, c) => sum + c.numValue, 0);
        let aces = hand.filter(c => c.value === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    private renderBlackjack(): string {
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
                    <button class="btn-palace btn-palace-gold" id="btnBjDeal">
                        Rozdat Karty ($${this.selectedChip})
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

    private bjDeal(): void {
        if (this.balance < this.selectedChip) {
            alert('Nedostatek financí! Použijte tajný kód ELpaso v hledáčku pro doplnění peněz.');
            return;
        }

        SFX.chip();
        this.bjBet = this.selectedChip;
        this.setBalance(this.balance - this.bjBet);

        this.bjDeck = createDeck();
        this.bjPlayerHand = [this.bjDeck.pop()!, this.bjDeck.pop()!];
        this.bjDealerHand = [this.bjDeck.pop()!, this.bjDeck.pop()!];
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

    private bjHit(): void {
        if (this.bjStatus !== 'playing') return;
        SFX.card();
        this.bjPlayerHand.push(this.bjDeck.pop()!);
        const score = this.getBlackjackScore(this.bjPlayerHand);

        if (score > 21) {
            this.bjStatus = 'resolved';
            SFX.lose();
            this.bjResultMsg = `Přetaženo (${score})! Palác vítězí.`;
        }
        this.renderArena();
    }

    private bjStand(): void {
        if (this.bjStatus !== 'playing') return;
        this.bjStatus = 'resolved';

        while (this.getBlackjackScore(this.bjDealerHand) < 17) {
            this.bjDealerHand.push(this.bjDeck.pop()!);
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

    private bjDouble(): void {
        if (this.bjStatus !== 'playing' || this.balance < this.bjBet) return;
        this.setBalance(this.balance - this.bjBet);
        this.bjBet *= 2;
        SFX.chip();
        this.bjPlayerHand.push(this.bjDeck.pop()!);
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

    private getBaccaratScore(hand: Card[]): number {
        const sum = hand.reduce((total, c) => {
            if (['10', 'J', 'Q', 'K'].includes(c.value)) return total;
            if (c.value === 'A') return total + 1;
            return total + c.numValue;
        }, 0);
        return sum % 10;
    }

    private renderBaccarat(): string {
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
                    <button class="btn-palace btn-palace-gold" id="btnBacDeal" ${!this.bacSelectedBet ? 'disabled' : ''}>
                        Rozdat Baccarat
                    </button>
                </div>
            </div>
        `;
    }

    private selectBaccaratBet(type: BaccaratBet): void {
        SFX.chip();
        this.bacSelectedBet = type;
        this.bacBetAmount = this.selectedChip;
        this.renderArena();
    }

    private dealBaccarat(): void {
        if (!this.bacSelectedBet) return;
        if (this.balance < this.bacBetAmount) {
            alert('Nedostatek financí pro hru!');
            return;
        }

        this.setBalance(this.balance - this.bacBetAmount);
        this.bacDeck = createDeck();
        this.bacPlayerHand = [this.bacDeck.pop()!, this.bacDeck.pop()!];
        this.bacBankerHand = [this.bacDeck.pop()!, this.bacDeck.pop()!];

        let pScore = this.getBaccaratScore(this.bacPlayerHand);
        let bScore = this.getBaccaratScore(this.bacBankerHand);

        if (pScore >= 8 || bScore >= 8) {
            this.resolveBaccarat(pScore, bScore);
            return;
        }

        let playerThirdCardVal: number | null = null;
        if (pScore <= 5) {
            const p3 = this.bacDeck.pop()!;
            this.bacPlayerHand.push(p3);
            playerThirdCardVal = ['10', 'J', 'Q', 'K'].includes(p3.value) ? 0 : (p3.value === 'A' ? 1 : p3.numValue);
            pScore = this.getBaccaratScore(this.bacPlayerHand);
        }

        if (playerThirdCardVal === null) {
            if (bScore <= 5) {
                this.bacBankerHand.push(this.bacDeck.pop()!);
            }
        } else {
            if (bScore <= 2) {
                this.bacBankerHand.push(this.bacDeck.pop()!);
            } else if (bScore === 3 && playerThirdCardVal !== 8) {
                this.bacBankerHand.push(this.bacDeck.pop()!);
            } else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(playerThirdCardVal)) {
                this.bacBankerHand.push(this.bacDeck.pop()!);
            } else if (bScore === 5 && [4, 5, 6, 7].includes(playerThirdCardVal)) {
                this.bacBankerHand.push(this.bacDeck.pop()!);
            } else if (bScore === 6 && [6, 7].includes(playerThirdCardVal)) {
                this.bacBankerHand.push(this.bacDeck.pop()!);
            }
        }

        bScore = this.getBaccaratScore(this.bacBankerHand);
        this.resolveBaccarat(pScore, bScore);
    }

    private resolveBaccarat(pScore: number, bScore: number): void {
        let winner: 'player' | 'banker' | 'tie';
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

    // ============================== CANVAS PHYSICS ROULETTE ==============================

    private renderRoulette(): string {
        const totalBets = this.rBets.reduce((sum, b) => sum + b.amount, 0);

        return `
            <div class="roulette-palace-stage">
                <div class="wheel-canvas-box">
                    <canvas id="rouletteCanvas" width="280" height="280"></canvas>
                </div>

                ${this.rResultMsg ? `<div class="palace-result ${this.getResultClass(this.rResultMsg)}">${this.rResultMsg}</div>` : ''}

                <div class="palace-roulette-board">
                    <div class="roulette-grid-13">
                        <div class="palace-cell r-green ${this.hasRouletteBet('number', 0) ? 'has-bet' : ''}" data-r-type="number" data-r-val="0">0</div>
                        ${Array.from({ length: 36 }, (_, i) => i + 1).map(num => `
                            <div class="palace-cell ${this.redNumbers.has(num) ? 'r-red' : 'r-black'} ${this.hasRouletteBet('number', num) ? 'has-bet' : ''}"
                                 data-r-type="number" data-r-val="${num}">
                                ${num}
                            </div>
                        `).join('')}
                    </div>

                    <div class="outside-bets-grid">
                        <button class="outside-palace-btn ${this.hasRouletteBet('1-18') ? 'has-bet' : ''}" data-r-type="1-18">1-18 (1:1)</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('even') ? 'has-bet' : ''}" data-r-type="even">SUDÁ (1:1)</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('red') ? 'has-bet' : ''}" style="background:#b91c1c;" data-r-type="red">ČERVENÁ (1:1)</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('black') ? 'has-bet' : ''}" style="background:#18181b;" data-r-type="black">ČERNÁ (1:1)</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('odd') ? 'has-bet' : ''}" data-r-type="odd">LICHÁ (1:1)</button>
                        <button class="outside-palace-btn ${this.hasRouletteBet('19-36') ? 'has-bet' : ''}" data-r-type="19-36">19-36 (1:1)</button>
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

    private drawRouletteCanvas(angleRad: number, ballAngleRad: number | null = null): void {
        const cvs = document.getElementById('rouletteCanvas') as HTMLCanvasElement;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        const W = cvs.width;
        const H = cvs.height;
        const cx = W / 2;
        const cy = H / 2;
        const R = cx - 4;

        ctx.clearRect(0, 0, W, H);

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
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.save();
            ctx.rotate(startA + sliceAngle / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), R * 0.72, 0);
            ctx.restore();
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

        ctx.fillStyle = '#ffd700';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐉', 0, 0);

        ctx.restore();

        // Needle
        ctx.save();
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

        // Ball
        if (ballAngleRad !== null) {
            const ballDist = R * 0.73;
            const bx = cx + Math.cos(ballAngleRad) * ballDist;
            const by = cy + Math.sin(ballAngleRad) * ballDist;

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    private hasRouletteBet(type: string, val?: number): boolean {
        return this.rBets.some(b => b.type === type && (val === undefined || b.value === val));
    }

    private addRouletteBet(type: RouletteBet['type'], value?: number): void {
        if (this.rSpinning) return;
        if (this.balance < this.selectedChip) {
            alert('Nedostatek financí pro sázku!');
            return;
        }

        SFX.chip();
        this.setBalance(this.balance - this.selectedChip);

        const existing = this.rBets.find(b => b.type === type && (value === undefined || b.value === value));
        if (existing) {
            existing.amount += this.selectedChip;
        } else {
            this.rBets.push({ type, value, amount: this.selectedChip });
        }

        this.renderArena();
        this.drawRouletteCanvas(this.rWheelAngle);
    }

    private clearRouletteBets(): void {
        if (this.rSpinning) return;
        const total = this.rBets.reduce((sum, b) => sum + b.amount, 0);
        this.setBalance(this.balance + total);
        this.rBets = [];
        this.renderArena();
        this.drawRouletteCanvas(this.rWheelAngle);
    }

    private spinRoulette(): void {
        if (this.rSpinning || this.rBets.length === 0) return;
        this.rSpinning = true;
        this.rResultMsg = '';
        this.renderArena();

        const winIdx = Math.floor(Math.random() * this.rouletteWheelNumbers.length);
        const winNum = this.rouletteWheelNumbers[winIdx];
        const sliceAngle = (Math.PI * 2) / this.rouletteWheelNumbers.length;

        const desiredOffset = -Math.PI / 2 - (winIdx + 0.5) * sliceAngle;
        const extraTurns = Math.PI * 2 * 6;
        const totalWheelDelta = extraTurns + ((desiredOffset - (this.rWheelAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2));

        const startWheelAngle = this.rWheelAngle;
        const duration = 3800;
        const startTime = performance.now();

        let lastTickAngle = 0;

        const animateWheel = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 3.2);

            this.rWheelAngle = startWheelAngle + totalWheelDelta * easeOut;

            const ballTurns = Math.PI * 2 * 9 * (1 - easeOut);
            const ballAngle = -Math.PI / 2 + (1 - progress) * ballTurns;

            this.drawRouletteCanvas(this.rWheelAngle, ballAngle);

            if (Math.abs(this.rWheelAngle - lastTickAngle) > 0.35) {
                SFX.spinTick();
                lastTickAngle = this.rWheelAngle;
            }

            if (progress < 1) {
                requestAnimationFrame(animateWheel);
            } else {
                this.rSpinning = false;
                this.rHistory.push(winNum);
                this.drawRouletteCanvas(this.rWheelAngle, -Math.PI / 2);

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

                if (totalPayout > 0) {
                    this.setBalance(this.balance + totalPayout);
                    const matchedTier = WIN_TIERS.find(t => totalPayout >= t.threshold);
                    if (matchedTier) {
                        SFX.bigWinFanfare();
                        this.activeCelebration = { ...matchedTier, amount: totalPayout };
                    } else {
                        SFX.win();
                    }
                    this.rResultMsg = `Zlatá kulička padla na ${winNum} (${winningColor.toUpperCase()})! Vyhráváte $${totalPayout.toLocaleString()}! 🎉`;
                } else {
                    SFX.lose();
                    this.rResultMsg = `Kulička padla na číslo ${winNum} (${winningColor.toUpperCase()}).`;
                }

                this.rBets = [];
                this.renderArena();
                this.drawRouletteCanvas(this.rWheelAngle);
            }
        };

        requestAnimationFrame(animateWheel);
    }

    // ============================== HELPERS & EVENTS ==============================

    private getResultClass(msg: string): string {
        if (msg.includes('JACKPOT') || msg.includes('Vyhráváte') || msg.includes('Vítězství') || msg.includes('Výhra') || msg.includes('WIN')) return 'palace-win';
        if (msg.includes('Remíza')) return 'palace-push';
        return 'palace-lose';
    }

    private renderArena(): void {
        const arena = document.getElementById('palaceArena');
        if (arena) {
            arena.innerHTML = this.renderActiveGame();
            this.attachGameControls();
        }
    }

    private setupEventListeners(): void {
        // Search & Secret Admin Trigger
        document.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
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

        // Global Clicks
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Dismiss Tiered Celebration
            if (target.closest('#btnDismissCelebration') || target.id === 'celebrationBackdrop') {
                this.activeCelebration = null;
                this.render();
                return;
            }

            // Open Admin Modal
            if (target.closest('#btnOpenAdmin')) {
                SFX.chip();
                this.showAdminModal = true;
                this.render();
                return;
            }

            // Close Admin Modal
            if (target.closest('#btnCloseAdmin') || target.id === 'adminBackdrop') {
                this.showAdminModal = false;
                this.render();
                return;
            }

            // Save Admin Custom Money
            if (target.closest('#btnSaveAdminMoney')) {
                const inp = document.getElementById('adminMoneyInput') as HTMLInputElement;
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

            // Quick Add Money Buttons in Admin
            const addBtn = target.closest('[data-add-money]') as HTMLElement;
            if (addBtn && addBtn.dataset.addMoney) {
                const add = parseInt(addBtn.dataset.addMoney, 10);
                this.setBalance(this.balance + add);
                SFX.win();
                const inp = document.getElementById('adminMoneyInput') as HTMLInputElement;
                if (inp) inp.value = String(this.balance);
                return;
            }

            // Admin Reset Button
            if (target.closest('#btnAdminReset')) {
                this.setBalance(0);
                SFX.lose();
                const inp = document.getElementById('adminMoneyInput') as HTMLInputElement;
                if (inp) inp.value = '0';
                return;
            }

            // Tab Switching
            const tabBtn = target.closest('.palace-tab-btn') as HTMLElement;
            if (tabBtn && tabBtn.dataset.tab) {
                this.activeGame = tabBtn.dataset.tab as GameType;
                this.render();
                return;
            }

            // Chip Selector
            const chipBtn = target.closest('.dragon-chip') as HTMLElement;
            if (chipBtn && chipBtn.dataset.chip) {
                SFX.chip();
                this.selectedChip = parseInt(chipBtn.dataset.chip, 10);
                document.querySelectorAll('.dragon-chip').forEach(c => c.classList.remove('active'));
                chipBtn.classList.add('active');
                return;
            }
        });
    }

    private attachGameControls(): void {
        // Slots
        document.getElementById('btnSpinSlots')?.addEventListener('click', () => this.spinSlots());

        // Blackjack
        document.getElementById('btnBjDeal')?.addEventListener('click', () => this.bjDeal());
        document.getElementById('btnBjHit')?.addEventListener('click', () => this.bjHit());
        document.getElementById('btnBjStand')?.addEventListener('click', () => this.bjStand());
        document.getElementById('btnBjDouble')?.addEventListener('click', () => this.bjDouble());

        // Baccarat
        document.querySelectorAll('[data-bac-bet]').forEach(el => {
            el.addEventListener('click', () => {
                const betType = (el as HTMLElement).dataset.bacBet as BaccaratBet;
                if (betType) this.selectBaccaratBet(betType);
            });
        });
        document.getElementById('btnBacDeal')?.addEventListener('click', () => this.dealBaccarat());

        // Roulette
        document.querySelectorAll('[data-r-type]').forEach(el => {
            el.addEventListener('click', () => {
                const target = el as HTMLElement;
                const rType = target.dataset.rType as RouletteBet['type'];
                const rVal = target.dataset.rVal ? parseInt(target.dataset.rVal, 10) : undefined;
                this.addRouletteBet(rType, rVal);
            });
        });
        document.getElementById('btnSpinRoulette')?.addEventListener('click', () => this.spinRoulette());
        document.getElementById('btnClearRoulette')?.addEventListener('click', () => this.clearRouletteBets());
    }
}

// Auto Boot
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const casino = new MerunkovaSplouchacka();
        casino.init();
    });
}
