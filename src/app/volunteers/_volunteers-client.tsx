'use client';

import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { VolunteerRole } from '@/types/volunteer';
import { useState } from 'react';

export interface VolunteerItem {
    name?: string;
    emailAddress?: string;
    type?: VolunteerRole;
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

function VolunteerSection({ title, typePlural, volunteers, emptyMessage }: Readonly<VolunteerSectionProps>) {
    const [query, setQuery] = useState('');
    const filtered = filterByName(volunteers, query);

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
            <Input
                type="search"
                placeholder={`Search ${typePlural} by name...`}
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label={`Search ${typePlural}`}
            />
            {filtered.length === 0 ? (
                <EmptyState
                    title={query ? `No ${typePlural} match "${query}"` : `No ${typePlural} found`}
                    description={query ? 'Try a different search term.' : emptyMessage}
                />
            ) : (
                <ul className="list-grid">
                    {filtered.map((v, idx) => {
                        const id = v.name ? `${v.type}-${v.name}-${idx}` : `${v.type}-${idx}`;
                        return (
                            <li key={id} className="list-card pl-7">
                                <div className="list-kicker">{v.type}</div>
                                <div className="list-title block font-medium">{v.name || 'Unknown'}</div>
                                {v.emailAddress && <div className="list-support">{v.emailAddress}</div>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function VolunteersClient({ judges, referees, floaters }: Readonly<VolunteersClientProps>) {
    return (
        <div className="space-y-12 shrink-0">
            <VolunteerSection
                title="Judges"
                typePlural="judges"
                volunteers={judges}
                emptyMessage="There are currently no judges registered for the competition."
            />
            <VolunteerSection
                title="Referees"
                typePlural="referees"
                volunteers={referees}
                emptyMessage="There are currently no referees registered for the competition."
            />
            <VolunteerSection
                title="Floaters"
                typePlural="floaters"
                volunteers={floaters}
                emptyMessage="There are currently no floaters registered for the competition."
            />
        </div>
    );
}
