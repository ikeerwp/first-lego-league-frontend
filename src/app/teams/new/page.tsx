import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import { redirect } from "next/navigation";
import NewTeamForm from "./form";

export const dynamic = "force-dynamic";

export default async function NewTeamPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) {
        redirect("/login");
    }

    let currentUser: User | null = null;
    let error: string | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        if (e instanceof AuthenticationError) {
            redirect("/login");
        }

        error = parseErrorMessage(e);
    }

    if (!error && !currentUser) {
        redirect("/login");
    }

    if (!error && !isAdmin(currentUser)) {
        redirect("/");
    }

    return (
        <PageShell
            eyebrow="Team management"
            title="New Team"
            description="Create a team, add its members, and register one or two coaches in a single flow."
        >
            {error ? <ErrorAlert message={error} /> : <NewTeamForm />}
        </PageShell>
    );
}
