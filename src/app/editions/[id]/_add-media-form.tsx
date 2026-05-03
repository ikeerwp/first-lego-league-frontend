'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMedia } from './_add-media-actions';
import { Input } from '@/app/components/input';
import { Button } from '@/app/components/button';
import ErrorAlert from '@/app/components/error-alert';

interface AddMediaFormProps {
    editionUri: string;
}

const IMAGE_VALIDATION_TIMEOUT_MS = 10_000;

function validateImageUrl(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const img = new Image();
        const timeoutId = setTimeout(() => {
            img.src = '';
            reject(new Error('Timed out while loading image URL'));
        }, IMAGE_VALIDATION_TIMEOUT_MS);
        img.onload = () => { clearTimeout(timeoutId); resolve(); };
        img.onerror = () => { clearTimeout(timeoutId); reject(new Error('URL does not resolve to a valid image')); };
        img.src = url;
    });
}

function inferImageType(url: string): string | null {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
    };
    return types[ext ?? ''] ?? null;
}

export default function AddMediaForm({ editionUri }: Readonly<AddMediaFormProps>) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return (
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                + Add Media
            </Button>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const trimmed = url.trim();
        if (!trimmed) return;

        setIsLoading(true);
        try {
            await validateImageUrl(trimmed);
            const type = inferImageType(trimmed);
            if (!type) {
                throw new Error('Could not determine image type from URL extension');
            }
            await addMedia(trimmed, editionUri, type);
            setIsOpen(false);
            setUrl('');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add media');
        } finally {
            setIsLoading(false);
        }
    }

    function handleCancel() {
        setIsOpen(false);
        setUrl('');
        setError(null);
    }

    return (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
            {error && <ErrorAlert message={error} />}
            <Input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                aria-label="Image URL"
                disabled={isLoading}
                required
            />
            <div className="flex gap-2">
                <Button type="submit" size="sm" loading={isLoading} loadingText="Validating...">
                    Confirm
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
