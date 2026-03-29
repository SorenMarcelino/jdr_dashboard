const SYSTEM_ID_MAP: Record<string, string> = {
    "Magnus Archives": "magnus_archives",
    "magnus_archives": "magnus_archives",
};

export function resolveSystemId(characterSheet: string): string {
    return SYSTEM_ID_MAP[characterSheet] ?? characterSheet.toLowerCase().replace(/\s+/g, "_");
}
