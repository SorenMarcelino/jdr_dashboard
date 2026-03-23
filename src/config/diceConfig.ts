import { D4Icon, D6Icon, D8Icon, D10Icon, D12Icon, D20Icon, D100Icon } from "@/components/dice/icons";

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceConfig {
    type: DiceType;
    label: string;
    faces: number;
    maxQuantity: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    display?: "percentile";
}

export const DICE_CONFIGS: Record<DiceType, DiceConfig> = {
    d4:   { type: "d4",   label: "D4",   faces: 4,   maxQuantity: 10, icon: D4Icon,   color: "text-emerald-500" },
    d6:   { type: "d6",   label: "D6",   faces: 6,   maxQuantity: 10, icon: D6Icon,   color: "text-blue-500" },
    d8:   { type: "d8",   label: "D8",   faces: 8,   maxQuantity: 10, icon: D8Icon,   color: "text-amber-500" },
    d10:  { type: "d10",  label: "D10",  faces: 10,  maxQuantity: 10, icon: D10Icon,  color: "text-red-500" },
    d12:  { type: "d12",  label: "D12",  faces: 12,  maxQuantity: 10, icon: D12Icon,  color: "text-pink-500" },
    d20:  { type: "d20",  label: "D20",  faces: 20,  maxQuantity: 10, icon: D20Icon,  color: "text-violet-500" },
    d100: { type: "d100", label: "D100", faces: 100, maxQuantity: 1,  icon: D100Icon, color: "text-orange-500", display: "percentile" },
};

export const DICE_LIST = Object.values(DICE_CONFIGS);
