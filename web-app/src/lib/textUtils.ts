/**
 * Text normalization utilities
 */

/**
 * Normalizes a string by removing accents and special characters
 * Ø → O, É → E, ü → u, etc.
 */
export function normalizeText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
        .replace(/Ø/g, 'O')
        .replace(/ø/g, 'o')
        .replace(/Æ/g, 'AE')
        .replace(/æ/g, 'ae')
        .replace(/ß/g, 'ss')
        .replace(/Đ/g, 'D')
        .replace(/đ/g, 'd')
        .toLowerCase();
}

/**
 * Checks if a name matches a search query (accent-insensitive)
 */
export function matchesSearch(name: string, query: string): boolean {
    if (!query) return true;
    return normalizeText(name).includes(normalizeText(query));
}
