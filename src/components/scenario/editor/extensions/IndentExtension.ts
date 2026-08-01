import { Extension } from "@tiptap/core";

const INDENT_STEP_PX = 24;
const MAX_INDENT = 4;

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        indent: {
            increaseIndent: () => ReturnType;
            decreaseIndent: () => ReturnType;
        };
    }
}

export const IndentExtension = Extension.create({
    name: "indent",

    addOptions() {
        return {
            types: ["paragraph", "heading"],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    indent: {
                        default: 0,
                        parseHTML: (element: HTMLElement) => {
                            const value = element.style.marginLeft;
                            if (!value) return 0;
                            return Math.round(parseInt(value, 10) / INDENT_STEP_PX) || 0;
                        },
                        renderHTML: (attributes: { indent?: number }) => {
                            if (!attributes.indent) return {};
                            return { style: `margin-left: ${attributes.indent * INDENT_STEP_PX}px` };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            increaseIndent:
                () =>
                ({ tr, state, dispatch }) => {
                    const { $from } = state.selection;
                    const node = $from.parent;
                    if (!this.options.types.includes(node.type.name)) return false;
                    const current = (node.attrs.indent as number) ?? 0;
                    if (current >= MAX_INDENT) return false;
                    if (dispatch) {
                        tr.setNodeAttribute($from.before($from.depth), "indent", current + 1);
                    }
                    return true;
                },
            decreaseIndent:
                () =>
                ({ tr, state, dispatch }) => {
                    const { $from } = state.selection;
                    const node = $from.parent;
                    if (!this.options.types.includes(node.type.name)) return false;
                    const current = (node.attrs.indent as number) ?? 0;
                    if (current <= 0) return false;
                    if (dispatch) {
                        tr.setNodeAttribute($from.before($from.depth), "indent", current - 1);
                    }
                    return true;
                },
        };
    },

    addKeyboardShortcuts() {
        return {
            Tab: () => this.editor.commands.increaseIndent(),
            "Shift-Tab": () => this.editor.commands.decreaseIndent(),
        };
    },
});
