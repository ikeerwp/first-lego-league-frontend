"use client";

import { useSearchParams } from "next/navigation";

export function useEditionYear(): string | null {
    const searchParams = useSearchParams();
    return searchParams.get("year");
}
