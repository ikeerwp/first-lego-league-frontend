import { API_BASE_URL } from "@/api/halClient";
import type { AuthStrategy } from "@/lib/authProvider";
import {
    ApiError,
    AuthenticationError,
    NetworkError,
    NotFoundError,
    ServerError,
    ValidationError,
} from "@/types/errors";
import type { LeaderboardPageResponse } from "@/types/leaderboard";

export class LeaderboardService {
    constructor(private readonly authStrategy: AuthStrategy) {}

    public async getEditionLeaderboard(editionId: string, page = 0, size = 20): Promise<LeaderboardPageResponse> {
        if (!Number.isInteger(page) || page < 0) {
            throw new ValidationError("Page must be a non-negative integer.");
        }
        if (!Number.isInteger(size) || size <= 0) {
            throw new ValidationError("Size must be a positive integer.");
        }

        const encodedId = encodeURIComponent(editionId);
        const url = `${API_BASE_URL}/leaderboards/editions/${encodedId}?page=${page}&size=${size}`;
        const authorization = await this.authStrategy.getAuth();

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 10_000);

        let res: Response;
        try {
            res = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    ...(authorization ? { Authorization: authorization } : {}),
                },
                cache: "no-store",
                signal: abortController.signal,
            });
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
                throw new NetworkError("Request timed out. Please try again.", e);
            }
            if (e instanceof TypeError) throw new NetworkError(undefined, e);
            throw e;
        } finally {
            clearTimeout(timeoutId);
        }

        if (!res.ok) {
            await this.handleError(res);
        }

        return res.json() as Promise<LeaderboardPageResponse>;
    }

    private async handleError(res: Response): Promise<never> {
        let errorMessage: string | undefined;
            try {
                const contentType = res.headers.get("content-type");
                if (contentType?.toLowerCase().includes("json")) {
                    const body = await res.json();
                    errorMessage = body.message || body.error || body.detail;
                }
            } catch {
                // ignore, fall back to generic messages
            }

            switch (res.status) {
                case 401:
                case 403:
                    throw new AuthenticationError(errorMessage, res.status);
                case 404:
                    throw new NotFoundError(errorMessage);
                case 400:
                    throw new ValidationError(errorMessage);
                case 500:
                case 502:
                case 503:
                case 504:
                    throw new ServerError(errorMessage, res.status);
                default:
                    throw new ApiError(errorMessage ?? "An error occurred. Please try again.", res.status, true);
            }
        }
}
