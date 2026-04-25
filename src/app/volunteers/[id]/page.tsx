import { VolunteersService } from "@/api/volunteerApi";
import { UsersService } from "@/api/userApi";
import { serverAuthProvider } from "@/lib/authProvider";
import { revalidatePath } from "next/cache";
import EditVolunteerModal from "./_edit-volunteer-modal";
import EmptyState from "@/app/components/empty-state";
import { Volunteer } from "@/types/volunteer";


interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ edit?: string }>;
}

export default async function VolunteerDetailPage(props: Readonly<Props>) {
    const { id } = await props.params;

    const usersService = new UsersService(serverAuthProvider);
    const volunteerService = new VolunteersService(serverAuthProvider);

    const currentUser = await usersService.getCurrentUser();

    const userIsAdmin =
        currentUser?.username === 'admin' ||
        (currentUser as any)?.id === 'admin' ||
        (currentUser as any)?.roles?.includes('ADMIN');

    let volunteer: Volunteer | null = null;
    try {
        const data = await volunteerService.getVolunteers();
        const all = [...data.judges, ...data.referees, ...data.floaters];
        volunteer = all.find(v => v.uri === decodeURIComponent(id)) ?? null;
    } catch (e) {
        console.error("Error fetching volunteers:", e);
    }

    async function updateVolunteerData(uri: string, data: Partial<Volunteer>) {
        'use server';

        const authService = new UsersService(serverAuthProvider);
        const user = await authService.getCurrentUser();

        const isAdmin =
            user?.username === 'admin' ||
            (user as any)?.id === 'admin' ||
            (user as any)?.roles?.includes('ADMIN');

        if (!isAdmin) {
            return { success: false, error: "Access denied: You are not an administrator" };
        }

        try {
            const service = new VolunteersService(serverAuthProvider);
            await service.updateVolunteer(uri, data);
            revalidatePath('/volunteers');
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    if (!volunteer) return <EmptyState title="Not found" />;

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="w-full max-w-3xl px-4 py-10">
                <div className="w-full rounded-lg border bg-white p-6 shadow-sm dark:bg-black">

                    <h1 className="mb-2 text-2xl font-semibold">
                        {volunteer.name || "Unnamed volunteer"}
                    </h1>

                    <div className="mb-6 space-y-1 text-sm text-muted-foreground">
                        <p><strong>Role:</strong> {volunteer.type}</p>
                        <p><strong>Email:</strong> {volunteer.emailAddress || "—"}</p>
                        <p><strong>Phone:</strong> {volunteer.phoneNumber || "—"}</p>
                    </div>

                    {volunteer.type === "Judge" && (
                        <div className="mt-6 space-y-2">
                            <h2 className="text-xl font-semibold">Judge Info</h2>
                            <p><strong>Expert:</strong> {volunteer.expert ? "Yes" : "No"}</p>
                        </div>
                    )}

                </div>
                {userIsAdmin && (
                    <EditVolunteerModal
                        volunteer={volunteer}
                        updateAction={updateVolunteerData}
                    />
                )}
            </div>
        </div>
    );
}