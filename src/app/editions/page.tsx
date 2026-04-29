import { EditionsService } from "@/api/editionApi";
import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import { buttonVariants } from "@/app/components/button";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import Link from "next/link";
import EditionsClient, { EditionItem } from "./_editions-client";

export const dynamic = "force-dynamic";

export default async function EditionsPage() {
    let editions: EditionItem[] = [];
    let error: string | null = null;
    let currentUser: User | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
    }

    try {
        const service = new EditionsService(serverAuthProvider);
        const data = await service.getEditions();
        editions = data.map(e => ({
            uri: e.uri,
            year: e.year,
            venueName: e.venueName,
            description: e.description,
            state: e.state,
        }));
    } catch (e) {
        console.error("Failed to fetch editions:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Competition archive"
            title="Editions"
            description="Browse the yearly editions of FIRST LEGO League, including venue and season details."
            heroAside={isAdmin(currentUser) ? (
                <Link href="/editions/new" className={buttonVariants({ variant: "default", size: "sm" })}>
                    + Create
                </Link>
            ) : undefined}
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">Edition list</div>
                    <h2 className="section-title">Season overview</h2>
                    <p className="section-copy max-w-3xl">
                        Each card highlights the season, venue and published information for that edition.
                    </p>
                </div>

                {error && <ErrorAlert message={error} />}

                {!error && (
                    <EditionsClient editions={editions} />
                )}
            </div>
        </PageShell>
    );
}
