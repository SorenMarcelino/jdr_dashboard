import { Mark, mergeAttributes } from "@tiptap/core";

export const NpcReferenceMark = Mark.create({
    name: "npcReference",

    addAttributes() {
        return {
            sheetInstanceId: { default: null },
            npcName: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-npc-ref]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-npc-ref": HTMLAttributes.sheetInstanceId,
                class: "scenario-npc-ref",
            }),
            0,
        ];
    },
});
