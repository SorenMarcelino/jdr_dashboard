// Paquet du tarot Hydre : les 22 arcanes majeurs du Tarot de Marseille, en
// emblèmes gravés à la dorure. Identifiants alignés sur
// back/config/tarotRegistry.mjs ; textes dans messages/*.json
// (skins.hydre.tarot.cards.<id>).
//
// Chaque emblème est fait de quatre tracés dorés dans un repère 100 × 150 :
// hachures fines (h), trait fin, trait appuyé, aplats.

export type GoldArt = { h: string; fine: string; bold: string; fill: string };

export type HydreCard = {
    /** Numéro à l'ancienne du Marseille (IIII, VIIII…), vide pour Le Mat. */
    num: string;
    /** L'arcane XIII : cartouche du nom laissé vide, comme au Marseille. */
    nameless?: boolean;
    art: GoldArt;
};

const f1 = (n: number) => n.toFixed(1);
const pol = (cx: number, cy: number, r: number, a: number) => `${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`;
/** Cercle fermé dont le sommet est en (cx, cy - r). */
const circ = (cx: number, cy: number, r: number) => `M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx + 0.1} ${cy - r} Z `;

function gear(cx: number, cy: number, teeth: number, r1: number, r2: number) {
    const s = (2 * Math.PI) / teeth;
    let d = "";
    for (let i = 0; i < teeth; i++) {
        const a = i * s;
        d += `${i ? "L" : "M"}${pol(cx, cy, r1, a)} L${pol(cx, cy, r2, a + s * 0.15)} L${pol(cx, cy, r2, a + s * 0.45)} L${pol(cx, cy, r1, a + s * 0.6)} `;
    }
    return `${d}Z `;
}

function spokes(cx: number, cy: number, r: number, n: number) {
    let d = "";
    for (let i = 0; i < n; i++) d += `M${cx} ${cy} L${pol(cx, cy, r, (i * 2 * Math.PI) / n)} `;
    return d;
}

function rays(cx: number, cy: number, r1: number, r2: number, n: number) {
    let d = "";
    for (let i = 0; i < n; i++) {
        const a = (i * 2 * Math.PI) / n;
        d += `M${pol(cx, cy, r1, a)} L${pol(cx, cy, r2, a)} `;
    }
    return d;
}

/** Rayons alternés droits / ondulés (soleil du Marseille). */
function sunRays(cx: number, cy: number, r1: number, r2: number, n: number) {
    let d = "";
    for (let i = 0; i < n; i++) {
        const a = (i * 2 * Math.PI) / n;
        if (i % 2) {
            const m = (r1 + r2) / 2, w = 0.08;
            d += `M${pol(cx, cy, r1, a)} Q${pol(cx, cy, (r1 + m) / 2, a + w)} ${pol(cx, cy, m, a)} Q${pol(cx, cy, (m + r2) / 2, a - w)} ${pol(cx, cy, r2, a)} `;
        } else {
            d += `M${pol(cx, cy, r1, a)} L${pol(cx, cy, r2 + 4, a)} `;
        }
    }
    return d;
}

function star(cx: number, cy: number, r1: number, r2: number, points = 5) {
    let d = "";
    for (let i = 0; i < points * 2; i++) d += `${i ? "L" : "M"}${pol(cx, cy, i % 2 ? r2 : r1, -Math.PI / 2 + (i * Math.PI) / points)} `;
    return `${d}Z `;
}

/** Hydre à neuf têtes : cous partant de (cx, baseY), têtes sur un arc. */
export function hydra(cx: number, baseY: number, rx: number, ry: number, cy: number, hr: number) {
    let necks = "", heads = "";
    for (let i = 0; i < 9; i++) {
        const a = ((200 + i * 17.5) * Math.PI) / 180, hx = cx + rx * Math.cos(a), hy = cy + ry * Math.sin(a);
        necks += `M${cx} ${baseY} Q${f1(cx + (hx - cx) * 0.2)} ${f1(hy + ry * 0.95)} ${f1(hx)} ${f1(hy)} `;
        heads += circ(Number(f1(hx)), Number(f1(hy)), hr);
    }
    return { necks, heads };
}

/** Écailles de l'Ouroboros entre ses deux ovales. */
function scales() {
    let d = "";
    for (let i = 0; i < 44; i++) {
        const t = (i * 2 * Math.PI) / 44;
        d += `M${f1(50 + 23 * Math.sin(t))} ${f1(72 - 41 * Math.cos(t))} L${f1(50 + 30 * Math.sin(t))} ${f1(72 - 48 * Math.cos(t))} `;
    }
    return d;
}

/** Filigrane commun aux quatre coins de la vignette. */
export const CORNERS =
    "M3 16 A13 13 0 0 1 16 3 M3 11 A8 8 0 0 1 11 3 M97 16 A13 13 0 0 0 84 3 M97 11 A8 8 0 0 0 89 3 M3 134 A13 13 0 0 0 16 147 M3 139 A8 8 0 0 0 11 147 M97 134 A13 13 0 0 1 84 147 M97 139 A8 8 0 0 1 89 147";

const HY = hydra(50, 104, 15, 20, 72, 2.4);
const OUROBOROS = "M50 24 A30 48 0 1 0 50.1 24 Z M50 24 L44 19 L50 14 L56 19 Z";
const HY_BODY = "M40 106 Q50 98 60 106 Q56 112 50 112 Q44 112 40 106 Z";

/** Médaillon du dos des lames : l'Hydre dans l'Ouroboros. */
export const BACK_ART: GoldArt = {
    h: scales(),
    fine: `M50 31 A23 41 0 1 0 50.1 31 Z ${HY.necks}`,
    bold: OUROBOROS,
    fill: HY.heads + HY_BODY,
};

export const HYDRE_DECK: Record<string, HydreCard> = {
    mat: { num: "", art: {
        h: rays(66, 30, 11, 16, 12),
        fine: "M14 134 Q50 120 86 134 M22 140 Q50 128 78 140",
        bold: `M30 134 L62 34 ${circ(66, 30, 8)}`,
        fill: "M24 62 Q28 54 24 48 Q20 54 24 62 Z M78 74 Q82 66 78 60 Q74 66 78 74 Z M42 92 Q45 86 42 82 Q39 86 42 92 Z",
    } },
    bateleur: { num: "I", art: {
        h: rays(66, 28, 6, 12, 12),
        fine: `M30 96 L32 86 L40 86 L42 96 ${gear(58, 89, 10, 5, 7)} M50 70 L66 32 M70 92 L74 86 L78 92`,
        bold: "M38 22 Q44 14 50 22 Q56 30 62 22 Q56 14 50 22 Q44 30 38 22 Z M18 96 L82 96 M24 96 L24 132 M76 96 L76 132",
        fill: star(66, 28, 4, 1.6),
    } },
    papesse: { num: "II", art: {
        h: "M30 42 L30 88 M36 37 L36 88 M64 37 L64 88 M70 42 L70 88",
        fine: "M24 92 Q24 40 50 30 Q76 40 76 92 M26 102 L46 106 M26 108 L46 112 M54 106 L74 102 M54 112 L74 108",
        bold: "M20 96 Q35 88 50 96 Q65 88 80 96 L80 120 Q65 112 50 120 Q35 112 20 120 Z M50 96 L50 120 M40 30 L42 18 L50 12 L58 18 L60 30",
        fill: "M44 16 L56 16 L56 19 L44 19 Z M42 23 L58 23 L58 26 L42 26 Z",
    } },
    imperatrice: { num: "III", art: {
        h: rays(76, 44, 9, 15, 12),
        fine: "M50 112 L50 82 M50 92 L42 84 M50 88 L58 80 M50 100 L56 94 M76 132 L76 50",
        bold: "M34 70 L66 70 L66 100 Q50 118 34 100 Z",
        fill: `M36 54 L38 42 L44 50 L50 38 L56 50 L62 42 L64 54 Z ${circ(76, 44, 6)}`,
    } },
    empereur: { num: "IIII", art: {
        h: rays(54, 88, 6, 14, 10),
        fine: "M28 58 Q14 40 26 22 Q26 40 40 52 M72 58 Q86 40 74 22 Q74 40 60 52 M60 30 L42 80",
        bold: "M20 92 L74 92 Q86 92 88 84 L88 92 Q86 102 74 102 L66 102 L62 112 L64 124 L36 124 L38 112 L34 102 L20 102 Z",
        fill: "M52 22 L72 34 L66 42 L46 30 Z",
    } },
    pape: { num: "V", art: {
        h: rays(50, 40, 16, 26, 16),
        fine: `M26 122 L44 94 M74 122 L56 94 M42 97 L46 100 M58 97 L54 100 ${circ(23, 126, 4)}${circ(77, 126, 4)}`,
        bold: "M50 30 L50 134 M40 40 L60 40 M36 50 L64 50 M32 60 L68 60",
        fill: circ(50, 30, 3),
    } },
    amoureux: { num: "VI", art: {
        h: rays(50, 64, 32, 42, 24),
        fine: "M18 96 L82 34 M76 34 L82 34 L82 40 M18 96 L22 88 M18 96 L26 92 M10 120 Q20 114 30 120 T50 120 T70 120 T90 120 M10 128 Q20 122 30 128 T50 128 T70 128 T90 128",
        bold: "M50 60 Q50 46 38 46 Q26 46 28 60 Q30 72 50 86 Q70 72 72 60 Q74 46 62 46 Q50 46 50 60 Z",
        fill: star(50, 18, 4, 1.6),
    } },
    chariot: { num: "VII", art: {
        h: rays(50, 84, 20, 24, 32),
        fine: `${spokes(50, 84, 16, 8)}M66 80 Q80 68 94 66 Q96 74 88 86 Q78 86 66 88 M66 82 Q80 72 92 72 M66 85 Q78 80 90 80 M34 80 Q20 68 6 66 Q4 74 12 86 Q22 86 34 88 M34 82 Q20 72 8 72 M34 85 Q22 80 10 80 M50 62 Q44 54 50 48 Q56 42 50 36 Q46 30 52 26 M18 132 L18 137 M34 132 L34 137 M50 132 L50 137 M66 132 L66 137 M82 132 L82 137`,
        bold: `${circ(50, 84, 16)}${circ(50, 84, 4)}M10 128 L90 128 M10 132 L90 132`,
        fill: `${star(50, 16, 6, 2.4)}${circ(50, 84, 2)}`,
    } },
    justice: { num: "VIII", art: {
        h: rays(50, 48, 8, 16, 12),
        fine: "M22 48 L78 48 M22 48 L14 78 M22 48 L30 78 M78 48 L70 78 M78 48 L86 78 M12 78 Q22 88 32 78 Z M68 78 Q78 88 88 78 Z",
        bold: "M50 20 L50 128 M40 112 L60 112",
        fill: `${circ(50, 48, 3)}${circ(50, 132, 3)}`,
    } },
    hermite: { num: "VIIII", art: {
        h: "M16 134 L84 134 M22 138 L78 138 M30 142 L70 142",
        fine: `M45 62 L43 96 M55 62 L57 96 M50 70 Q56 80 50 90 Q44 80 50 70 Z ${circ(50, 80, 28)}${rays(50, 80, 31, 42, 36)}`,
        bold: `M40 62 L60 62 L64 96 L36 96 Z M38 62 L50 50 L62 62 M34 96 L66 96 L62 102 L38 102 Z ${circ(50, 46, 4)}M24 28 L32 134`,
        fill: "M50 76 Q53 82 50 87 Q47 82 50 76 Z",
    } },
    roue: { num: "X", art: {
        h: rays(50, 72, 36, 46, 24),
        fine: `${circ(50, 72, 27)}${spokes(50, 72, 22, 8)}${rays(50, 72, 23, 26, 48)}${circ(50, 72, 12)}M24 134 L76 134`,
        bold: `${gear(50, 72, 32, 30, 33)}${circ(50, 72, 22)}${circ(50, 72, 6)}M30 134 L50 104 L70 134`,
        fill: circ(50, 72, 3),
    } },
    force: { num: "XI", art: {
        h: rays(50, 80, 24, 38, 28),
        fine: `${circ(50, 80, 36)}M42 74 L47 76 M58 74 L53 76 M46 86 L50 92 L54 86 M44 96 Q50 100 56 96`,
        bold: "M34 34 Q42 24 50 34 Q58 44 66 34 Q58 24 50 34 Q42 44 34 34 Z M36 64 Q50 54 64 64 L66 86 Q58 102 50 104 Q42 102 34 86 Z",
        fill: "M42 73 L47 75.5 L42 77 Z M58 73 L53 75.5 L58 77 Z",
    } },
    pendu: { num: "XII", art: {
        h: "M20 40 L36 24 M20 56 L52 24 M14 134 L86 134",
        fine: "M64 50 L64 78 M64 56 L56 68 L64 72 M64 78 L64 100 M64 84 L58 96 M64 84 L70 96",
        bold: `M20 134 L20 24 L80 24 M64 24 L64 50 ${circ(64, 106, 6)}`,
        fill: gear(20, 24, 10, 5, 7),
    } },
    sansnom: { num: "XIII", nameless: true, art: {
        h: "M16 134 L84 134 M24 138 L76 138",
        fine: "M41 70 Q26 58 12 60 Q8 70 20 84 Q30 80 41 78 M41 72 Q28 64 16 66 M41 75 Q30 72 18 76 M59 70 Q74 58 88 60 Q92 70 80 84 Q70 80 59 78 M59 72 Q72 64 84 66 M59 75 Q70 72 82 76",
        bold: "M40 52 L60 52 M40 100 L60 100 M42 52 Q42 70 50 76 Q58 82 58 100 M58 52 Q58 70 50 76 Q42 82 42 100 M20 132 L80 26",
        fill: "M44 58 L56 58 Q54 68 50 72 Q46 68 44 58 Z M43 98 Q50 86 57 98 Z M80 26 Q54 12 30 26 Q54 20 76 32 Z",
    } },
    temperance: { num: "XIIII", art: {
        h: "M10 140 Q30 134 50 140 T90 140",
        fine: `M32 104 L60 104 ${circ(40, 112, 1.5)}${circ(50, 108, 1.2)}${circ(46, 116, 1)}M42 136 Q46 130 46 140 M50 134 Q54 128 54 140`,
        bold: "M30 100 Q30 120 46 122 Q62 120 62 100 Q62 84 50 80 L50 60 L42 60 L42 80 Q30 84 30 100 Z M46 60 Q46 40 70 40 L84 56 M78 56 L90 56 L88 86 Q84 92 80 86 Z",
        fill: "M84 62 Q86 66 84 68 Q82 66 84 62 Z M84 72 Q86 76 84 78 Q82 76 84 72 Z",
    } },
    diable: { num: "XV", art: {
        h: rays(50, 74, 34, 44, 28),
        fine: "M44 70 L48 72 M56 70 L52 72 M48 84 L50 88 L52 84 M46 92 Q50 106 54 92 M34 114 L66 114 M36 114 L36 124 M42 114 L42 128 M48 114 L48 132 M54 114 L54 128 M60 114 L60 124 M64 114 L64 120 M18 136 Q28 124 38 130 M82 136 Q72 124 62 130 M14 136 L86 136",
        bold: "M40 60 Q50 54 60 60 L58 84 Q50 96 42 84 Z M42 60 Q30 50 26 38 Q24 28 32 26 Q38 26 36 34 M58 60 Q70 50 74 38 Q76 28 68 26 Q62 26 64 34",
        fill: `M44 69 L48 71.5 L44 73 Z M56 69 L52 71.5 L56 73 Z ${star(50, 16, 5, 2)}`,
    } },
    maisondieu: { num: "XVI", art: {
        h: `${rays(54, 54, 6, 16, 16)}M14 138 L86 138 M22 142 L78 142`,
        fine: "M42 92 L56 64 M58 92 L44 64 M34 122 L58 98 M66 122 L42 98 M46 62 L51 46 M54 62 L49 46 M10 134 L90 134",
        bold: "M30 134 L44 88 L47 58 L50 38 L53 58 L56 88 L70 134 M38 134 Q50 110 62 134 M41 94 L59 94 M45 62 L55 62 M92 6 L74 26 L80 28 L62 42 L68 44 L54 54",
        fill: `M20 44 L22 36 L25 41 L28 34 L31 40 L34 35 L34 46 Z ${circ(16, 64, 1.6)}${circ(84, 70, 1.6)}${circ(24, 90, 1.6)}${circ(80, 100, 1.6)}${circ(14, 110, 1.6)}${circ(72, 50, 1.4)}`,
    } },
    etoile: { num: "XVII", art: {
        h: rays(50, 46, 26, 34, 16),
        fine: `${star(16, 20, 4, 1.6)}${star(84, 20, 4, 1.6)}${star(20, 70, 4, 1.6)}${star(80, 70, 4, 1.6)}${star(30, 44, 3, 1.2)}${star(70, 44, 3, 1.2)}${star(50, 88, 3, 1.2)}M10 132 Q24 122 38 132 T66 132 T94 128 M10 120 Q30 112 50 120 T90 120`,
        bold: `${star(50, 46, 22, 9, 8)}M62 108 L70 100 L78 104 L74 112 Z M70 100 Q66 88 56 82`,
        fill: star(50, 46, 7, 3, 8),
    } },
    lune: { num: "XVIII", art: {
        h: "M10 138 L90 138 M16 142 L84 142 M24 146 L76 146",
        fine: `${rays(50, 46, 24, 34, 32)}M34 74 Q36 79 34 81 Q32 79 34 74 Z M50 78 Q52 83 50 85 Q48 83 50 78 Z M66 74 Q68 79 66 81 Q64 79 66 74 Z M12 132 L12 92 L10 88 L22 88 L20 92 L20 132 M80 132 L80 92 L78 88 L90 88 L88 92 L88 132 M28 132 L36 104 L44 132 M54 132 L62 100 L70 132 M6 132 L94 132`,
        bold: circ(50, 46, 20),
        fill: "M50 26 A20 20 0 0 0 50 66 A13 20 0 0 1 50 26 Z M35 121 L40 119 L41 121 L36 122 Z M44 121 L49 119 L50 121 L45 122 Z M61 115 L64 114 L64.6 115.4 L61.6 116 Z M67 115 L70 114 L70.6 115.4 L67.6 116 Z",
    } },
    soleil: { num: "XVIIII", art: {
        h: "M10 120 L90 120 M10 130 L90 130 M30 110 L30 120 M50 110 L50 120 M70 110 L70 120 M20 120 L20 130 M40 120 L40 130 M60 120 L60 130 M80 120 L80 130",
        fine: `${sunRays(50, 50, 22, 38, 16)}M44 46 Q46 44 48 46 M52 46 Q54 44 56 46 M50 49 L49 55 L51 55 M46 59 Q50 61 54 59 M50 86 Q30 80 14 92 Q30 92 40 100 M50 86 Q70 80 86 92 Q70 92 60 100 M50 86 L50 104`,
        bold: `${circ(50, 50, 18)}M10 110 L90 110`,
        fill: `M30 72 Q32 77 30 79 Q28 77 30 72 Z M70 72 Q72 77 70 79 Q68 77 70 72 Z ${circ(50, 104, 2)}`,
    } },
    jugement: { num: "XX", art: {
        h: "M10 134 L90 134 M16 138 L84 138",
        fine: "M10 30 Q14 18 26 20 Q32 10 44 16 Q54 12 56 24 Q64 28 56 34 Q40 38 26 36 Q12 38 10 30 Z M80 66 L86 72 M84 60 L92 62 M76 70 L78 78 M44 116 L50 110 L56 116",
        bold: `M48 30 L78 58 M74 52 L86 64 L70 62 Z M20 134 L20 112 Q28 104 36 112 L36 134 M64 134 L64 112 Q72 104 80 112 L80 134 M50 134 L50 110 ${circ(50, 104, 4)}`,
        fill: "M58 40 L66 38 L64 46 Z",
    } },
    monde: { num: "XXI", art: {
        h: scales(),
        fine: `M50 31 A23 41 0 1 0 50.1 31 Z ${HY.necks}`,
        bold: OUROBOROS,
        fill: `${HY.heads}${HY_BODY}${star(13, 16, 4, 1.6)}${star(87, 16, 4, 1.6)}${star(13, 136, 4, 1.6)}${star(87, 136, 4, 1.6)}`,
    } },
};
