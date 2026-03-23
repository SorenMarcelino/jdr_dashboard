"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSocket, type DiceRollStartData } from "@/contexts/SocketContext";
import type { DiceType } from "@/config/diceConfig";

type Props = {
    gameId: string;
    currentUserId: string;
};

type DiceRollResult = {
    notation: string;
    sets: Array<{
        num: number;
        type: string;
        sides: number;
        rolls: Array<{ type: string; sides: number; id: number; value: number }>;
        total: number;
    }>;
    modifier: number;
    total: number;
};

export function DiceScene({ gameId, currentUserId }: Props) {
    const { onDiceRollStart, completeDiceRoll } = useSocket();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const boxRef = useRef<any>(null);
    const [visible, setVisible] = useState(false);
    const rollMetaRef = useRef<{ diceType: DiceType; gameId: string } | null>(null);
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
                light_intensity: 1,
                gravity_multiplier: 600,
                baseScale: 100,
                strength: 2,
                sounds: false,
                onRollComplete: (results: DiceRollResult) => {
                    const meta = rollMetaRef.current;
                    if (!meta) return;

                    const rolls: number[] = [];
                    for (const set of results.sets) {
                        for (const roll of set.rolls) {
                            rolls.push(roll.value);
                        }
                    }

                    let total = results.total;

                    // d100: d100 returns 10-100 (100="00"), d10 returns 1-10 (10="0")
                    if (meta.diceType === "d100" && rolls.length === 2) {
                        const tens = rolls[0] % 100;  // 100 → 0 (face "00"), 10-90 stay
                        const units = rolls[1] % 10;  // 10 → 0 (face "0"), 1-9 stay
                        total = tens + units || 100;   // 0+0 = 100
                    }

                    completeDiceRollRef.current(
                        meta.gameId,
                        meta.diceType,
                        rolls.length,
                        rolls,
                        total,
                    );

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

    // Handle incoming dice roll events
    const handleRollStart = useCallback(
        (data: DiceRollStartData) => {
            if (data.userId !== currentUserId || data.gameId !== gameId) return;

            const box = boxRef.current;
            if (!box) return;

            const dType = data.diceType as DiceType;
            rollMetaRef.current = { diceType: dType, gameId: data.gameId };

            // Build dice notation
            let notation: string;
            if (dType === "d100") {
                // d100 (tens: 00-90) + d10 (units: 0-9)
                notation = "1d100+1d10";
            } else {
                notation = `${data.quantity}${dType}`;
            }

            setVisible(true);
            box.roll(notation);
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
