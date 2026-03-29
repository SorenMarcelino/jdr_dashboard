"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";
import { useScenario } from "@/contexts/ScenarioContext";
import { ScenarioNode } from "./ScenarioNode";

const API = "http://localhost:5050";

const nodeTypes = { scenarioNode: ScenarioNode };

type Props = {
    gameId: string;
    scenarioId: string;
    compact?: boolean;
};

type GraphPage = {
    _id: string;
    title: string;
    position: { x: number; y: number };
    outgoingLinks: { targetPageId: string; label: string }[];
    tags: string[];
};

export function ScenarioGraph({ gameId, scenarioId, compact = false }: Props) {
    const { currentPageId, navigateToPage } = useScenario();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [entryPageId, setEntryPageId] = useState<string | null>(null);

    const loadGraph = useCallback(async () => {
        try {
            const res = await axios.get(
                `${API}/games/${gameId}/scenarios/${scenarioId}/graph`,
                { withCredentials: true }
            );
            if (!res.data.success) return;

            const pages: GraphPage[] = res.data.pages;
            setEntryPageId(res.data.entryPageId);

            const newNodes: Node[] = pages.map((page, i) => ({
                id: page._id,
                type: "scenarioNode",
                position: page.position?.x !== 0 || page.position?.y !== 0
                    ? page.position
                    : { x: (i % 4) * 250, y: Math.floor(i / 4) * 150 },
                data: {
                    title: page.title,
                    tags: page.tags || [],
                    isCurrent: page._id === currentPageId,
                    isEntry: page._id === res.data.entryPageId,
                },
            }));

            const newEdges: Edge[] = [];
            for (const page of pages) {
                for (const link of page.outgoingLinks || []) {
                    newEdges.push({
                        id: `${page._id}-${link.targetPageId}`,
                        source: page._id,
                        target: link.targetPageId,
                        label: link.label,
                        animated: page._id === currentPageId,
                        style: { stroke: "hsl(var(--primary))" },
                        labelStyle: { fontSize: 10 },
                    });
                }
            }

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (err) {
            console.error("Erreur chargement graph:", err);
        }
    }, [gameId, scenarioId, currentPageId, setNodes, setEdges]);

    useEffect(() => {
        loadGraph();
    }, [loadGraph]);

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            navigateToPage(node.id);
        },
        [navigateToPage]
    );

    const handleNodeDragStop = useCallback(
        async (_: React.MouseEvent, node: Node) => {
            try {
                await axios.put(
                    `${API}/games/${gameId}/scenarios/${scenarioId}/positions`,
                    { positions: [{ pageId: node.id, position: node.position }] },
                    { withCredentials: true }
                );
            } catch (err) {
                console.error("Erreur sauvegarde position:", err);
            }
        },
        [gameId, scenarioId]
    );

    return (
        <div className={compact ? "h-full w-full" : "h-full w-full"}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onNodeDragStop={handleNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
                maxZoom={2}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={20} size={1} />
                {!compact && (
                    <>
                        <Controls />
                        <MiniMap
                            nodeStrokeColor={(n) =>
                                n.id === currentPageId ? "hsl(var(--primary))" : "hsl(var(--border))"
                            }
                            nodeColor={(n) =>
                                n.id === entryPageId ? "hsl(var(--primary) / 0.2)" : "hsl(var(--background))"
                            }
                        />
                    </>
                )}
            </ReactFlow>
        </div>
    );
}
