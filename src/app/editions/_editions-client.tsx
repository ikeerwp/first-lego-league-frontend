'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/app/components/empty-state';
import { Input } from '@/app/components/input';
import { ArrowUpRight, CalendarRange, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getEncodedResourceId } from '@/lib/halRoute';
import type { LucideIcon } from 'lucide-react';

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

function getEditionDisplayYear(edition: EditionItem) {
    return edition.year !== undefined ? String(edition.year) : 'TBD';
}

function formatEditionState(state?: string) {
    if (!state?.trim()) {
        return null;
    }

    return state
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function normalizeEditionState(state?: string) {
    if (!state?.trim()) {
        return 'unknown';
    }

    return state.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function getUniqueValueCount(values: Array<string | null | undefined>) {
    return new Set(
        values
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value)),
    ).size;
}

function getLatestEditionYear(editions: EditionItem[]) {
    const years = editions
        .map((edition) => edition.year)
        .filter((year): year is number => typeof year === 'number');

    if (years.length === 0) {
        return null;
    }

    return Math.max(...years);
}

function StatCard({
    icon: Icon,
    label,
    value,
    description,
}: Readonly<{
    icon: LucideIcon;
    label: string;
    value: string;
    description: string;
}>) {
    return (
        <div className="editions-page-stat-card">
            <div className="editions-page-stat-card__inner">
                <div className="editions-page-stat-card__header">
                    <div className="editions-page-stat-card__copy">
                        <div className="editions-page-stat-card__label">{label}</div>
                        <div className="editions-page-stat-card__value">{value}</div>
                    </div>
                    <div className="editions-page-stat-card__icon">
                        <Icon aria-hidden="true" />
                    </div>
                </div>
                <p className="editions-page-stat-card__description">{description}</p>
            </div>
        </div>
    );
}

function EditionCard({ edition }: Readonly<{ edition: EditionItem }>) {
    const href = getEditionHref(edition);
    const formattedState = formatEditionState(edition.state);
    const hasFacts = Boolean(edition.venueName || formattedState);

    const card = (
        <article
            className="editions-page-edition-card"
            data-state={normalizeEditionState(edition.state)}
        >
            <div className="editions-page-edition-card__body">
                <div className="editions-page-edition-card__masthead">
                    <div className="editions-page-edition-card__serial">Edition archive</div>
                    {formattedState && (
                        <div className="editions-page-edition-card__badge">{formattedState}</div>
                    )}
                </div>

                <div className="editions-page-edition-card__header">
                    <div className="editions-page-edition-card__kicker">Season</div>
                    <h3 className="editions-page-edition-card__title">
                        {getEditionDisplayYear(edition)}
                    </h3>
                </div>

                {hasFacts && (
                    <div className="editions-page-edition-card__facts">
                        {edition.venueName && (
                            <div className="editions-page-edition-card__fact">
                                <div className="editions-page-edition-card__fact-label">Venue</div>
                                <div className="editions-page-edition-card__fact-value">
                                    {edition.venueName}
                                </div>
                            </div>
                        )}
                        {formattedState && (
                            <div className="editions-page-edition-card__fact">
                                <div className="editions-page-edition-card__fact-label">State</div>
                                <div className="editions-page-edition-card__fact-value">
                                    {formattedState}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {edition.description && (
                    <div className="editions-page-edition-card__summary">
                        <div className="editions-page-edition-card__summary-label">Edition brief</div>
                        <p className="editions-page-edition-card__summary-copy">
                            {edition.description}
                        </p>
                    </div>
                )}

                <div className="editions-page-edition-card__footer">
                    <div
                        className={
                            href
                                ? 'editions-page-edition-card__action editions-page-edition-card__action--interactive'
                                : 'editions-page-edition-card__action editions-page-edition-card__action--disabled'
                        }
                    >
                        {href ? 'View details' : 'Profile unavailable'}
                        {href && <ArrowUpRight aria-hidden="true" />}
                    </div>
                </div>
            </div>
        </article>
    );

    return href ? (
        <Link className="editions-page-link" href={href}>
            {card}
        </Link>
    ) : (
        <div className="editions-page-link">{card}</div>
    );
}

export default function EditionsClient({
    editions,
    initialSearch = '',
    initialState = '',
    allStates = [],
}: Readonly<{
    editions: EditionItem[];
    initialSearch?: string;
    initialState?: string;
    allStates?: string[];
}>) {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState(initialSearch);
    const [stateValue, setStateValue] = useState(initialState);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function updateParams(newQuery: string, newState: string) {
        const params = new URLSearchParams();
        if (newQuery) params.set('search', newQuery);
        if (newState) params.set('state', newState);
        router.push(params.toString() ? `/editions?${params}` : '/editions');
    }

    function handleSearchChange(value: string) {
        setSearchValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateParams(value, stateValue);
        }, 300);
    }

    const venueCount = getUniqueValueCount(editions.map((edition) => edition.venueName));
    const stateCount = getUniqueValueCount(editions.map((edition) => edition.state));
    const latestEditionYear = getLatestEditionYear(editions);

    return (
        <div className="space-y-8">
            <div className="editions-page-search-card">
                <div className="editions-page-search-card__field">
                    <span className="editions-page-search-card__label">
                        Search by year, venue or state
                    </span>
                    <div className="flex gap-3">
                        <Input
                            type="search"
                            value={searchValue}
                            onChange={(event) => handleSearchChange(event.target.value)}
                            placeholder="Search editions..."
                            aria-label="Search editions by year, venue or state"
                            className="editions-page-search-input"
                        />
                        <select
                            value={stateValue}
                            onChange={(e) => {
                                setStateValue(e.target.value);
                                updateParams(searchValue, e.target.value);
                            }}
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Filter by state"
                        >
                            <option value="">All states</option>
                            {allStates.map((s) => (
                                <option key={s} value={s}>
                                    {formatEditionState(s)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="editions-page-stats-grid">
                <StatCard
                    icon={CalendarRange}
                    label="Seasons in view"
                    value={String(editions.length)}
                    description={
                        editions.length > 0
                            ? 'The visible archive is organized as editorial season cards.'
                            : 'No season matches the current search.'
                    }
                />
                <StatCard
                    icon={MapPin}
                    label="Venues listed"
                    value={String(venueCount)}
                    description={
                        venueCount > 0
                            ? 'Distinct host locations currently visible in the archive.'
                            : 'Venue data is not present in the current results.'
                    }
                />
                <StatCard
                    icon={Sparkles}
                    label="States tracked"
                    value={String(stateCount)}
                    description={
                        latestEditionYear !== null
                            ? `Latest visible season: ${latestEditionYear}.`
                            : 'Season metadata is not available in the current results.'
                    }
                />
            </div>

            {editions.length === 0 ? (
                <EmptyState
                    title="No editions found"
                    description={
                        initialSearch.trim()
                            ? `No editions match "${initialSearch}". Try a different year, venue or state.`
                            : initialState
                                ? `No editions found for the selected state. Try a different year, venue or state.`
                                : 'There are currently no editions available to display.'
                    }
                />
            ) : (
                <ul className="editions-page-grid">
                    {editions.map((edition, index) => (
                        <li key={edition.uri ?? index} className="editions-page-item">
                            <EditionCard edition={edition} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}