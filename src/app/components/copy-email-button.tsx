"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyEmailButtonProps {
    readonly email: string;
}

export default function CopyEmailButton({ email }: CopyEmailButtonProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Clipboard copy failed:", e);
            setCopied(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied!" : `Copy email ${email}`}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
            {copied ? (
                <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-xs text-green-600">Copied!</span>
                </>
            ) : (
                <Copy className="h-3.5 w-3.5" />
            )}
        </button>
    );
}