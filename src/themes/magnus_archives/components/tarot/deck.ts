// Paquet du tarot Magnus : 14 Entités + 3 lames « hors-peur ». Identifiants
// alignés sur back/config/tarotRegistry.mjs ; noms et interprétations dans
// messages/*.json (skins.magnus.tarot.cards.<id>).
//
// Chaque illustration est une « photocopie » : jusqu'à quatre tracés clairs
// sur fond noir, dans un repère 100 × 130.

const LIGHT = "#DCD7C6";
const DARK = "#161716";
const NONE = "none";

export type ArtLayer = { d: string; fill: string; stroke: string; width: number; opacity: number };

export type ArchivesCard = {
    /** Numéro de la lame (00 à 16). */
    num: string;
    /** Numéro de déposition tamponné sur la pièce. */
    code: string;
    art: ArtLayer[];
};

const f1 = (n: number) => n.toFixed(1);
const pol = (cx: number, cy: number, r: number, a: number) => `${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`;
/** Cercle fermé dont le sommet est en (cx, cy - r). */
const circ = (cx: number, cy: number, r: number) => `M${cx} ${cy - r} A${r} ${r} 0 1 0 ${cx + 0.1} ${cy - r} Z `;

function rays(cx: number, cy: number, r1: number, r2: number, n: number) {
    let d = "";
    for (let i = 0; i < n; i++) {
        const a = (i * 2 * Math.PI) / n;
        d += `M${pol(cx, cy, r1, a)} L${pol(cx, cy, r2, a)} `;
    }
    return d;
}

function web() {
    const cx = 50, cy = 46, n = 10;
    let d = "";
    for (let i = 0; i < n; i++) d += `M${cx} ${cy} L${pol(cx, cy, 42, (i * 2 * Math.PI) / n - Math.PI / 2)} `;
    for (const r of [7, 14, 22, 30, 38]) {
        for (let i = 0; i <= n; i++) {
            const a = (i * 2 * Math.PI) / n - Math.PI / 2;
            d += i === 0 ? `M${pol(cx, cy, r, a)} ` : `Q${pol(cx, cy, r * 0.84, a - Math.PI / n)} ${pol(cx, cy, r, a)} `;
        }
    }
    return d;
}

function spiral() {
    let d = "";
    for (let t = 0; t <= 26; t += 0.25) d += `${t === 0 ? "M" : "L"}${pol(50, 62, 2 + t * 1.6, t)} `;
    return d;
}

function lashes(cy: number) {
    let d = "";
    for (let k = 0; k <= 12; k++) {
        const a = Math.PI + (k * Math.PI) / 12, r2 = k % 2 ? 49 : 54;
        d += `M${f1(50 + 40 * Math.cos(a))} ${f1(cy + 40 * 0.62 * Math.sin(a))} L${f1(50 + r2 * Math.cos(a))} ${f1(cy + r2 * 0.78 * Math.sin(a))} `;
    }
    for (let k = 2; k <= 10; k += 2) {
        const a = (k * Math.PI) / 12;
        d += `M${f1(50 + 38 * Math.cos(a))} ${f1(cy + 38 * 0.6 * Math.sin(a))} L${f1(50 + 45 * Math.cos(a))} ${f1(cy + 45 * 0.72 * Math.sin(a))} `;
    }
    return d;
}

function hexagon(cx: number, cy: number, r: number) {
    let d = "";
    for (let i = 0; i < 6; i++) d += `${i ? "L" : "M"}${pol(cx, cy, r, -Math.PI / 2 + (i * Math.PI) / 3)} `;
    return `${d}Z `;
}

const fill = (d: string, color = LIGHT): ArtLayer => ({ d, fill: color, stroke: NONE, width: 0, opacity: 1 });
const line = (d: string, width: number, opacity = 1, color = LIGHT): ArtLayer => ({ d, fill: NONE, stroke: color, width, opacity });

const HIVE = [[50, 40], [39.6, 58], [60.4, 58], [50, 76], [29.2, 76], [70.8, 76]] as const;

export const ARCHIVES_DECK: Record<string, ArchivesCard> = {
    archiviste: { num: "00", code: "0011802", art: [
        fill("M14 52 Q50 22 86 52 Q50 82 14 52 Z"),
        { d: circ(50, 52, 12), fill: DARK, stroke: DARK, width: 1, opacity: 1 },
        fill(circ(54, 48, 3)),
        line("M50 80 L50 104 M42 104 L58 104 L58 114 L50 126 L42 114 Z M50 114 L50 120", 3),
    ] },
    oeil: { num: "01", code: "0160204", art: [
        line(lashes(65), 2.6),
        fill("M10 65 Q50 25 90 65 Q50 105 10 65 Z"),
        { d: circ(50, 65, 16), fill: DARK, stroke: DARK, width: 1, opacity: 1 },
        fill(circ(56, 60.5, 3.5)),
    ] },
    spirale: { num: "02", code: "0122204", art: [
        line(spiral(), 3.6),
        fill("M45 53 L55 53 L55 70 L45 70 Z"),
        fill(circ(53, 63.2, 1.2), DARK),
    ] },
    etranger: { num: "03", code: "0150712", art: [
        fill("M30 22 Q50 10 70 22 Q80 56 70 86 Q50 102 30 86 Q20 56 30 22 Z"),
        fill("M36 48 L46 50 L46 54 L36 52 Z M54 50 L64 48 L64 52 L54 54 Z M38 74 Q50 66 62 74 L62 77 Q50 70 38 77 Z", DARK),
        line("M50 12 L50 32 M46 17 L54 17 M46 23 L54 23 M46 29 L54 29", 1.6, 1, DARK),
        line("M30 22 L22 2 M70 22 L78 2 M50 100 L50 128", 1),
    ] },
    enseveli: { num: "04", code: "0081702", art: [
        line("M4 22 L96 22 M8 34 L92 34 M4 46 L96 46", 3, 0.7),
        line("M40 62 L60 62 L68 78 L60 122 L40 122 L32 78 Z", 3.2),
        line("M50 74 L50 98 M43 82 L57 82", 2.2),
        line("M14 58 L15 59 M86 64 L87 65 M22 110 L23 111 M80 100 L81 101 M18 84 L19 85", 3),
    ] },
    vaste: { num: "05", code: "0131103", art: [
        line("M10 80 Q50 -4 90 80", 3),
        line("M4 100 L96 100", 2),
        line(`M50 100 L50 92 ${circ(50, 86, 2.5)}`, 1.6),
        line("M20 30 L21 31 M78 22 L79 23 M64 40 L65 41 M32 52 L33 53 M86 56 L87 57 M44 18 L45 19", 3),
    ] },
    solitaire: { num: "06", code: "0110211", art: [
        line("M0 80 Q25 72 50 80 T100 80 M0 94 Q25 86 50 94 T100 94 M0 108 Q25 100 50 108 T100 108", 6, 0.45),
        fill(`${circ(50, 51, 5)}M44 86 L46 60 Q50 55 54 60 L56 86 Z`),
        line("M0 68 Q25 62 50 68 T100 68", 9, 0.22),
    ] },
    tenebres: { num: "07", code: "0102503", art: [
        line(rays(50, 62, 32, 46, 28), 2, 0.8),
        { d: circ(50, 62, 28), fill: DARK, stroke: LIGHT, width: 2, opacity: 1 },
        fill("M50 34 A28 28 0 0 1 50 90 A22 28 0 0 0 50 34 Z"),
    ] },
    traque: { num: "08", code: "0140110", art: [
        line("M30 18 Q38 64 24 112 M50 12 Q58 64 46 118 M70 18 Q78 64 66 112", 6),
        line("M16 120 L84 120", 1.4, 0.6),
    ] },
    carnage: { num: "09", code: "0122308", art: [
        line("M20 20 L80 110 M80 20 L20 110", 4.2),
        line("M10 34 L30 16 M70 16 L90 34", 3),
        fill("M50 72 Q55 80 50 85 Q45 80 50 72 Z M36 100 Q39 105 36 108 Q33 105 36 100 Z M66 98 Q69 103 66 106 Q63 103 66 98 Z"),
    ] },
    chair: { num: "10", code: "0161011", art: [
        line("M50 8 L50 24 M43 24 Q50 34 57 24", 3),
        fill("M28 34 Q50 26 72 34 L76 96 Q50 108 24 96 Z"),
        line("M36 54 Q50 60 64 54 M34 72 Q50 78 66 72 M40 88 Q50 92 60 88", 2, 1, DARK),
        line("M40 102 L40 114 M60 102 L60 118", 2),
    ] },
    corruption: { num: "11", code: "0091306", art: [
        { d: HIVE.map(([x, y]) => hexagon(x, y, 11)).join(""), fill: LIGHT, stroke: DARK, width: 2, opacity: 1 },
        fill(HIVE.map(([x, y]) => circ(x, y, 3)).join(""), DARK),
        line("M18 104 L21 101 M82 108 L85 105 M52 110 L55 107 M30 118 L33 115 M70 120 L73 117 M14 30 L17 27 M84 26 L87 23", 2.6),
    ] },
    desolation: { num: "12", code: "0141010", art: [
        fill("M50 14 Q78 46 66 74 Q78 66 78 54 Q92 84 70 104 Q50 114 30 104 Q10 84 24 56 Q24 68 34 76 Q22 46 50 14 Z"),
        fill("M50 50 Q64 70 58 84 Q66 80 66 74 Q72 92 60 100 Q50 104 40 100 Q30 90 38 76 Q40 84 46 86 Q40 70 50 50 Z", DARK),
        line("M20 30 L21 31 M80 24 L81 25 M74 38 L75 39 M28 18 L29 19 M14 48 L15 49", 3.4),
        line("M10 120 L90 120", 2),
    ] },
    toile: { num: "13", code: "0091305", art: [
        line(web(), 1.3),
        line("M30 94 L70 94 M50 86 L50 106", 3.6),
        line("M30 94 L40 117 M70 94 L60 117 M50 106 L50 110", 1),
        fill(`${circ(50, 113.5, 3.5)}M40 118 L60 118 L56 127 L44 127 Z`),
    ] },
    fin: { num: "14", code: "0130306", art: [
        line("M28 14 L72 14 M28 116 L72 116 M32 14 Q32 50 50 65 Q68 80 68 116 M68 14 Q68 50 50 65 Q32 80 32 116", 3.4),
        fill("M38 32 L62 32 Q58 52 50 60 Q42 52 38 32 Z"),
        fill("M35 114 Q50 92 65 114 Z"),
        line("M50 62 L50 100", 1.2),
    ] },
    extinction: { num: "15", code: "0170401", art: [
        fill("M18 122 L18 72 L28 72 L28 122 Z M44 122 L44 56 L54 56 L54 122 Z M70 122 L70 78 L80 78 L80 122 Z"),
        line("M23 66 Q16 50 30 44 Q40 30 58 36 Q74 28 88 42 M49 50 Q44 40 54 32", 5, 0.45),
        line("M0 122 L100 122 M30 122 L36 128 M64 122 L58 129", 2),
    ] },
    deposition: { num: "16", code: "0000001", art: [
        line("M12 40 L88 40 L88 96 L12 96 Z", 3),
        fill(`${circ(34, 63, 9)}${circ(66, 63, 9)}`),
        line("M26 50 L74 50 L74 76 L26 76 Z M22 96 L30 84 L70 84 L78 96", 1.6),
        fill(`${circ(34, 63, 3)}${circ(66, 63, 3)}`, DARK),
    ] },
};
