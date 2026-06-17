import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-svh flex flex-col items-center justify-center gap-4 bg-muted p-6 text-center">
            <p className="text-5xl font-bold">404</p>
            <h1 className="text-xl font-semibold">Page introuvable</h1>
            <p className="text-muted-foreground">
                La page que vous cherchez n&apos;existe pas ou a été déplacée.
            </p>
            <Button asChild>
                <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
        </div>
    );
}
