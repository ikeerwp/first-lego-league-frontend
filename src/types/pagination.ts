export interface HalPage<T> {
    items: T[];
    hasNext: boolean;
    hasPrev: boolean;
    currentPage: number;
}
