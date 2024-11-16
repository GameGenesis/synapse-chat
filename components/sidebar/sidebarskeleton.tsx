import { Skeleton } from "@/components/ui/skeleton";

export const SidebarSkeleton = () => {
    return (
        <div className="space-y-3 p-2">
            {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg">
                    <Skeleton className="h-5 w-5 rounded-md" /> {/* Icon */}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-[120px]" /> {/* Title */}
                            <Skeleton className="h-3 w-[50px]" /> {/* Time */}
                        </div>
                        <Skeleton className="h-3 w-[180px]" /> {/* Preview */}
                    </div>
                </div>
            ))}
        </div>
    );
};
