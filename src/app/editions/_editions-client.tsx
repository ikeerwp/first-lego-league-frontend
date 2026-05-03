'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getEncodedResourceId } from '@/lib/halRoute';
import { Input } from '@/app/components/input';
import EmptyState from '@/app/components/empty-state';

export interface EditionItem {
    uri?: string;
    year?: number;
    venueName?: string;
    description?: string;
    state?: string;
}

function getEditionHref(edition: EditionItem) {
    const editionId = getEncodedResourceId(edition.uri);
    return editionId ? `/editions/${editionId}` : null;
}

function EditionCard({ edition }: Readonly<{ edition: EditionItem }>) {
    const href = getEditionHref(edition);
    const content = (
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
                <div className="list-kicker">Edition</div>
                <div className="list-title">{edition.year}</div>
                {edition.venueName && (
                    <div className="list-support">{edition.venueName}</div>
                )}
                {edition.description && (
                    <div className="list-support">{edition.description}</div>
                )}
            </div>
            {edition.state && (
                <div className="status-badge">{edition.state}</div>
            )}
        </div>
    );

    if (!href) {
        return <div className="list-card block h-full pl-7">{content}</div>;
    }

    return (
        <Link className="list-card block h-full pl-7 hover:text-primary" href={href}>
            {content}
        </Link>
    );
}

function filterEditions(editions: EditionItem[], query: string): EditionItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return editions;
    return editions.filter(e => e.venueName?.toLowerCase().includes(q));
}

export default function EditionsClient({ editions }: Readonly<{ editions: EditionItem[] }>) {
    const [query, setQuery] = useState('');
    const filtered = filterEditions(editions, query);

    return (
        <div className="space-y-4">
            <Input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by venue name..."
                aria-label="Search editions by venue name"
            />
            {filtered.length === 0 ? (
                <EmptyState
                    title="No editions found"
                    description={
                        query.trim()
                            ? `No editions match "${query.trim()}". Try a different venue name.`
                            : "There are currently no editions available to display."
                    }
                />
            ) : (
                <ul className="list-grid">
                    {filtered.map((edition, index) => (
                        <li key={edition.uri ?? index}>
                            <EditionCard edition={edition} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
