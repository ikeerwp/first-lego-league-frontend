import { VolunteersService } from "@/api/volunteerApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { Volunteer } from "@/types/volunteer";
import VolunteersClient from "./_volunteers-client";

export default async function VolunteersPage() {
    const service = new VolunteersService(serverAuthProvider);
    let judges: Volunteer[] = [];
    let referees: Volunteer[] = [];
    let floaters: Volunteer[] = [];
    let error: string | null = null;

    try {
        const data = await service.getVolunteers();
        judges = data.judges;
        referees = data.referees;
        floaters = data.floaters;
    } catch (e) {
        console.error("Failed to fetch volunteers:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Volunteers directory"
            title="Volunteers"
            description="Manage the competition volunteers including judges, referees, and floaters."
        >
            <div className="space-y-8">
                {error && <ErrorAlert message={error} />}

                {!error && (
                    <VolunteersClient judges={judges} referees={referees} floaters={floaters} />
                )}
            </div>
        </PageShell>
    );
}
