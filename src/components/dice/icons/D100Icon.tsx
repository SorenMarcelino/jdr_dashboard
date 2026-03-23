export function D100Icon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} width="24" height="24">
            <polygon points="8,2 14,6 14,14 8,18 2,14 2,6" />
            <polygon points="16,6 22,10 22,18 16,22 10,18 10,10" opacity="0.6" />
            <text x="8" y="12" textAnchor="middle" fill="currentColor" stroke="none" fontSize="5" fontWeight="bold">%</text>
        </svg>
    );
}
