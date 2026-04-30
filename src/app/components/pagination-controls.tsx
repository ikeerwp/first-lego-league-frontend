import { buttonVariants } from "@/app/components/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PaginationControlsProps {
    readonly currentPage: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
    readonly basePath: string;
    readonly searchQuery?: string;
}

export default function PaginationControls({
    currentPage,
    hasNext,
    hasPrev,
    basePath,
    searchQuery,
}: PaginationControlsProps) {
    if (!hasNext && !hasPrev) return null;

    function buildHref(page: number) {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        params.set('page', String(page));
        return `${basePath}?${params.toString()}`;
    }

    const disabledClass = "pointer-events-none opacity-40";

    return (
        <nav className="flex items-center justify-between gap-4 pt-4" aria-label="Pagination">
            {hasPrev ? (
                <Link href={buildHref(currentPage - 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    Previous
                </Link>
            ) : (
                <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }), disabledClass)} aria-disabled="true">
                    Previous
                </span>
            )}

            <span className="text-sm text-muted-foreground">Page {currentPage}</span>

            {hasNext ? (
                <Link href={buildHref(currentPage + 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    Next
                </Link>
            ) : (
                <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }), disabledClass)} aria-disabled="true">
                    Next
                </span>
            )}
        </nav>
    );
}