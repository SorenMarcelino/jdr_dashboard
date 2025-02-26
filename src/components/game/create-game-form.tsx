"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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

const formSchema = z.object({
    gameName: z.string().min(2, {
        message: "Username must be at least 2 characters."
    }),
    characterSheet: z.string().min(2),
    thumbnail: z.string().min(2)
})

export function ProfileForm() {
    // 1. Define the form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gameName: "",
            characterSheet: "",
            thumbnail: "",
        },
    })

    // 2. Define a submit handler
    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="gameName"
                    render={({field}) => (
                    <FormItem>
                        <FormLabel>Game name</FormLabel>
                        <FormControl>
                            <Input placeholder="Game Name" {...field} />
                        </FormControl>
                        <FormDescription>
                            This is the name of your campaign.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="characterSheet"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Character sheet</FormLabel>
                            <FormControl>
                                <Input placeholder="Character Sheet" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is the character sheet of your campaign.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Thumbnail</FormLabel>
                            <FormControl>
                                <Input placeholder="Thumbnail" {...field} />
                            </FormControl>
                            <FormDescription>
                                This is the thumbnail of your campaign.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                    <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}