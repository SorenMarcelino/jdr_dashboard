import Highlight from "@tiptap/extension-highlight";
import { highlightBackground, normalizeHex } from "@/lib/colors";

// Surlignage multicolore. La couleur est stockée en hex pur (data-color) mais
// affichée en semi-transparence, pour rester lisible en thème clair et sombre.
export const ScenarioHighlight = Highlight.extend({
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: (element) => normalizeHex(element.getAttribute("data-color")),
                renderHTML: (attributes) => {
                    const color = normalizeHex(attributes.color);
                    if (!color) return {};
                    return {
                        "data-color": color,
                        style: `background-color: ${highlightBackground(color)}; color: inherit`,
                    };
                },
            },
        };
    },
}).configure({ multicolor: true });
