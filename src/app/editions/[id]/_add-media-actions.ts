'use server';

import { MediaService } from '@/api/mediaApi';
import { serverAuthProvider } from '@/lib/authProvider';

export async function addMedia(imageUrl: string, editionUri: string, type: string): Promise<void> {
    const service = new MediaService(serverAuthProvider);
    await service.createMedia({ url: imageUrl, type, edition: editionUri });
}
