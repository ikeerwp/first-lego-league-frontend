import { CompetitionTableService, getTableId, getRefereeAssignedTableId } from "@/api/competitionTableApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import { serverAuthProvider } from "@/lib/authProvider";
import { UsersService } from "@/api/userApi";
import { isAdmin } from "@/lib/authz";
import { parseErrorMessage } from "@/types/errors";
import { redirect } from "next/navigation";
import { CompetitionTable } from "@/types/competitionTable";
import { Referee } from "@/types/referee";
import CompetitionTableList from "./competition-table-list";
import { RefereeOption } from "./assign-referee-dialog";

export const dynamic = "force-dynamic";

function toRefereeOption(r: Referee): RefereeOption {
    return {
        href: r.link("self")?.href ?? "",
        name: r.name ?? r.emailAddress ?? "Unknown",
        emailAddress: r.emailAddress ?? "",
        assignedTableId: getRefereeAssignedTableId(r),
    };
}

export default async function CompetitionTablesPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const userService = new UsersService(serverAuthProvider);
    const tableService = new CompetitionTableService(serverAuthProvider);

    let tables: CompetitionTable[] = [];
    let allReferees: Referee[] = [];
    let error: string | null = null;

    try {
        const currentUser = await userService.getCurrentUser();
        if (!isAdmin(currentUser)) redirect("/");
    } catch {
        redirect("/login");
    }

    try {
        [tables, allReferees] = await Promise.all([
            tableService.getTables(),
            tableService.getReferees(),
        ]);
    } catch (e) {
        console.error("Failed to fetch competition tables data:", e);
        error = parseErrorMessage(e);
    }

    const allRefereeOptions = allReferees.map(toRefereeOption);

    const refereesByTable: Record<string, RefereeOption[]> = {};
    for (const option of allRefereeOptions) {
        if (option.assignedTableId) {
            refereesByTable[option.assignedTableId] = [...(refereesByTable[option.assignedTableId] ?? []), option];
        }
    }

    const tableIds = tables.map(getTableId);

    return (
        <PageShell
            eyebrow="Administration"
            title="Competition Tables"
            description="Manage physical match tables and assign referees."
        >
            {error && <ErrorAlert message={error} />}

            {!error && (
                <CompetitionTableList
                    tables={tableIds}
                    refereesByTable={refereesByTable}
                    allReferees={allRefereeOptions}
                />
            )}
        </PageShell>
    );
}
