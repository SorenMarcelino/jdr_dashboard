export function D20Icon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} width="24" height="24">
            <polygon points="12,1 22,7 22,17 12,23 2,17 2,7" />
            <line x1="12" y1="1" x2="12" y2="23" opacity="0.3" />
            <line x1="2" y1="7" x2="22" y2="17" opacity="0.3" />
            <line x1="22" y1="7" x2="2" y2="17" opacity="0.3" />
            <text x="12" y="15" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="bold">20</text>
        </svg>
    );
}
