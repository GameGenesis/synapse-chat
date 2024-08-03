import { Skeleton } from "@/components/ui";

const DefaultPromptsSkeleton = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <Skeleton className="h-8 w-96 mb-6" />
            <div className="grid grid-cols-2 gap-4 w-full max-w-xl mx-auto">
                {[...Array(4)].map((_, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg h-32"
                    >
                        <Skeleton className="h-12 w-12 rounded-full mb-3" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DefaultPromptsSkeleton;
