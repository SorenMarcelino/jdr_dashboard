import type { JSONContent } from "@tiptap/core";

export type ExtractedLink = {
    targetPageId: string;
    label: string;
};

/**
 * Parcourt le JSON TipTap et extrait tous les marks "scenarioPageLink".
 */
export function extractLinks(doc: JSONContent): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    if (!doc?.content) return links;

    function walk(nodes: JSONContent[]) {
        for (const node of nodes) {
            if (node.marks) {
                for (const mark of node.marks) {
                    if (mark.type === "scenarioPageLink" && mark.attrs?.pageId) {
                        links.push({
                            targetPageId: mark.attrs.pageId,
                            label: (node.text as string) || mark.attrs.label || "",
                        });
                    }
                }
            }
            if (node.content) {
                walk(node.content);
            }
        }
    }

    walk(doc.content);
    return links;
}
