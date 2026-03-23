/**
 * Registre des types de dés disponibles.
 * Pour ajouter un nouveau dé, ajouter une entrée ici.
 */
export const DICE_REGISTRY = {
    d4:   { faces: 4,   label: "D4",   maxQuantity: 10 },
    d6:   { faces: 6,   label: "D6",   maxQuantity: 10 },
    d8:   { faces: 8,   label: "D8",   maxQuantity: 10 },
    d10:  { faces: 10,  label: "D10",  maxQuantity: 10 },
    d12:  { faces: 12,  label: "D12",  maxQuantity: 10 },
    d20:  { faces: 20,  label: "D20",  maxQuantity: 10 },
    d100: { faces: 100, label: "D100", maxQuantity: 1, display: "percentile" },
};

export function rollDice(diceType, quantity) {
    const config = DICE_REGISTRY[diceType];
    if (!config) throw new Error(`Unknown dice type: ${diceType}`);
    if (quantity < 1 || quantity > config.maxQuantity) {
        throw new Error(`Invalid quantity ${quantity} for ${diceType} (max: ${config.maxQuantity})`);
    }

    const results = Array.from({ length: quantity }, () =>
        Math.floor(Math.random() * config.faces) + 1
    );
    return {
        diceType,
        quantity,
        results,
        total: results.reduce((a, b) => a + b, 0),
    };
}
