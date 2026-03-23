export function D6Icon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} width="24" height="24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
}
