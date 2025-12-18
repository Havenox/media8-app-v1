/**
 * Media 8 - Shared Pagination Logic
 * 
 * Centralizes the calculation of the next page for Infinite Scroll.
 * Implements the "Array Length" strategy: if we received fewer items 
 * than requested, we reached the end.
 * 
 * @param lastPage - The response from the last fetch (Array or { data: [] })
 * @param allPages - Array of all pages fetched so far
 * @param pageSize - The requested page size
 * @returns The next page number or undefined if reached the end
 */
export const getNextPageParam = <T>(
    lastPage: T[] | { data: T[] },
    allPages: unknown[],
    pageSize: number
): number | undefined => {
    // Normalize: Extract data array regardless of format
    // Handles generic API response formats (Direct Array vs Wrapped Object)
    const lastPageData = Array.isArray(lastPage)
        ? lastPage
        : (lastPage as any).data || [];

    // Robust Logic: If the page is incomplete (less than expected), we are done.
    if (lastPageData.length < pageSize) {
        return undefined;
    }

    // Otherwise, assume next page exists
    return allPages.length + 1;
};
