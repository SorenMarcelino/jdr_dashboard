import { Mark, mergeAttributes } from "@tiptap/core";

export const AnnotationMark = Mark.create({
    name: "annotation",

    addAttributes() {
        return {
            previewText: { default: "" },
            color: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-annotation]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-annotation": "true",
                class: "scenario-annotation",
                style: HTMLAttributes.color ? `border-color: ${HTMLAttributes.color}` : undefined,
            }),
            0,
        ];
    },
});
