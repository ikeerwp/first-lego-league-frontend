"use client";

import { useAuth } from "@/app/components/authentication";
import EditionSelector from "@/app/components/edition-selector";
import Loginbar from "@/app/components/loginbar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function toggleTheme() {
    const html = document.documentElement;

    if (html.classList.contains("dark")) {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
        return;
    }

    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
}

export default function Navbar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentYear = searchParams.get("year");
    const { user } = useAuth();

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/users", label: "Users", roles: ["ROLE_USER"] },
        { href: "/teams", label: "Teams" },
        { href: "/editions", label: "Editions" },
        { href: "/volunteers", label: "Volunteers" },
        { href: "/scientific-projects", label: "Scientific Projects" },
        { href: "/matches", label: "Matches" },
        { href: "/administrators", label: "Administrators", roles: ["ROLE_ADMIN"] }
    ];



    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="mr-auto flex min-w-0 items-center gap-3">
                    <span className="block h-8 w-1 bg-primary" />
                    <div className="min-w-0">
                        <div className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Catalunya Robotics
                        </div>
                        <div className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">
                            First LEGO League
                        </div>
                    </div>
                </Link>

                <div className="order-3 flex w-full flex-wrap items-center gap-1 lg:order-2 lg:w-auto lg:flex-1 lg:justify-center">
                    {navLinks
                        .filter(({ roles }) =>
                            !roles || user?.authorities?.some(
                                userAuth => roles.includes(userAuth.authority)))
                        .map(({ href, label }) => {
                            const active = href === "/"
                                ? pathname === "/"
                                : pathname === href || pathname.startsWith(`${href}/`);
                            const hrefWithYear = currentYear
                                    ? `${href}?year=${encodeURIComponent(currentYear)}`
                                    : href;
                            return (
                                <Link
                                    key={href}
                                    href={hrefWithYear}
                                    className={
                                        active
                                            ? "border-b-2 border-accent px-4 py-2 text-sm font-medium text-accent"
                                            : "border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                    }
                                >
                                    {label}
                                </Link>
                            );
                        })}
                </div>

                <div className="order-2 flex items-center gap-3 lg:order-3">
                    <Suspense fallback={null}>
                        <EditionSelector />
                    </Suspense>
                    <Loginbar />
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                    >
                        <span className="dark:hidden">🌙</span>
                        <span className="hidden dark:inline">☀️</span>
                    </button>

                </div>
            </div>
        </nav>
    );
}
