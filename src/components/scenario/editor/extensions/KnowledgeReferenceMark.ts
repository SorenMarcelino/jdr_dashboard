import { Mark, mergeAttributes } from "@tiptap/core";

export const KnowledgeReferenceMark = Mark.create({
    name: "knowledgeReference",

    addAttributes() {
        return {
            entryId: { default: null },
            entryType: { default: "rule" },
            title: { default: null },
            previewText: { default: "" },
        };
    },

    parseHTML() {
        return [{ tag: "span[data-knowledge-ref]" }];
    },

    renderHTML({ HTMLAttributes }) {
        const entryType = HTMLAttributes.entryType === "lore" ? "lore" : "rule";
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-knowledge-ref": HTMLAttributes.entryId,
                "data-entry-type": entryType,
                "data-preview-text": HTMLAttributes.previewText,
                class: `scenario-knowledge-ref scenario-knowledge-ref-${entryType}`,
            }),
            0,
        ];
    },
});
