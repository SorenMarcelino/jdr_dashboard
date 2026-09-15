// Palette partagée par les graphiques en camembert (DiceTypeChart,
// SpeechShareChart). Le thème ne définit que --chart-1 … --chart-5
// (src/app/globals.css, en clair, en sombre et pour chaque thème de système
// de jeu) : au-delà de 5 entrées, on ne fabrique pas une 6e couleur, on
// réutilise les 5 premières en teinte plus claire pour rester dans le thème
// tout en restant visuellement distinct des slices pleines.
export const chartFill = (i: number): string =>
    i < 5 ? `hsl(var(--chart-${i + 1}))` : `hsl(var(--chart-${i - 4}) / 0.5)`;
