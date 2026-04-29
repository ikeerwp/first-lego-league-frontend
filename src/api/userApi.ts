import type { AuthStrategy } from "@/lib/authProvider";
import { User } from "@/types/user";
import { fetchHalCollection, fetchHalPagedCollection, fetchHalResource, createHalResource, patchHal, mergeHal, deleteHal } from "./halClient";
import type { HalPage } from "@/types/pagination";
import { Resource } from "halfred";
import { ApiError } from "@/types/errors";

export type CreateUserPayload = {
    username: string;
    email: string;
    password: string;
};

export class UsersService {
    constructor(private readonly authStrategy: AuthStrategy) {
    }

    async getUsers(): Promise<User[]> {
        return fetchHalCollection<User>('/users', this.authStrategy, 'users');
    }

    async getUsersPaged(page: number, size: number): Promise<HalPage<User>> {
        return fetchHalPagedCollection<User>('/users', this.authStrategy, 'users', page, size);
    }

    async getUserById(id: string): Promise<User> {
        const userId = encodeURIComponent(id);
        return fetchHalResource<User>(`/users/${userId}`, this.authStrategy);
    }

    async getCurrentUser(): Promise<User | null> {
        if (!await this.authStrategy.getAuth()) {
            return null;
        }
        return fetchHalResource<User>('/identity', this.authStrategy);
    }

    async createUser(user: CreateUserPayload): Promise<User> {
        const payload = {
            id: user.username,
            email: user.email,
            password: user.password,
        };

        return createHalResource<User>('/users', payload, this.authStrategy, 'user');
    }

    async createAdministrator(user: CreateUserPayload): Promise<User> {
        const payload = {
            id: user.username,
            email: user.email,
            password: user.password,
        };

        return createHalResource<User>('/administrators', payload, this.authStrategy, 'administrator');
    }

    async patchUser(id: string, data: Partial<Pick<User, 'email' | 'password'>>): Promise<User> {
        const userId = encodeURIComponent(id);
        const resource = await patchHal(`/users/${userId}`, data as Resource, this.authStrategy);
        if (!resource) {
            throw new ApiError('No response from server after update', 500, true);
        }
        return mergeHal<User>(resource);
    }

    async deleteUser(id: string): Promise<void> {
        const userId = encodeURIComponent(id);
        await deleteHal(`/users/${userId}`, this.authStrategy);
    }
}
