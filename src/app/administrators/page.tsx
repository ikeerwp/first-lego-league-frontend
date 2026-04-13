import { UsersService } from "@/api/userApi";
import PageShell from "@/app/components/page-shell";
import ErrorAlert from "@/app/components/error-alert";
import EmptyState from "@/app/components/empty-state";
import { serverAuthProvider } from "@/lib/authProvider";
import { User } from "@/types/user";
import { parseErrorMessage } from "@/types/errors";
import Link from "next/link";
import { redirect } from "next/navigation";

function isAdmin(user: User | null) {
    return !!user?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );
}

export default async function AdministratorsPage() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) redirect("/login");

    const service = new UsersService(serverAuthProvider);

    let currentUser: User | null = null;
    let administrators: User[] = [];
    let error: string | null = null;

    try {
        currentUser = await service.getCurrentUser();
    } catch (e) {
        console.error("Failed to fetch current user:", e);
        redirect("/");
    }

    if (!isAdmin(currentUser)) {
        redirect("/");
    }

    try {
        const users = await service.getUsers();
        administrators = users.filter((user) =>
            user.authorities?.some(
                (authority) => authority.authority === "ROLE_ADMIN"
            )
        );
    } catch (e) {
        console.error("Failed to fetch administrators:", e);
        error = parseErrorMessage(e);
    }

    return (
        <PageShell
            eyebrow="Administration"
            title="Administrators"
            description="Browse the administrators registered in the platform."
        >
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="page-eyebrow">System administrators</div>
                    <h2 className="section-title">Directory</h2>
                    <p className="section-copy max-w-3xl">
                        Select an administrator to view profile details.
                    </p>
                </div>

                {error && <ErrorAlert message={error} />}

                {!error && administrators.length === 0 && (
                    <EmptyState
                        title="No administrators found"
                        description="There are currently no administrators in the system."
                    />
                )}

                {!error && administrators.length > 0 && (
                    <ul className="list-grid">
                        {administrators.map((administrator) => (
                            <li key={administrator.username} className="list-card pl-7">
                                <div className="list-kicker">Administrator</div>
                                <Link
                                    className="list-title block hover:text-primary"
                                    href={`/users/${administrator.username}`}
                                >
                                    {administrator.username}
                                </Link>

                                {administrator.email && (
                                    <div className="list-support">{administrator.email}</div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {administrator.authorities?.map((authority) => (
                                        <span
                                            key={`${administrator.username}-${authority.authority}`}
                                            className="status-badge"
                                        >
                                            {authority.authority}
                                        </span>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </PageShell>
    );
}
