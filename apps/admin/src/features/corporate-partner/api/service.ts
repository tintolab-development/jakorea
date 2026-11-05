import axios from 'axios';
import type { CorporatePartner, CorporatePartnerCreateInput, CorporatePartnerListFilter, CorporatePartnerListResult, CorporatePartnerUpdateInput, } from '@/entities/corporate-partner/model/types';
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api';
import { isOptimisticLockConflictError } from '@/shared/lib/api-error-message';
import { LIST_PAGE_SIZE, mapSponsorListItemToDomain, mapSponsorResponseToDomain, toBulkDeleteRequest, toPublishedToggleRequest, toSponsorCreateRequest, toSponsorListParams, toSponsorUpdateRequest, } from './mappers';
import { uploadSponsorLogoAsset } from './upload-logo';
function sponsorshipApi() {
    return getJAKoreaHomepageAdminAPISponsorshipSubset();
}
/** list 응답에 logoAssetId가 없어 reorder/update 시 detail GET을 줄이기 위한 메모리 캐시 */
const logoAssetIdByPartnerId = new Map<string, number>();
function rememberLogoAssetId(partner: Pick<CorporatePartner, 'id' | 'logoAssetId'>) {
    if (partner.logoAssetId != null && partner.id) {
        logoAssetIdByPartnerId.set(partner.id, partner.logoAssetId);
    }
}
function logoAssetIdFromCache(id: string): number | undefined {
    return logoAssetIdByPartnerId.get(id);
}
function sortPartnersByOrder(rows: CorporatePartner[]): CorporatePartner[] {
    return [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
}
function isSponsorLockConflict(error: unknown): boolean {
    if (isOptimisticLockConflictError(error))
        return true;
    return axios.isAxiosError(error) && error.response?.status === 409;
}
async function listRemotePartners(filter?: CorporatePartnerListFilter): Promise<CorporatePartnerListResult> {
    const response = await sponsorshipApi().list2(toSponsorListParams(filter));
    return {
        items: sortPartnersByOrder((response.items ?? []).map(mapSponsorListItemToDomain)),
        totalCount: response.totalCount ?? response.items?.length ?? 0,
    };
}
async function listAllRemotePartners(): Promise<CorporatePartner[]> {
    const acc: CorporatePartner[] = [];
    let page = 0;
    let totalCount = Number.POSITIVE_INFINITY;
    while (acc.length < totalCount) {
        const response = await sponsorshipApi().list2({ page, size: LIST_PAGE_SIZE });
        const chunk = (response.items ?? []).map(mapSponsorListItemToDomain);
        totalCount = response.totalCount ?? acc.length + chunk.length;
        if (chunk.length === 0)
            break;
        acc.push(...chunk);
        page += 1;
        if (page > 200)
            break;
    }
    return sortPartnersByOrder(acc);
}
export async function getCorporatePartnerById(id: string): Promise<CorporatePartner> {
    return getRemotePartner(id);
}
async function getRemotePartner(id: string): Promise<CorporatePartner> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
        throw new Error(`Corporate partner not found: ${id}`);
    }
    const mapped = mapSponsorResponseToDomain(await sponsorshipApi().get(numericId));
    rememberLogoAssetId(mapped);
    return mapped;
}
async function resolveLogoAssetIdForCreate(input: CorporatePartnerCreateInput): Promise<number> {
    if (input.logoFile) {
        return uploadSponsorLogoAsset(input.logoFile);
    }
    if (input.logoAssetId != null) {
        return input.logoAssetId;
    }
    throw new Error('LOGO_REQUIRED');
}
async function resolveLogoAssetIdForUpdate(current: CorporatePartner, patch: CorporatePartnerUpdateInput): Promise<number> {
    if (patch.logoFile) {
        return uploadSponsorLogoAsset(patch.logoFile);
    }
    if (patch.logoAssetId != null) {
        return patch.logoAssetId;
    }
    if (current.logoAssetId != null) {
        return current.logoAssetId;
    }
    const cached = logoAssetIdFromCache(current.id);
    if (cached != null)
        return cached;
    const detail = await getRemotePartner(current.id);
    if (detail.logoAssetId == null) {
        throw new Error('LOGO_REQUIRED');
    }
    return detail.logoAssetId;
}
function resolveCurrentRow(id: string, cachedRows?: CorporatePartner[]): CorporatePartner | undefined {
    return cachedRows?.find(row => row.id === id);
}
export async function listCorporatePartnersService(filter?: CorporatePartnerListFilter): Promise<CorporatePartnerListResult> {
    return listRemotePartners(filter);
}
export async function countCorporatePartnersService(): Promise<number> {
    const response = await listRemotePartners();
    return response.totalCount;
}
export async function createCorporatePartnerService(input: CorporatePartnerCreateInput): Promise<CorporatePartner> {
    const name = input.name.trim();
    if (!name)
        throw new Error('NAME_REQUIRED');
    const logoAssetId = await resolveLogoAssetIdForCreate(input);
    const created = await sponsorshipApi().create3(toSponsorCreateRequest(input, logoAssetId));
    const mapped = mapSponsorResponseToDomain(created);
    rememberLogoAssetId(mapped);
    return mapped;
}
async function putSponsorUpdate(id: string, current: CorporatePartner, patch: CorporatePartnerUpdateInput, logoAssetId: number): Promise<CorporatePartner> {
    try {
        const updated = await sponsorshipApi().update(Number(id), toSponsorUpdateRequest(current, patch, logoAssetId));
        const mapped = mapSponsorResponseToDomain(updated);
        rememberLogoAssetId(mapped);
        return mapped;
    }
    catch (error) {
        if (!isSponsorLockConflict(error))
            throw error;
        const fresh = await getRemotePartner(id);
        const nextLogo = await resolveLogoAssetIdForUpdate(fresh, patch);
        const retried = await sponsorshipApi().update(Number(id), toSponsorUpdateRequest(fresh, patch, nextLogo));
        const mapped = mapSponsorResponseToDomain(retried);
        rememberLogoAssetId(mapped);
        return mapped;
    }
}
export async function updateCorporatePartnerService(id: string, patch: CorporatePartnerUpdateInput, cachedRows?: CorporatePartner[]): Promise<CorporatePartner> {
    const current = resolveCurrentRow(id, cachedRows) ?? (await getRemotePartner(id));
    const logoAssetId = await resolveLogoAssetIdForUpdate(current, patch);
    return putSponsorUpdate(id, current, patch, logoAssetId);
}
export async function removeCorporatePartnersService(ids: string[], cachedRows?: CorporatePartner[]): Promise<void> {
    if (ids.length === 0)
        return;
    const idSet = new Set(ids);
    let rows = (cachedRows ?? []).filter(row => idSet.has(row.id));
    if (rows.length === 0) {
        const listed = await listRemotePartners();
        rows = listed.items.filter(row => idSet.has(row.id));
    }
    if (rows.length === 0)
        return;
    await sponsorshipApi().delete1(toBulkDeleteRequest(rows));
    return;
}
/**
 * BE update의 displayOrder shift와 동일하게 로컬 목록을 맞춘다.
 * 밀린 행 version은 JPA @Version +1 가정 — list 재조회 없이 다음 mutation에 사용.
 */
function applyLocalReorderAfterMove(rows: CorporatePartner[], movedId: string, newOrder: number, movedAfter: CorporatePartner): CorporatePartner[] {
    const sorted = sortPartnersByOrder(rows);
    const moving = sorted.find(row => row.id === movedId);
    if (!moving) {
        return sorted.map(row => (row.id === movedId ? movedAfter : row));
    }
    const oldOrder = moving.sortOrder;
    if (oldOrder === newOrder) {
        return sorted.map(row => row.id === movedId ? { ...movedAfter, sortOrder: newOrder } : row);
    }
    return sortPartnersByOrder(sorted.map(row => {
        if (row.id === movedId) {
            return { ...movedAfter, sortOrder: newOrder };
        }
        let order = row.sortOrder;
        let shifted = false;
        if (newOrder < oldOrder && order >= newOrder && order < oldOrder) {
            order += 1;
            shifted = true;
        }
        else if (newOrder > oldOrder && order > oldOrder && order <= newOrder) {
            order -= 1;
            shifted = true;
        }
        if (!shifted)
            return row;
        return { ...row, sortOrder: order, version: row.version + 1 };
    }));
}
async function ensurePartnerForUpdate(row: CorporatePartner): Promise<CorporatePartner> {
    const cachedLogoId = row.logoAssetId ?? logoAssetIdFromCache(row.id);
    if (cachedLogoId != null) {
        return row.logoAssetId == null ? { ...row, logoAssetId: cachedLogoId } : row;
    }
    const detail = await getRemotePartner(row.id);
    rememberLogoAssetId(detail);
    return {
        ...row,
        logoAssetId: detail.logoAssetId,
        logoFileName: detail.logoFileName ?? row.logoFileName,
        logoUrl: detail.logoUrl || row.logoUrl,
        // detail이 더 최신 version일 수 있음
        version: detail.version,
    };
}
/**
 * BE `update`는 displayOrder 변경 시 인접 행 order·version을 함께 밀어 올린다.
 * 여러 건 연속 PUT → 409 이므로 이동 1건만 PUT하고, 나머지는 로컬 shift로 맞춘다.
 * (캐시 우선 — 불필요한 list GET 금지)
 */
export async function reorderCorporatePartnersService(orderedIds: string[], cachedRows?: CorporatePartner[]): Promise<CorporatePartner[]> {
    const cacheSorted = cachedRows?.length ? sortPartnersByOrder(cachedRows) : null;
    const cacheCoversOrdered = cacheSorted != null &&
        orderedIds.every(id => cacheSorted.some(row => row.id === id));
    // 전체 목록이 캐시에 있으면 GET 생략. 필터 부분 목록만 있으면 1회 GET.
    let fullSorted: CorporatePartner[];
    if (cacheSorted &&
        cacheCoversOrdered &&
        (cacheSorted.length === orderedIds.length || cacheSorted.length > orderedIds.length)) {
        fullSorted = cacheSorted;
    }
    else {
        fullSorted = await listAllRemotePartners();
    }
    const fullIds = fullSorted.map(row => row.id);
    const orderedSet = new Set(orderedIds);
    let targetIds: string[];
    if (orderedIds.length === fullIds.length &&
        orderedIds.every(id => orderedSet.has(id)) &&
        fullIds.every(id => orderedSet.has(id))) {
        targetIds = orderedIds;
    }
    else {
        let cursor = 0;
        targetIds = fullIds.map(id => {
            if (orderedSet.has(id)) {
                return orderedIds[cursor++] ?? id;
            }
            return id;
        });
    }
    const currentIds = fullSorted.map(row => row.id);
    if (currentIds.length === targetIds.length &&
        currentIds.every((id, index) => id === targetIds[index])) {
        return fullSorted.map((row, index) => row.sortOrder === index + 1 ? row : { ...row, sortOrder: index + 1 });
    }
    let movedId: string | null = null;
    let targetOrder = 0;
    for (let index = 0; index < targetIds.length; index += 1) {
        if (currentIds[index] !== targetIds[index]) {
            movedId = targetIds[index]!;
            targetOrder = index + 1;
            break;
        }
    }
    if (!movedId)
        return fullSorted;
    const moving = fullSorted.find(row => row.id === movedId);
    if (!moving) {
        throw new Error(`Corporate partner not found: ${movedId}`);
    }
    if (moving.sortOrder === targetOrder) {
        return fullSorted;
    }
    const prepared = await ensurePartnerForUpdate(moving);
    if (prepared.logoAssetId == null) {
        throw new Error('LOGO_REQUIRED');
    }
    const mapped = await putSponsorUpdate(movedId, prepared, { sortOrder: targetOrder }, prepared.logoAssetId);
    return applyLocalReorderAfterMove(fullSorted, movedId, targetOrder, mapped);
}
export async function setCorporatePartnerPublicService(id: string, isPublic: boolean, cachedRows?: CorporatePartner[]): Promise<CorporatePartner> {
    const current = resolveCurrentRow(id, cachedRows) ?? (await getRemotePartner(id));
    const updated = await sponsorshipApi().toggle(Number(id), toPublishedToggleRequest(current, isPublic));
    const mapped = mapSponsorResponseToDomain(updated);
    rememberLogoAssetId(mapped);
    return mapped;
}
