"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

const CHARACTER_SHEETS = [
    { value: "dnd5e", label: "Donjons & Dragons 5e" },
    { value: "pathfinder2e", label: "Pathfinder 2e" },
    { value: "callofcthulhu", label: "L'Appel de Cthulhu" },
    { value: "magnus_archives", label: "The Magnus Archives" },
    { value: "custom", label: "Personnalisée" },
];

const formSchema = z.object({
    name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
    description: z.string().optional(),
    characterSheet: z.string().min(1, { message: "Veuillez choisir une feuille de personnage." }),
    thumbnail: z.string().optional(),
});

export function ProfileForm({ onCreated }: { onCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            characterSheet: "",
            thumbnail: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const { data } = await axios.post(
                "http://localhost:5050/games/create",
                values,
                { withCredentials: true }
            );
            if (data.success) {
                form.reset();
                setOpen(false);
                onCreated?.();
            }
        } catch (error) {
            console.error("Erreur lors de la création de la partie:", error);
            alert("Erreur lors de la création de la partie. Êtes-vous connecté ?");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Créer une nouvelle partie</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Créer une nouvelle partie</DialogTitle>
                </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom de la partie</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: La Malédiction de Strahd" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Décrivez votre campagne..."
                                    className="resize-none"
                                    rows={4}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="characterSheet"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Feuille de personnage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un système de jeu" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {CHARACTER_SHEETS.map((sheet) => (
                                        <SelectItem key={sheet.value} value={sheet.value}>
                                            {sheet.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                            <FormLabel>Miniature</FormLabel>
                            <FormControl>
                                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="thumbnail-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => onChange(reader.result as string);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        {...fieldProps}
                                    />
                                    <label htmlFor="thumbnail-upload" className="cursor-pointer text-center p-4">
                                        {value ? (
                                            <span className="text-sm text-green-600">Image sélectionnée ✓</span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                Glissez une image ou <span className="underline">cliquez pour choisir</span>
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </FormControl>
                            <FormDescription>Format JPG, PNG, WEBP recommandé.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full">Créer la partie</Button>
            </form>
        </Form>
            </DialogContent>
        </Dialog>
    );
}
