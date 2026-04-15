'use client';

import { useState } from 'react';
import { Button } from '@/app/components/button';
import { AddMemberForm } from './add-member-form';
import { DeleteMemberDialog } from './delete-member-dialog';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { User } from '@/types/user';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    uri: string;
}

interface TeamMembersManagerProps {
    teamId: string;
    initialMembers: User[];
    isCoach: boolean;
    isAdmin: boolean;
}

export function TeamMembersManager({ teamId, initialMembers, isCoach, isAdmin }: TeamMembersManagerProps) {
    const isAuthorized = isCoach || isAdmin;
    const { members, addMember, removeMember, isFull } = useTeamMembers(teamId, initialMembers);
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<TeamMember | null>(null);

    const castedMembers = members as unknown as TeamMember[];

    return (
        <div className="space-y-4">
            {isAuthorized && !isFull && (
                <Button onClick={() => setShowForm(true)}>Add Member</Button>
            )}

            {showForm && (
                <AddMemberForm
                    onSubmit={async (name, role) => {
                        const success = await addMember(name, role);
                        if (success) setShowForm(false);
                        return success;
                    }}
                    onCancel={() => setShowForm(false)}
                />
            )}

            <ul className="space-y-2">
                {castedMembers.map((m) => (
                    <li key={m.uri || m.id} className="flex items-center justify-between border p-3 rounded-lg bg-white">
                        <div>
                            <span className="font-medium block">{m.name}</span>
                            <span className="text-xs text-zinc-500 uppercase">{m.role}</span>
                        </div>
                        {isAuthorized && (
                            <Button variant="destructive" size="sm" onClick={() => setSelected(m)}>
                                Delete
                            </Button>
                        )}
                    </li>
                ))}
            </ul>

            {selected && (
                <DeleteMemberDialog
                    member={selected}
                    onCancel={() => setSelected(null)}
                    onSuccess={(uri: string) => {
                        removeMember(uri); 
                        setSelected(null);
                    }}
                />
            )}
        </div>
    );
}