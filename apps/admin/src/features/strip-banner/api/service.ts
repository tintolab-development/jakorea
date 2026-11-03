import type { StripBanner, StripBannerCreateInput, StripBannerListFilter, StripBannerUpdateInput, } from '@/entities/strip-banner/model/types';
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api';
import { mapStripResponseToDomain, toBulkDeleteRequest, toReorderRequest, toStripCreateRequest, toStripListParams, toStripUpdateRequest, toToggleRequest, } from './mappers';
function mainApi() {
    return getJAKoreaHomepageAdminAPIMainSubset();
}
async function listRemoteStripBanners(filter?: StripBannerListFilter): Promise<StripBanner[]> {
    const response = await mainApi().list3(toStripListParams(filter));
    return (response.items ?? []).map(mapStripResponseToDomain);
}
async function resolveCurrentRows(cachedRows?: StripBanner[]): Promise<StripBanner[]> {
    if (cachedRows && cachedRows.length > 0) {
        return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return listRemoteStripBanners();
}
export async function listStripBannersService(filter?: StripBannerListFilter): Promise<StripBanner[]> {
    return listRemoteStripBanners(filter);
}
export async function createStripBannerService(input: StripBannerCreateInput): Promise<StripBanner> {
    const created = await mainApi().create4(toStripCreateRequest(input));
    return mapStripResponseToDomain(created);
}
export async function updateStripBannerService(id: string, patch: StripBannerUpdateInput, cachedRows?: StripBanner[]): Promise<StripBanner> {
    const rows = await resolveCurrentRows(cachedRows);
    const current = rows.find(row => row.id === id);
    if (!current) {
        throw new Error(`StripBanner not found: ${id}`);
    }
    const updated = await mainApi().update4(Number(id), toStripUpdateRequest(current, patch));
    return mapStripResponseToDomain(updated);
}
export async function removeStripBannersService(ids: string[], cachedRows?: StripBanner[]): Promise<void> {
    if (ids.length === 0)
        return;
    const currentRows = await resolveCurrentRows(cachedRows);
    const idSet = new Set(ids);
    const rows = currentRows.filter(row => idSet.has(row.id));
    if (rows.length === 0)
        return;
    await mainApi().bulkDelete(toBulkDeleteRequest(rows));
    return;
}
export async function reorderStripBannersService(orderedIds: string[], cachedRows?: StripBanner[]): Promise<StripBanner[]> {
    const byId = new Map((await resolveCurrentRows(cachedRows)).map(row => [row.id, row]));
    const ordered: StripBanner[] = [];
    for (const id of orderedIds) {
        const row = byId.get(id);
        if (row) {
            ordered.push(row);
            byId.delete(id);
        }
    }
    for (const row of byId.values()) {
        ordered.push(row);
    }
    const updated = await mainApi().reorder(toReorderRequest(ordered));
    return updated.map(mapStripResponseToDomain);
}
export async function setStripBannerActiveService(id: string, isActive: boolean, cachedRows?: StripBanner[]): Promise<StripBanner> {
    const rows = await resolveCurrentRows(cachedRows);
    const current = rows.find(row => row.id === id);
    if (!current) {
        throw new Error(`StripBanner not found: ${id}`);
    }
    const updated = await mainApi().toggle1(Number(id), toToggleRequest(current, isActive));
    return mapStripResponseToDomain(updated);
}
