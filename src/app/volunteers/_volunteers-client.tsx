'use client';

import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { VolunteerRole } from '@/types/volunteer';
import { useState } from 'react';
import Link from 'next/link';

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
}

interface VolunteerSectionProps {
    title: string;
    typePlural: string;
    volunteers: VolunteerItem[];
    emptyMessage: string;
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
                    {filtered.map((v) => {
                        const id = v.uri ? encodeURIComponent(v.uri) : '';

                        return (
                            <li key={id} className="list-card pl-7">
                                <div className="list-kicker">{v.type}</div>

                                <Link href={`/volunteers/${id}`}>
                                    <div className="list-title font-medium hover:underline cursor-pointer">
                                        {v.name || 'Unknown'}
                                    </div>
                                </Link>

                                {v.emailAddress && (
                                    <div className="list-support">{v.emailAddress}</div>
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
}: Readonly<VolunteersClientProps>) {
    return (
        <div className="space-y-12">
            <VolunteerSection
                title="Judges"
                typePlural="judges"
                volunteers={judges}
                emptyMessage="No judges available"
            />
            <VolunteerSection
                title="Referees"
                typePlural="referees"
                volunteers={referees}
                emptyMessage="No referees available"
            />
            <VolunteerSection
                title="Floaters"
                typePlural="floaters"
                volunteers={floaters}
                emptyMessage="No floaters available"
            />
        </div>
    );
}