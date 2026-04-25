'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Volunteer } from '@/types/volunteer';

interface Props {
    volunteer: Volunteer;
    updateAction: (uri: string, data: Partial<Volunteer>) => Promise<{ success: boolean; error?: string }>;
}

export default function EditVolunteerModal({ volunteer, updateAction }: Readonly<Props>) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const isEditingMode = searchParams.get('edit') === 'true';
    const [isOpen, setIsOpen] = useState(isEditingMode);
    
    const [formData, setFormData] = useState({
        name: volunteer?.name || '',
        emailAddress: volunteer?.emailAddress || '',
        phoneNumber: volunteer?.phoneNumber || '',
        expert: volunteer?.expert || false, 
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsOpen(searchParams.get('edit') === 'true');
    }, [searchParams]);

    const closeModal = () => {
        setIsOpen(false);
        router.replace(`/volunteers/${encodeURIComponent(volunteer.uri!)}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await updateAction(volunteer.uri!, formData);

        if (result.success) {
            closeModal();
            router.refresh(); 
        } else {
            setError(result.error || 'Failed to update volunteer');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-zinc-900 dark:text-zinc-100">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900 border dark:border-zinc-800">
                <h2 className="text-xl font-semibold mb-4">Edit Volunteer</h2>
                
                {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input 
                            type="text" required
                            className="w-full border rounded px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input 
                            type="email" required
                            className="w-full border rounded px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                            value={formData.emailAddress}
                            onChange={e => setFormData({ ...formData, emailAddress: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input 
                            type="tel"
                            className="w-full border rounded px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                            value={formData.phoneNumber}
                            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                        />
                    </div>

                    {volunteer.type === 'Judge' && (
                        <div className="flex items-center space-x-2 py-2">
                            <input 
                                type="checkbox"
                                id="expert"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.expert}
                                onChange={e => setFormData({ ...formData, expert: e.target.checked })}
                            />
                            <label htmlFor="expert" className="text-sm font-medium">
                                Is Expert Judge
                            </label>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-3 border-t pt-4 dark:border-zinc-800">
                        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}