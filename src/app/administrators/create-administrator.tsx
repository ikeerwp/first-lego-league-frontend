"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@/app/components/label";
import { UsersService } from "@/api/userApi";
import { clientAuthProvider } from "@/lib/authProvider";
import { parseErrorMessage } from "@/types/errors";

export default function CreateAdministrator() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!username || !email || !password) {
            setError("All fields are required.");
            return;
        }

        const emailRegex = /^[\w\-.]+@([\w-]+\.)+[\w-]{2,}$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);

        try {
            const service = new UsersService(clientAuthProvider);
            await service.createAdministrator({ username, email, password });
            setSuccessMessage(`Administrator ${username} created successfully.`);
            setUsername("");
            setEmail("");
            setPassword("");
            setIsOpen(false);
            router.refresh();
        } catch (e) {
            setError(parseErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="mb-6">
                <Button onClick={() => setIsOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create administrator
                </Button>
                {successMessage && (
                    <div className="mt-4 flex items-center gap-3 border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                        {successMessage}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-medium">Create Administrator</h3>
                <p className="text-sm text-muted-foreground">Add a new administrator to the system.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. admin_jdoe"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. admin@example.com"
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create administrator"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setIsOpen(false);
                            setError(null);
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
