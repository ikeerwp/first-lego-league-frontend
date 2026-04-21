import { TeamsService } from "@/api/teamApi";
import { UsersService } from "@/api/userApi";
import EmptyState from "@/app/components/empty-state";
import ErrorAlert from "@/app/components/error-alert";
import { TeamMembersManager } from "@/app/components/team-member-manager";
import { serverAuthProvider } from "@/lib/authProvider";
import { NotFoundError, parseErrorMessage } from "@/types/errors";
import { Team, TeamCoach, TeamMember, TeamMemberSnapshot } from "@/types/team";
import { User } from "@/types/user";

interface TeamDetailPageProps {
    readonly params: Promise<{ id: string }>;
}

function toTeamMemberSnapshot(member: TeamMember): TeamMemberSnapshot {
    return {
        id: member.id,
        name: member.name,
        birthDate: member.birthDate,
        gender: member.gender,
        tShirtSize: member.tShirtSize,
        role: member.role,
        uri: member.uri ?? member.link("self")?.href,
    };
}

export default async function TeamDetailPage(props: Readonly<TeamDetailPageProps>) {
    const { id } = await props.params;

    const service = new TeamsService(serverAuthProvider);
    const userService = new UsersService(serverAuthProvider);

    let currentUser: User | null = null;
    let team: Team | null = null;
    let coaches: TeamCoach[] = [];
    let members: TeamMember[] = [];
    let error: string | null = null;
    let membersError: string | null = null;

    try {
        currentUser = await userService.getCurrentUser().catch(() => null);
        team = await service.getTeamById(id);
    } catch (e) {
        if (e instanceof NotFoundError) {
            return <EmptyState title="Not found" description="Team does not exist" />;
        }
        error = parseErrorMessage(e);
    }

    if (team && !error) {
        try {
            const [coachesData, membersData] = await Promise.all([
                service.getTeamCoach(id),
                service.getTeamMembers(id)
            ]);

            coaches = coachesData ?? [];
            members = membersData ?? [];
        } catch (e) {
            console.error("Error loading members:", e);
            membersError = parseErrorMessage(e);
        }
    }

    if (error) return <ErrorAlert message={error} />;
    if (!team) return <EmptyState title="Not found" description="Team does not exist" />;

    const isAdmin = !!currentUser?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );

    const currentUserEmail = currentUser?.email?.trim().toLowerCase();
    const isCoach = !!currentUserEmail && coaches.some(
        (coach) => coach.emailAddress?.trim().toLowerCase() === currentUserEmail
    );

    const coachName = coaches.length > 0
        ? (coaches[0].name ?? coaches[0].emailAddress ?? "Unnamed coach")
        : "No coach assigned";
    const initialMembers = members.map(toTeamMemberSnapshot);
    const membersKey = initialMembers
        .map((member) => member.uri ?? String(member.id ?? member.name ?? ""))
        .join("|");

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h1 className="mb-2 text-2xl font-semibold text-foreground">{team.name}</h1>

                    <div className="mb-6 space-y-1 text-sm text-muted-foreground">
                        {team.city && <p><strong>City:</strong> {team.city}</p>}
                        <p><strong>Coach:</strong> {coachName}</p>
                    </div>

                    <h2 className="mt-8 mb-4 text-xl font-semibold text-foreground">Team Members</h2>

                    {!membersError && (
                        <TeamMembersManager
                            key={`${id}-${membersKey}`}
                            teamId={id}
                            initialMembers={initialMembers}
                            isCoach={isCoach}
                            isAdmin={isAdmin}
                        />
                    )}
                    {membersError && <ErrorAlert message={membersError} />}
                </div>
            </div>
        </div>
    );
}
