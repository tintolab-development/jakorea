import type { ImpactStory, ImpactStoryAttachment, ImpactStoryCategory, ImpactStoryCreateInput, ImpactStoryListFilter, ImpactStoryUpdateInput, } from '@/entities/impact-stories/model/types';
import { getJAKoreaHomepageAdminAPIImpactStorySubset } from '@/shared/api/generated/impact-story/impact-story-api';
import { PinLimitError } from '@/features/impact-stories/lib/pin-limits';
import { normalizeCategoryListPayload, normalizeCategoryPayload, } from './category-payload';
import { isPersistedCategoryId, mapCategoryResponseToDomain, mapStoryListItemToDomain, mapStoryResponseToDomain, requireThumbnailAssetId, resolvePrimaryAttachmentAssetId, toBulkDeleteRequest, toCategoryCreateRequest, toCategoryUpdateRequest, toPublishedToggleRequest, LIST_PAGE_SIZE, toStoryCreateRequest, toStoryListParams, toStoryUpdateRequest, } from './mappers';
import { uploadImpactStoryAttachmentAsset, uploadImpactStoryThumbnailAsset, } from './upload-story-attachment';
function impactStoryApi() {
    return getJAKoreaHomepageAdminAPIImpactStorySubset();
}
async function listRemoteCategories(): Promise<ImpactStoryCategory[]> {
    const payload = await impactStoryApi().list7();
    return normalizeCategoryListPayload(payload)
        .map((row, i) => mapCategoryResponseToDomain(row, i))
        .filter(row => isPersistedCategoryId(row.id) && row.name.trim() !== '');
}
async function saveCategoriesRemote(items: ImpactStoryCategory[], cached?: ImpactStoryCategory[] | null): Promise<ImpactStoryCategory[]> {
    const api = impactStoryApi();
    const current = cached && cached.length > 0 ? cached : await listRemoteCategories();
    const currentById = new Map(current.map(row => [row.id, row]));
    const draftIds = new Set(items.map(row => row.id));
    for (const row of current) {
        if (draftIds.has(row.id))
            continue;
        if (!isPersistedCategoryId(row.id))
            continue;
        await api._delete(Number(row.id), { version: row.version ?? 0 });
    }
    for (const item of items) {
        const name = item.name.trim();
        if (!name)
            continue;
        const existing = currentById.get(item.id);
        if (existing && isPersistedCategoryId(item.id)) {
            if (existing.name.trim() === name)
                continue;
            normalizeCategoryPayload(await api.update11(Number(item.id), toCategoryUpdateRequest(name, existing.version ?? 0)));
            continue;
        }
        normalizeCategoryPayload(await api.create9(toCategoryCreateRequest(name)));
    }
    return listRemoteCategories();
}
async function listRemoteStories(filter?: ImpactStoryListFilter): Promise<ImpactStory[]> {
    const response = await impactStoryApi().list6(toStoryListParams(filter));
    return (response.items ?? []).map(mapStoryListItemToDomain);
}
async function resolveAttachmentAssetId(attachments: ImpactStoryAttachment[], fallbackAssetId?: number): Promise<number | undefined> {
    const withFile = attachments.find(att => att.file instanceof File);
    if (withFile?.file) {
        return uploadImpactStoryAttachmentAsset(withFile.file);
    }
    const fromExisting = resolvePrimaryAttachmentAssetId(attachments);
    if (fromExisting != null)
        return fromExisting;
    return fallbackAssetId;
}
async function resolveThumbnailAssetId(thumbnail: ImpactStoryAttachment | null | undefined, fallbackAssetId?: number): Promise<number | undefined> {
    if (thumbnail?.file instanceof File) {
        return uploadImpactStoryThumbnailAsset(thumbnail.file);
    }
    if (thumbnail?.assetId != null && thumbnail.assetId > 0) {
        return thumbnail.assetId;
    }
    return fallbackAssetId;
}
function isPinLimitApiError(error: unknown): boolean {
    if (!error || typeof error !== 'object')
        return false;
    const e = error as {
        response?: {
            data?: {
                code?: string;
            };
        };
        code?: string;
    };
    const code = e.response?.data?.code ?? e.code;
    return code === 'IMPACT_PIN_LIMIT_EXCEEDED';
}
export async function listCategoriesService(): Promise<ImpactStoryCategory[]> {
    return listRemoteCategories();
}
export async function saveCategoriesService(items: ImpactStoryCategory[], cached?: ImpactStoryCategory[] | null): Promise<ImpactStoryCategory[]> {
    return saveCategoriesRemote(items, cached);
}
export async function listStoriesService(filter?: ImpactStoryListFilter): Promise<ImpactStory[]> {
    return listRemoteStories(filter);
}
export type ImpactStoryListPage = {
    items: ImpactStory[];
    totalCount: number;
    page: number;
    size: number;
    totalPages: number;
};
export async function listStoriesPageService(filter?: ImpactStoryListFilter): Promise<ImpactStoryListPage> {
    const page = filter?.page ?? 0;
    const size = LIST_PAGE_SIZE;
    const response = await impactStoryApi().list6(toStoryListParams(filter));
    const items = (response.items ?? []).map(mapStoryListItemToDomain);
    const totalCount = response.totalCount ?? items.length;
    const totalPages = response.totalPages ?? (totalCount === 0 ? 0 : Math.ceil(totalCount / size));
    return {
        items,
        totalCount,
        page: response.page ?? page,
        size: response.size ?? size,
        totalPages,
    };
}
export async function getStoryService(id: string): Promise<ImpactStory | null> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0)
        return null;
    try {
        const row = await impactStoryApi().detail1(numericId);
        return mapStoryResponseToDomain(row);
    }
    catch {
        return null;
    }
}
export async function createStoryService(input: ImpactStoryCreateInput): Promise<ImpactStory> {
    try {
        const [attachmentAssetId, thumbnailAssetId] = await Promise.all([
            resolveAttachmentAssetId(input.attachments),
            resolveThumbnailAssetId(input.thumbnail),
        ]);
        const created = await impactStoryApi().create8(toStoryCreateRequest(input, attachmentAssetId, requireThumbnailAssetId(thumbnailAssetId)));
        return mapStoryResponseToDomain(created);
    }
    catch (error) {
        if (isPinLimitApiError(error))
            throw new PinLimitError();
        throw error;
    }
}
export async function updateStoryService(input: ImpactStoryUpdateInput, cached?: ImpactStory | null): Promise<ImpactStory> {
    const current = cached && cached.id === input.id ? cached : await getStoryService(input.id);
    if (!current) {
        throw new Error(`Impact story not found: ${input.id}`);
    }
    try {
        const [attachmentAssetId, thumbnailAssetId] = await Promise.all([
            resolveAttachmentAssetId(input.attachments, current.attachments[0]?.assetId),
            resolveThumbnailAssetId(input.thumbnail, current.thumbnail?.assetId),
        ]);
        const updated = await impactStoryApi().update10(Number(input.id), toStoryUpdateRequest(input, current.version ?? 0, attachmentAssetId, requireThumbnailAssetId(thumbnailAssetId)));
        return mapStoryResponseToDomain(updated);
    }
    catch (error) {
        if (isPinLimitApiError(error))
            throw new PinLimitError();
        throw error;
    }
}
export async function removeStoriesService(ids: string[], cachedList?: ImpactStory[]): Promise<void> {
    if (ids.length === 0)
        return;
    const idSet = new Set(ids);
    let rows = (cachedList ?? []).filter(row => idSet.has(row.id));
    if (rows.length === 0) {
        const all = await listRemoteStories();
        rows = all.filter(row => idSet.has(row.id));
    }
    // 캐시에 없는 선택 행은 detail로 version 확보 (size 부풀리기 금지)
    if (rows.length < ids.length) {
        const have = new Set(rows.map(r => r.id));
        for (const id of ids) {
            if (have.has(id))
                continue;
            const detail = await getStoryService(id);
            if (detail)
                rows.push(detail);
        }
    }
    if (rows.length === 0)
        return;
    await impactStoryApi().bulkDelete4(toBulkDeleteRequest(rows));
    return;
}
export async function setStoryPublicService(id: string, isPublic: boolean, cached?: ImpactStory | null): Promise<ImpactStory> {
    const current = cached && cached.id === id ? cached : await getStoryService(id);
    if (!current) {
        throw new Error(`Impact story not found: ${id}`);
    }
    const updated = await impactStoryApi().togglePublished1(Number(id), toPublishedToggleRequest(current, isPublic));
    return mapStoryResponseToDomain(updated);
}
export async function countPinnedStoriesService(excludeId?: string, cachedStories?: ImpactStory[]): Promise<number> {
    if (cachedStories) {
        return cachedStories.filter(s => s.isPinned && s.id !== excludeId).length;
    }
    // list 정렬: pinned desc — size=20면 고정(최대 9) 전부 포함
    const rows = await listRemoteStories();
    return rows.filter(s => s.isPinned && s.id !== excludeId).length;
}
