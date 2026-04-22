'use client';

import { useId, useState } from 'react';
import { Button } from '@/app/components/button';
import { AVAILABLE_MEMBER_ROLES } from '@/types/team';

type AddMemberFormProps = Readonly<{
    onSubmit: (name: string, role: string) => Promise<boolean> | void;
    onCancel: () => void;
    isLoading?: boolean;
}>;

export function AddMemberForm({
    onSubmit,
    onCancel,
    isLoading = false
}: AddMemberFormProps) {
    const nameInputId = useId();
    const roleSelectId = useId();

    const [name, setName] = useState('');
    const [role, setRole] = useState<string>(AVAILABLE_MEMBER_ROLES[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        const success = await onSubmit(name.trim(), role);

        if (success) {
            setName('');
            setRole(AVAILABLE_MEMBER_ROLES[0]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded bg-white dark:bg-zinc-900 shadow-sm">
            <div>
                <label 
                    htmlFor={nameInputId}
                    className="block text-xs font-medium uppercase text-zinc-500 mb-1"
                >
                    Name
                </label>
                <input
                    id={nameInputId}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Albert"
                    className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
            </div>

            <div>
                <label 
                    htmlFor={roleSelectId}
                    className="block text-xs font-medium uppercase text-zinc-500 mb-1"
                >
                    Role
                </label>
                <select
                    id={roleSelectId}
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="border p-2 w-full rounded bg-white dark:bg-zinc-800"
                    disabled={isLoading}
                >
                    {AVAILABLE_MEMBER_ROLES.map(r => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    type="submit"
                    loading={isLoading}
                    loadingText="Adding member..."
                    disabled={!name.trim() || !role}
                >
                    Add Member
                </Button>

                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
