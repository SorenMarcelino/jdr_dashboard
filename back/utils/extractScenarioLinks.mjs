/**
 * Parcourt récursivement le JSON TipTap et extrait tous les marks "scenarioPageLink".
 * Retourne un tableau de { targetPageId, label }.
 */
export function extractScenarioLinks(doc) {
    const links = [];
    if (!doc || !doc.content) return links;

    function walk(nodes) {
        for (const node of nodes) {
            if (node.marks) {
                for (const mark of node.marks) {
                    if (mark.type === "scenarioPageLink" && mark.attrs?.pageId) {
                        links.push({
                            targetPageId: mark.attrs.pageId,
                            label: node.text || mark.attrs.label || "",
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
