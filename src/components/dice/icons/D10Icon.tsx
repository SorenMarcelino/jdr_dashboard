export function D10Icon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} width="24" height="24">
            <polygon points="12,2 21,8 21,16 12,22 3,16 3,8" />
            <text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="bold">10</text>
        </svg>
    );
}
