export default function AdminLoading() {
    return (
        <div className="p-5 lg:p-8 space-y-6 min-h-screen">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-3.5 w-20 bg-white/[0.05] rounded animate-pulse" />
                    <div className="h-9 w-40 bg-white/[0.07] rounded animate-pulse" />
                </div>
                <div className="h-9 w-24 bg-white/[0.05] rounded-xl animate-pulse" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-3 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05]" />
                        <div className="h-10 w-16 bg-white/[0.07] rounded" />
                        <div className="h-3 w-24 bg-white/[0.04] rounded" />
                    </div>
                ))}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="h-5 w-24 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-4 w-16 bg-white/[0.04] rounded animate-pulse" />
                </div>
                <div className="divide-y divide-white/[0.04]">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 flex items-center gap-6 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="h-3 w-28 bg-white/[0.06] rounded font-mono" />
                            <div className="h-3 w-32 bg-white/[0.04] rounded" />
                            <div className="h-3 w-20 bg-white/[0.04] rounded" />
                            <div className="flex-1" />
                            <div className="h-5 w-20 bg-white/[0.06] rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
