/**
 * TS/css.ts - Dragon Palace Theme Definitions for Meruňková Šplouchačka
 */

export interface DragonPalaceTheme {
    palaceRed: string;
    palaceCrimson: string;
    palaceGold: string;
    palaceAmber: string;
    palaceApricot: string;
    palaceJade: string;
    palaceDark: string;
}

export const DRAGON_PALACE_THEME: DragonPalaceTheme = {
    palaceRed: '#8b0000',
    palaceCrimson: '#a81c1c',
    palaceGold: '#ffd700',
    palaceAmber: '#f97316',
    palaceApricot: '#fb923c',
    palaceJade: '#059669',
    palaceDark: '#0f0406'
};

export interface ChipConfig {
    value: number;
    label: string;
    colorClass: string;
}

export const CASINO_CHIPS: ChipConfig[] = [
    { value: 10, label: '$10', colorClass: 'chip-10' },
    { value: 25, label: '$25', colorClass: 'chip-25' },
    { value: 50, label: '$50', colorClass: 'chip-50' },
    { value: 100, label: '$100', colorClass: 'chip-100' },
    { value: 500, label: '$500', colorClass: 'chip-500' }
];
