import { Mark, mergeAttributes } from "@tiptap/core";

export const ScenarioPageLinkMark = Mark.create({
    name: "scenarioPageLink",

    addAttributes() {
        return {
            pageId: { default: null },
            label: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-page-link]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(HTMLAttributes, {
                "data-page-link": HTMLAttributes.pageId,
                class: "scenario-page-link",
            }),
            0,
        ];
    },
});
