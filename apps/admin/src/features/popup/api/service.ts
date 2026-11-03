import type { Popup, PopupCreateInput, PopupListFilter, PopupUpdateInput, } from '@/entities/popup/model/types';
import { customInstance } from '@/shared/api/orval-mutator';
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api';
import type { PopupListResponse } from '@/shared/api/generated/main/schemas/popupListResponse';
import { mapPopupResponseToDomain, toBulkDeleteRequest, toPopupCreateRequest, toPopupListParams, toPopupUpdateRequest, toReorderRequest, toToggleRequest, } from './mappers';
import { uploadPopupImageAsset } from './upload-popup-image';
function mainApi() {
    return getJAKoreaHomepageAdminAPIMainSubset();
}
async function listRemotePopups(filter?: PopupListFilter): Promise<Popup[]> {
    const response = await customInstance<PopupListResponse>({
        url: '/api/admin/main/popups',
        method: 'GET',
        params: toPopupListParams(filter),
    });
    return (response.items ?? []).map(mapPopupResponseToDomain);
}
async function resolveCurrentRows(cachedRows?: Popup[]): Promise<Popup[]> {
    if (cachedRows && cachedRows.length > 0) {
        return [...cachedRows].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return listRemotePopups();
}
async function resolveImageAssetIdForCreate(input: PopupCreateInput): Promise<number> {
    if (input.imageFile) {
        return uploadPopupImageAsset(input.imageFile);
    }
    if (input.imageAssetId != null) {
        return input.imageAssetId;
    }
    throw new Error('팝업 이미지를 등록해 주세요.');
}
async function resolveImageAssetIdForUpdate(current: Popup, patch: PopupUpdateInput): Promise<number> {
    if (patch.imageFile) {
        return uploadPopupImageAsset(patch.imageFile);
    }
    if (patch.imageAssetId != null) {
        return patch.imageAssetId;
    }
    if (current.imageAssetId != null) {
        return current.imageAssetId;
    }
    throw new Error('팝업 이미지 asset이 없습니다. 이미지를 다시 등록해 주세요.');
}
export async function listPopupsService(filter?: PopupListFilter): Promise<Popup[]> {
    return listRemotePopups(filter);
}
export async function createPopupService(input: PopupCreateInput): Promise<Popup> {
    const imageAssetId = await resolveImageAssetIdForCreate(input);
    const created = await mainApi().create5(toPopupCreateRequest(input, imageAssetId));
    return mapPopupResponseToDomain(created);
}
export async function updatePopupService(id: string, patch: PopupUpdateInput, cachedRows?: Popup[]): Promise<Popup> {
    const rows = await resolveCurrentRows(cachedRows);
    const current = rows.find(row => row.id === id);
    if (!current) {
        throw new Error(`Popup not found: ${id}`);
    }
    const imageAssetId = await resolveImageAssetIdForUpdate(current, patch);
    const updated = await mainApi().update6(Number(id), toPopupUpdateRequest(current, patch, imageAssetId));
    return mapPopupResponseToDomain(updated);
}
export async function removePopupsService(ids: string[], cachedRows?: Popup[]): Promise<void> {
    if (ids.length === 0)
        return;
    const idSet = new Set(ids);
    const rows = (await resolveCurrentRows(cachedRows)).filter(row => idSet.has(row.id));
    if (rows.length === 0)
        return;
    await mainApi().bulkDelete1(toBulkDeleteRequest(rows));
    return;
}
export async function reorderPopupsService(orderedIds: string[], cachedRows?: Popup[]): Promise<Popup[]> {
    const byId = new Map((await resolveCurrentRows(cachedRows)).map(row => [row.id, row]));
    const ordered: Popup[] = [];
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
    const updated = await mainApi().reorder1(toReorderRequest(ordered));
    return updated.map(mapPopupResponseToDomain);
}
export async function setPopupActiveService(id: string, isActive: boolean, cachedRows?: Popup[]): Promise<Popup> {
    const rows = await resolveCurrentRows(cachedRows);
    const current = rows.find(row => row.id === id);
    if (!current) {
        throw new Error(`Popup not found: ${id}`);
    }
    const updated = await mainApi().toggle2(Number(id), toToggleRequest(current, isActive));
    return mapPopupResponseToDomain(updated);
}
