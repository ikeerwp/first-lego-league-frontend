"use client";

import CopyEmailButton from "@/app/components/copy-email-button";

interface Coach {
    name?: string | null;
    emailAddress?: string | null;
}

interface CoachesDisplayProps {
    readonly coaches: Coach[];
}

export default function CoachesDisplay({ coaches }: CoachesDisplayProps) {
    if (coaches.length === 0) {
        return (
            <p>
                <strong>Coach:</strong> No coach assigned
            </p>
        );
    }

    return (
        <div className="space-y-1">
            {coaches.map((coach, index) => (
                <div key={index} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <strong>Coach:</strong>
                    <span>{coach.name ?? coach.emailAddress ?? "Unnamed coach"}</span>
                    {coach.emailAddress && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                            {coach.emailAddress}
                            <CopyEmailButton email={coach.emailAddress} />
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}