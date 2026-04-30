'use client';

import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { Button } from '@/app/components/button';
import { VolunteerRole } from '@/types/volunteer';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DeleteVolunteerDialog } from './delete-volunteer-dialog';

export interface VolunteerItem {
    name?: string;
    emailAddress?: string;
    type?: VolunteerRole;
    uri?: string;
}

interface VolunteersClientProps {
    judges: VolunteerItem[];
    referees: VolunteerItem[];
    floaters: VolunteerItem[];
    isAdmin: boolean;
}

interface VolunteerSectionProps {
    title: string;
    typePlural: string;
    volunteers: VolunteerItem[];
    emptyMessage: string;
    isAdmin: boolean;
    onDeleteRequest: (volunteer: { name: string; uri: string }) => void;
}

function filterByName(volunteers: VolunteerItem[], query: string): VolunteerItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return volunteers;
    return volunteers.filter(v => v.name?.toLowerCase().includes(q));
}

function VolunteerSection({
    title,
    typePlural,
    volunteers,
    emptyMessage,
    isAdmin,
    onDeleteRequest,
}: Readonly<VolunteerSectionProps>) {
    const [query, setQuery] = useState('');
    const filtered = filterByName(volunteers, query);

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold">{title}</h3>

            <Input
                type="search"
                placeholder={`Search ${typePlural}`}
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {filtered.length === 0 ? (
                <EmptyState title={`No ${typePlural}`} description={emptyMessage} />
            ) : (
                <ul className="list-grid">
                    {filtered.map((v, idx) => {
                        const id = v.uri ? encodeURIComponent(v.uri) : `unknown-${idx}`;

                        return (
                            <li key={id} className="list-card pl-7 flex justify-between items-start">
                                <div>
                                    <div className="list-kicker">{v.type}</div>

                                    <Link href={`/volunteers/${id}`}>
                                        <div className="list-title font-medium hover:underline cursor-pointer">
                                            {v.name || 'Unknown'}
                                        </div>
                                    </Link>

                                    {v.emailAddress && (
                                        <div className="list-support">{v.emailAddress}</div>
                                    )}
                                </div>

                                {isAdmin && v.uri && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => onDeleteRequest({ name: v.name || "Unknown", uri: v.uri! })}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function VolunteersClient({
    judges,
    referees,
    floaters,
    isAdmin,
}: Readonly<VolunteersClientProps>) {
    const [selected, setSelected] = useState<{ name: string; uri: string } | null>(null);
    const router = useRouter();

    return (
        <div className="space-y-12">
            <VolunteerSection
                title="Judges"
                typePlural="judges"
                volunteers={judges}
                emptyMessage="No judges available"
                isAdmin={isAdmin}
                onDeleteRequest={setSelected}
            />
            <VolunteerSection
                title="Referees"
                typePlural="referees"
                volunteers={referees}
                emptyMessage="No referees available"
                isAdmin={isAdmin}
                onDeleteRequest={setSelected}
            />
            <VolunteerSection
                title="Floaters"
                typePlural="floaters"
                volunteers={floaters}
                emptyMessage="No floaters available"
                isAdmin={isAdmin}
                onDeleteRequest={setSelected}
            />

            {selected && (
                <DeleteVolunteerDialog
                    volunteer={selected}
                    onCancel={() => setSelected(null)}
                    onSuccess={() => {
                        setSelected(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}