'use client';

import { Button } from '@/app/components/button';
import { Input } from '@/app/components/input';
import { Label } from '@/app/components/label';
import { Textarea } from '@/app/components/textarea';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEdition } from './actions';

interface EditionData {
    year?: number;
    venueName?: string;
    description?: string;
    state?: string;
}

interface EditFormProps {
    edition: EditionData;
    editionId: string;
}

export default function EditForm({ edition, editionId }: EditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await updateEdition(editionId, formData);

            if (!result.success) {
                throw new Error(result.error || 'Failed to update edition');
            }

            router.push(`/editions/${editionId}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-xl gap-5">
            {error && (
                <p
                    className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                    role="alert"
                    aria-live="assertive"
                >
                    {error}
                </p>
            )}

            <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={edition.year ?? ''}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="venueName">Venue</Label>
                <Input
                    id="venueName"
                    name="venueName"
                    type="text"
                    defaultValue={edition.venueName ?? ''}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={edition.description ?? ''}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                    id="state"
                    name="state"
                    value={edition.state ?? ''}
                    readOnly
                    aria-readonly="true"
                />
                <p className="text-sm text-muted-foreground">
                    The edition state is managed by the backend.
                </p>
            </div>

            <Button
                type="submit"
                className="mt-2 w-full"
                loading={isLoading}
                loadingText="Updating edition..."
            >
                Submit
            </Button>
        </form>
    );
}
