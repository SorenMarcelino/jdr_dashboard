"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket, type DiceRollStartData } from "@/contexts/SocketContext";
import type { DiceType } from "@/config/diceConfig";

type Props = {
    gameId: string;
    currentUserId: string;
};

/**
 * Convert a server-generated d100 total (1-100) into the two face values
 * expected by the 3D dice library: [d100_tens, d10_units].
 * d100 die faces: 10,20,...,90,100(="00")
 * d10  die faces: 1,2,...,9,10(="0")
 */
function d100ToFaces(total: number): [number, number] {
    if (total === 100) return [100, 10];
    const units = total % 10;
    const tens = total - units;
    return [
        tens === 0 ? 100 : tens,
        units === 0 ? 10 : units,
    ];
}

export function DiceScene({ gameId, currentUserId }: Props) {
    const { onDiceRollStart, completeDiceRoll } = useSocket();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boxRef = useRef<any>(null);
    const [visible, setVisible] = useState(false);
    const rollMetaRef = useRef<{
        diceType: DiceType;
        gameId: string;
        isRoller: boolean;
        results: number[];
        total: number;
    } | null>(null);
    const completeDiceRollRef = useRef(completeDiceRoll);
    completeDiceRollRef.current = completeDiceRoll;

    // Initialize DiceBox once on mount
    useEffect(() => {
        let mounted = true;

        async function init() {
            const DiceBox = (await import("@3d-dice/dice-box-threejs")).default;
            if (!mounted) return;

            const box = new DiceBox("#dice-overlay-container", {
                assetPath: "/dice-assets/",
                theme_customColorset: {
                    background: "#00ffcb",
                    foreground: "#ffffff",
                    texture: "marble",
                    material: "metal",
                },
                light_intensity: 2,
                gravity_multiplier: 600,
                baseScale: 100,
                strength: 2,
                sounds: false,
                onRollComplete: () => {
                    const meta = rollMetaRef.current;
                    if (!meta) return;

                    // Only the roller sends the server-generated results to finalize the roll
                    if (meta.isRoller) {
                        completeDiceRollRef.current(
                            meta.gameId,
                            meta.diceType,
                            meta.results.length,
                            meta.results,
                            meta.total,
                        );
                    }

                    setTimeout(() => {
                        setVisible(false);
                        box.clearDice();
                    }, 2000);
                },
            });

            await box.initialize();
            boxRef.current = box;
        }

        init();

        return () => {
            mounted = false;
        };
    }, []);

    // Handle incoming dice roll events — ALL players see the animation
    const handleRollStart = useCallback(
        (data: DiceRollStartData) => {
            if (data.gameId !== gameId) return;

            const box = boxRef.current;
            if (!box) return;

            const dType = data.diceType as DiceType;

            // Store server results + whether this user is the roller
            rollMetaRef.current = {
                diceType: dType,
                gameId: data.gameId,
                isRoller: data.userId === currentUserId,
                results: data.results,
                total: data.total,
            };

            // Build dice notation
            let notation: string;
            if (dType === "d100") {
                notation = "1d100+1d10";
            } else {
                notation = `${data.quantity}${dType}`;
            }

            // Build the face values the 3D dice must land on
            let faceValues: number[];
            if (dType === "d100") {
                faceValues = d100ToFaces(data.total);
            } else {
                faceValues = data.results;
            }

            // Roll with forced values:
            // 1. startClickThrow generates random physics vectors
            // 2. We inject .result so the lib swaps dice faces after physics
            // 3. rollDice runs simulation + animation with correct faces
            setVisible(true);
            box.notationVectors = box.startClickThrow(notation);
            if (box.notationVectors) {
                box.notationVectors.result = faceValues;
                box.rollDice(() => {
                    const results = box.getDiceResults();
                    box.onRollComplete(results);
                    document.dispatchEvent(new CustomEvent("rollComplete", { detail: results }));
                });
            }
        },
        [gameId, currentUserId],
    );

    useEffect(() => {
        return onDiceRollStart(handleRollStart);
    }, [onDiceRollStart, handleRollStart]);

    return (
        <div
            id="dice-overlay-container"
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        />
    );
}
