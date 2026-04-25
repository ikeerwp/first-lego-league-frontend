import { VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi"; // O "@/api/usersApi", verifica el nombre de tu archivo
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";
import { Volunteer } from "@/types/volunteer";
import VolunteersClient, { VolunteerItem } from "./_volunteers-client";

function toVolunteerItem(v: Volunteer): VolunteerItem {
    return {
        name: v.name,
        emailAddress: v.emailAddress,
        type: v.type,
        uri: v.uri,
        expert: v.expert 
    };
}

export default async function VolunteersPage() {
    const service = new VolunteersService(serverAuthProvider);
    const usersService = new UsersService(serverAuthProvider);
    
    let judges: VolunteerItem[] = [];
    let referees: VolunteerItem[] = [];
    let floaters: VolunteerItem[] = [];
    let error: string | null = null;
    let userIsAdmin = false;

    try {
        const token = await serverAuthProvider.getAuth();
        
        if (token) {
            const currentUser = await usersService.getCurrentUser();
            
            userIsAdmin = 
                currentUser?.username === 'admin' || 
                (currentUser as any)?.id === 'admin' || 
                (currentUser as any)?.roles?.includes('ADMIN');
        }

        const data = await service.getVolunteers();
        judges = data.judges.map(toVolunteerItem);
        referees = data.referees.map(toVolunteerItem);
        floaters = data.floaters.map(toVolunteerItem);
        
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
                    <VolunteersClient
                        judges={judges}
                        referees={referees}
                        floaters={floaters}
                        isAdmin={userIsAdmin} 
                    />
                )}
            </div>
        </PageShell>
    );
}