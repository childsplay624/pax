export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                {/* Spinning logo */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-2xl bg-red-brand/15 border border-red-brand/20 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-brand animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-brand rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-red-brand rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-red-brand rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">Loading…</p>
            </div>
        </div>
    );
}
