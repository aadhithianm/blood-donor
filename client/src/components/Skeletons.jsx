/** Reusable skeleton components for loading states */

/** Single skeleton line with configurable width */
export const SkeletonLine = ({ w = 'w-full', h = 'h-3' }) => (
    <div className={`${w} ${h} rounded-full animate-pulse`} style={{ background: 'var(--bg-ghost)' }} />
);

/** Skeleton for a KPI stat card */
export const SkeletonStatCard = () => (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
        <SkeletonLine w="w-1/2" h="h-7" />
        <SkeletonLine w="w-2/3" h="h-2.5" />
    </div>
);

/** Skeleton for a table row */
export const SkeletonTableRow = ({ cols = 5 }) => (
    <tr style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-4 py-3.5">
                <SkeletonLine w={i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-1/2' : 'w-2/3'} />
            </td>
        ))}
    </tr>
);

/** Skeleton for a card (hospital/broadcast item) */
export const SkeletonCard = () => (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
            <div className="flex-1 space-y-2 pt-1">
                <SkeletonLine w="w-3/4" h="h-3.5" />
                <SkeletonLine w="w-1/3" h="h-2.5" />
            </div>
        </div>
        <div className="space-y-2">
            <SkeletonLine h="h-2.5" />
            <SkeletonLine w="w-4/5" h="h-2.5" />
        </div>
        <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
            <div className="flex-1 h-9 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
        </div>
    </div>
);

/** Skeleton for chart placeholder */
export const SkeletonChart = ({ h = 220 }) => (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
        <SkeletonLine w="w-40" h="h-4" />
        <div className="mt-5 flex items-end gap-2" style={{ height: h }}>
            {[60, 90, 45, 110, 75, 95, 50, 80].map((pct, i) => (
                <div key={i} className="flex-1 rounded-t-lg animate-pulse"
                    style={{ height: `${pct}%`, background: 'var(--bg-ghost)' }} />
            ))}
        </div>
    </div>
);

/** Complex Skeleton for the Donor Dashboard */
export const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <SkeletonLine w="w-1/3" h="h-8" />
            <SkeletonLine w="w-1/4" h="h-4" />
        </div>
        
        {/* Actions Skeleton */}
        <div className="flex gap-4">
            <div className="w-40 h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
            <div className="w-40 h-10 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
        </div>
        
        {/* Badges / Logs Skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
               <SkeletonLine w="w-1/4" h="h-6" />
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   <div className="rounded-2xl p-4 h-24 animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                   <div className="rounded-2xl p-4 h-24 animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                   <div className="rounded-2xl p-4 h-24 animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                   <div className="rounded-2xl p-4 h-24 animate-pulse" style={{ background: 'var(--bg-surface)' }} />
               </div>
            </div>
            <SkeletonChart h={160} />
        </div>
    </div>
);
