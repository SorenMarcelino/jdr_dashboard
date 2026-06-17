export default function Loading() {
    return (
        <div className="min-h-svh flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm">Chargement...</p>
            </div>
        </div>
    );
}
