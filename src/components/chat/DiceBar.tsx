"use client";

import { useState } from "react";
import { DICE_LIST, type DiceType } from "@/config/diceConfig";
import { Minus, Plus } from "lucide-react";

type Props = {
    onRoll: (diceType: DiceType, quantity: number) => void;
    disabled?: boolean;
};

export function DiceBar({ onRoll, disabled }: Props) {
    const [selected, setSelected] = useState<DiceType | null>(null);
    const [quantity, setQuantity] = useState(1);

    const handleSelect = (type: DiceType) => {
        if (selected === type) {
            // Already selected, roll it
            onRoll(type, quantity);
            setSelected(null);
            setQuantity(1);
        } else {
            setSelected(type);
            const config = DICE_LIST.find((d) => d.type === type);
            if (config && config.maxQuantity === 1) {
                setQuantity(1);
            }
        }
    };

    const handleRoll = () => {
        if (!selected) return;
        onRoll(selected, quantity);
        setSelected(null);
        setQuantity(1);
    };

    const selectedConfig = DICE_LIST.find((d) => d.type === selected);
    const maxQty = selectedConfig?.maxQuantity ?? 10;

    return (
        <div className="border-t px-2 py-1.5 space-y-1">
            {/* Dice type buttons */}
            <div className="flex items-center gap-1 overflow-x-auto">
                {DICE_LIST.map((dice) => {
                    const Icon = dice.icon;
                    const isActive = selected === dice.type;
                    return (
                        <button
                            key={dice.type}
                            onClick={() => handleSelect(dice.type)}
                            disabled={disabled}
                            title={dice.label}
                            className={`shrink-0 flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-colors text-xs
                                ${isActive
                                    ? `bg-muted ring-1 ring-primary ${dice.color}`
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                }
                                disabled:opacity-30`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium leading-none">{dice.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Quantity selector + roll button */}
            {selected && (
                <div className="flex items-center gap-2">
                    {maxQty > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="p-0.5 rounded hover:bg-muted"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                                className="p-0.5 rounded hover:bg-muted"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleRoll}
                        disabled={disabled}
                        className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors
                            bg-primary text-primary-foreground hover:bg-primary/90
                            disabled:opacity-30`}
                    >
                        Lancer {quantity > 1 ? `${quantity}${selected}` : selected}
                    </button>
                </div>
            )}
        </div>
    );
}
