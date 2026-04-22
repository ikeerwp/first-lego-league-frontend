import { User } from "@/types/user";

export function isAdmin(user: User | null) {
    return !!user?.authorities?.some(
        (authority) => authority.authority === "ROLE_ADMIN"
    );
}

export function isReferee(user: User | null) {
    return !!user?.authorities?.some(
        (authority) => authority.authority === "ROLE_REFEREE"
    );
}
