"use client";

import { UsersService } from "@/api/userApi";
import { useAuth } from "@/app/components/authentication";
import { Avatar, AvatarFallback } from "@/app/components/avatar";
import { buttonVariants } from "@/app/components/button";
import { AUTH_COOKIE_NAME, clientAuthProvider } from "@/lib/authProvider";
import { cn } from "@/lib/utils";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { deleteCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Loginbar() {
    const router = useRouter();
    const { user, setUser } = useAuth();

    function logout() {
        deleteCookie(AUTH_COOKIE_NAME);
        localStorage.removeItem(AUTH_COOKIE_NAME);
        setUser(null);
        router.push("/");
    }

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const service = new UsersService(clientAuthProvider);
                const currentUser = await service.getCurrentUser();
                if (mounted) setUser(currentUser ?? null);
            } catch {
                if (mounted) setUser(null);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, [setUser]);

    if (user) {
        return (
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
                    <Avatar>
                        <AvatarFallback>
                            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                    {user.username ? (
                        <Link href={`/users/${user.username}`} className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">
                                {user.username}
                            </span>
                        </Link>
                    ) : (
                        <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                            User
                        </span>
                    )}
                </div>
                <button
                    onClick={logout}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Link
                href="/login"
                className={buttonVariants({ variant: "default", size: "sm" })}
            >
                Login
            </Link>
            { /* Registration is disabled because we currently do not allow external user registration.
            <Link
                href="/users/register"
                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
                Register
            </Link>
*/}
        </div>
    );
}
