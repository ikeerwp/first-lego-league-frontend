export interface LeaderboardItem {
    position: number;
    teamId: string;
    teamName: string;
    totalScore: number;
    matchesPlayed: number;
}

export interface LeaderboardPageResponse {
    items: LeaderboardItem[];
    page: number;
    size: number;
    totalElements: number;
}
