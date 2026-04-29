import { LeaderboardService } from "@/api/leaderboardApi";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import LeaderboardTable from "@/app/components/leaderboard-table";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import type { LeaderboardItem } from "@/types/leaderboard";

interface LeaderboardPageProps {
    readonly params: Promise<{ id: string }>;
    readonly searchParams?: Promise<{ page?: string; size?: string }>;
}

export default async function LeaderboardPage(props: Readonly<LeaderboardPageProps>) {
    const { id } = await props.params;
    const searchParams = (await props.searchParams) ?? {};
    const page = Number(searchParams.page ?? "0");
    const size = Number(searchParams.size ?? "20");
    const service = new LeaderboardService(serverAuthProvider);

    let items: LeaderboardItem[] = [];
    let error: string | null = null;

    try {
        const data = await service.getEditionLeaderboard(id, page, size);
        items = data.items;
    } catch (e) {
        console.error("Failed to fetch leaderboard:", e);
        error = parseErrorMessage(e);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h1 className="text-2xl font-semibold mb-6 text-foreground">Leaderboard</h1>

                    {error && <ErrorAlert message={error} />}

                    {!error && items.length === 0 && (
                        <EmptyState
                            title="No results yet"
                            description="No results yet for this edition."
                        />
                    )}

                    {!error && items.length > 0 && <LeaderboardTable items={items} />}
                </div>
            </div>
        </div>
    );
}
