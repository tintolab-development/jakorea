import type { Notice, NoticeAttachment, NoticeCreateInput, NoticeListFilter, NoticeUpdateInput, } from '@/entities/notices/model/types';
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api';
import type { ToggleRequest } from '@/shared/api/generated/ja-korea/schemas/toggleRequest';
import { mapNoticeResponseToDomain, toBulkDeleteRequest, toNoticeCreateRequest, toNoticeListParams, toNoticeUpdateRequest, toPublishedToggleRequest, } from './mappers';
import { fetchAllAdminListPages, toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { resolveOrderedAttachmentAssetIds } from '@/shared/lib/resolve-attachment-asset-ids';
import { uploadNoticeAttachmentAsset } from './upload-notice-attachment';
function jaKoreaApi() {
    return getJAKoreaHomepageAdminAPIJAKoreaSubset();
}
async function listRemoteNoticesPage(filter: NoticeListFilter | undefined, page: number): Promise<AdminListPage<Notice>> {
    const response = await jaKoreaApi().list5(toNoticeListParams(filter, page));
    return toAdminListPage((response.items ?? []).map(mapNoticeResponseToDomain), page, response);
}
async function resolveAttachmentAssetIds(attachments: NoticeAttachment[]): Promise<number[]> {
    return resolveOrderedAttachmentAssetIds(attachments, uploadNoticeAttachmentAsset);
}
export async function listNoticesPageService(filter: NoticeListFilter | undefined, page: number): Promise<AdminListPage<Notice>> {
    return listRemoteNoticesPage(filter, page);
}
export async function getNoticeService(id: string): Promise<Notice | null> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0)
        return null;
    try {
        const row = await jaKoreaApi().detail(numericId);
        return mapNoticeResponseToDomain(row);
    }
    catch {
        return null;
    }
}
export async function createNoticeService(input: NoticeCreateInput): Promise<Notice> {
    const attachmentAssetIds = await resolveAttachmentAssetIds(input.attachments);
    const created = await jaKoreaApi().create7(toNoticeCreateRequest(input, attachmentAssetIds));
    return mapNoticeResponseToDomain(created);
}
export async function updateNoticeService(input: NoticeUpdateInput, cached?: Notice | null): Promise<Notice> {
    const current = cached && cached.id === input.id ? cached : await getNoticeService(input.id);
    if (!current) {
        throw new Error(`Notice not found: ${input.id}`);
    }
    const attachmentAssetIds = await resolveAttachmentAssetIds(input.attachments);
    const updated = await jaKoreaApi().update8(Number(input.id), toNoticeUpdateRequest(input, current.version, attachmentAssetIds));
    return mapNoticeResponseToDomain(updated);
}
export async function removeNoticesService(ids: string[], cachedList?: Notice[]): Promise<void> {
    if (ids.length === 0)
        return;
    const idSet = new Set(ids);
    let rows = (cachedList ?? []).filter(row => idSet.has(row.id));
    if (rows.length === 0) {
        const all = await fetchAllAdminListPages(page => listRemoteNoticesPage(undefined, page));
        rows = all.filter(row => idSet.has(row.id));
    }
    if (rows.length === 0)
        return;
    await jaKoreaApi().bulkDelete3(toBulkDeleteRequest(rows));
    return;
}
export async function setNoticePublicService(id: string, isPublic: boolean, cached?: Notice | null): Promise<Notice> {
    const current = cached && cached.id === id ? cached : await getNoticeService(id);
    if (!current) {
        throw new Error(`Notice not found: ${id}`);
    }
    // Generated ToggleRequest uses `enabled`, but JA Korea notices API expects `published`.
    const body = toPublishedToggleRequest(current, isPublic);
    const updated = await jaKoreaApi().togglePublished(Number(id), body as unknown as ToggleRequest);
    return mapNoticeResponseToDomain(updated);
}
