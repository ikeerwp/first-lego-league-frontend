import { buttonVariants } from "@/app/components/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PaginationControlsProps {
    readonly currentPage: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
    readonly basePath: string;
}

export default function PaginationControls({
    currentPage,
    hasNext,
    hasPrev,
    basePath,
}: PaginationControlsProps) {
    if (!hasNext && !hasPrev) return null;

    const prevHref = `${basePath}?page=${currentPage - 1}`;
    const nextHref = `${basePath}?page=${currentPage + 1}`;
    const disabledClass = "pointer-events-none opacity-40";

    return (
        <nav className="flex items-center justify-between gap-4 pt-4" aria-label="Pagination">
            {hasPrev ? (
                <Link href={prevHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    Previous
                </Link>
            ) : (
                <span className={cn(buttonVariants({ variant: "secondary", size: "sm" }), disabledClass)} aria-disabled="true">
                    Previous
                </span>
            )}

            <span className="text-sm text-muted-foreground">Page {currentPage}</span>

            {hasNext ? (
                <Link href={nextHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
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
