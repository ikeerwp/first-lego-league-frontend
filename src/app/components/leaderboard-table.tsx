import { getEncodedResourceId } from "@/lib/halRoute";
import type { LeaderboardItem } from "@/types/leaderboard";
import Link from "next/link";

interface LeaderboardTableProps {
    readonly items: LeaderboardItem[];
}

export default function LeaderboardTable({ items }: LeaderboardTableProps) {
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="pb-3 pr-4 font-medium">#</th>
                    <th scope="col" className="pb-3 pr-4 font-medium">Team</th>
                    <th scope="col" className="pb-3 pr-4 font-medium text-right">Total Score</th>
                    <th scope="col" className="pb-3 font-medium text-right">Matches Played</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item) => {
                    const isTop3 = item.position <= 3;
                    const teamHref = getEncodedResourceId(item.teamId);
                    return (
                        <tr key={item.teamId} className="border-b border-border last:border-0">
                            <td className={`py-3 pr-4 text-sm ${isTop3 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {item.position}
                            </td>
                            <td className={`py-3 pr-4 ${isTop3 ? "font-semibold text-foreground" : ""}`}>
                                {teamHref ? (
                                    <Link href={`/teams/${teamHref}`} className="hover:underline">
                                        {item.teamName}
                                    </Link>
                                ) : (
                                    <span>{item.teamName}</span>
                                )}
                            </td>
                            <td className={`py-3 pr-4 text-right ${isTop3 ? "font-semibold text-foreground" : ""}`}>
                                {item.totalScore}
                            </td>
                            <td className={`py-3 text-right ${isTop3 ? "font-semibold text-foreground" : ""}`}>
                                {item.matchesPlayed}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
