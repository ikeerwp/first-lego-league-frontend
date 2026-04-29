import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage } from "@/types/errors";
import { User } from "@/types/user";
import { redirect } from "next/navigation";
import NewEditionForm from "./form";

export const dynamic = "force-dynamic";

export default async function NewEditionPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

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
            eyebrow="Competition archive"
            title="New Edition"
            description="Create a new FIRST LEGO League edition and publish its basic season details."
        >
            {error ? <ErrorAlert message={error} /> : <NewEditionForm />}
        </PageShell>
    );
}
