import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

function slugify(text: string, usedSlugs: Set<string>): string {
    const base =
        text
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60) || "section";
    let slug = base;
    let i = 2;
    while (usedSlugs.has(slug)) {
        slug = `${base}-${i}`;
        i += 1;
    }
    usedSlugs.add(slug);
    return slug;
}

export const HeadingId = Extension.create({
    name: "headingId",

    addGlobalAttributes() {
        return [
            {
                types: ["heading"],
                attributes: {
                    id: {
                        default: null,
                        parseHTML: (element: HTMLElement) => element.getAttribute("id"),
                        renderHTML: (attributes: { id?: string | null }) =>
                            attributes.id ? { id: attributes.id } : {},
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey("headingId"),
                appendTransaction: (transactions, _oldState, newState) => {
                    const docChanged = transactions.some((tr) => tr.docChanged);
                    if (!docChanged) return null;

                    const usedSlugs = new Set<string>();
                    let tr = newState.tr;
                    let modified = false;

                    newState.doc.descendants((node, pos) => {
                        if (node.type.name !== "heading") return;
                        const text = node.textContent;
                        if (!text) return;
                        const slug = slugify(text, usedSlugs);
                        if (node.attrs.id !== slug) {
                            tr = tr.setNodeAttribute(pos, "id", slug);
                            modified = true;
                        }
                    });

                    return modified ? tr : null;
                },
            }),
        ];
    },
});
