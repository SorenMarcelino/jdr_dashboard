import { Node, mergeAttributes } from "@tiptap/core";

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
