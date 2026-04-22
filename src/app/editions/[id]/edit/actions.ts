'use server';

import { revalidatePath } from 'next/cache';
import { EditionsService } from '@/api/editionApi';
import { serverAuthProvider } from '@/lib/authProvider';
import { isAdmin } from '@/lib/authz';
import { UsersService } from '@/api/userApi';
import { AuthenticationError } from '@/types/errors';


function parseErrorMessage(error: unknown): string | undefined {
    if (error instanceof AuthenticationError && error.message) {
        return error.message;
    }
    return undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
    return parseErrorMessage(error) ?? fallback;
}


async function assertAdminAccess() {
    const auth = await serverAuthProvider.getAuth();
    if (!auth) throw new AuthenticationError();

    const usersService = new UsersService(serverAuthProvider);
    const currentUser = await usersService.getCurrentUser();

    if (!isAdmin(currentUser)) {
        throw new AuthenticationError("You are not allowed to edit editions.", 403);
    }
}

export async function updateEdition(id: string, formData: FormData) {
    try {
        await assertAdminAccess();

        const year = formData.get('year');
        const venueName = formData.get('venueName');
        const description = formData.get('description');
        const service = new EditionsService(serverAuthProvider);

        await service.updateEdition(id, {
            year: year ? Number(year) : undefined,
            venueName: venueName !== null ? String(venueName) : undefined,
            description: description !== null ? String(description) : undefined,
        });

        revalidatePath(`/editions/${id}`);
        revalidatePath(`/editions/${id}/edit`);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: getErrorMessage(error, 'Error updating the edition')
        };
    }
}