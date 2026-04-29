import { EditionsService } from "@/api/editionApi";
import { UsersService } from "@/api/userApi";
import ErrorAlert from "@/app/components/error-alert";
import PageShell from "@/app/components/page-shell";
import { serverAuthProvider } from "@/lib/authProvider";
import { isAdmin } from "@/lib/authz";
import { AuthenticationError, parseErrorMessage, NotFoundError } from "@/types/errors";
import { redirect } from "next/navigation";
import EditForm from "./form";
import { Edition } from "@/types/edition";
import { User } from "@/types/user";

export const dynamic = "force-dynamic";

interface EditEditionPageProps {
    readonly params: Promise<{ id: string }>;
}

export default async function EditEditionPage(props: Readonly<EditEditionPageProps>) {
    const { id } = await props.params;

    let currentUser: User | null = null;
    let edition: Edition | null = null;
    let error: string | null = null;

    try {
        currentUser = await new UsersService(serverAuthProvider).getCurrentUser();
    } catch (e) {
        if (e instanceof AuthenticationError) {
            redirect("/login");
        }
        error = parseErrorMessage(e);
    }

    if (!currentUser && !error) {
        redirect("/login");
    }

    if (currentUser && !isAdmin(currentUser)) {
        redirect("/");
    }

    if (!error) {
        try {
            edition = await new EditionsService(serverAuthProvider).getEditionById(id);
        } catch (e) {
            console.error("Failed to fetch edition:", e);
            error = e instanceof NotFoundError
                ? "This edition does not exist."
                : parseErrorMessage(e);
        }
    }

    const editionData = edition ? {
        year: edition.year,
        venueName: edition.venueName,
        description: edition.description,
        state: edition.state,
    } : null;

    return (
        <PageShell
            eyebrow="Competition archive"
            title="Edit Edition"
            description="Update the edition's basic season details."
        >
            {error && <ErrorAlert message={error} />}
            {editionData && !error && <EditForm edition={editionData} editionId={id} />}
        </PageShell>
    );
}
