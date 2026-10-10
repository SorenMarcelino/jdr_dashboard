import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { normalizeHex } from "@/lib/colors";
import { normalizeGmEmoji, normalizeGmLabel } from "./gmOnlyAttrs";
import { GmOnlyBlockView } from "./GmOnlyBlockView";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        gmOnlyBlock: {
            toggleGmOnlyBlock: () => ReturnType;
        };
    }
}

export const GmOnlyBlock = Node.create({
    name: "gmOnlyBlock",
    group: "block",
    content: "block+",
    defining: true,

    // null = valeur par défaut (couleur destructive, 🙈, libellé traduit) :
    // le contenu existant, sans ces attributs, s'affiche comme avant.
    addAttributes() {
        return {
            color: {
                default: null,
                parseHTML: (element) => normalizeHex(element.getAttribute("data-gm-color")),
                renderHTML: (attributes) => {
                    const color = normalizeHex(attributes.color);
                    return color ? { "data-gm-color": color } : {};
                },
            },
            emoji: {
                default: null,
                parseHTML: (element) => normalizeGmEmoji(element.getAttribute("data-gm-emoji")),
                renderHTML: (attributes) => (attributes.emoji ? { "data-gm-emoji": attributes.emoji } : {}),
            },
            label: {
                default: null,
                parseHTML: (element) => normalizeGmLabel(element.getAttribute("data-gm-label")),
                renderHTML: (attributes) => (attributes.label ? { "data-gm-label": attributes.label } : {}),
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(GmOnlyBlockView);
    },

    parseHTML() {
        return [{ tag: "div[data-gm-only]" }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "div",
            mergeAttributes(HTMLAttributes, {
                "data-gm-only": "true",
                class: "scenario-gm-only-block",
            }),
            0,
        ];
    },

    addCommands() {
        return {
            toggleGmOnlyBlock:
                () =>
                ({ commands }) => {
                    return commands.toggleWrap(this.name);
                },
        };
    },
});
