import type { TalentDonationApplication, TalentDonationApplicationListFilter, } from '@/entities/talent-donation-application/model/types';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api';
import { mapTalentApplicationDetailToDomain, mapTalentApplicationListItemToDomain, toTalentApplicationListParams, toTalentApplicationStatusUpdateRequest, } from './mappers';
import { isAdminForbidden, isAdminNotFound } from '@/features/system-inbox/lib/http-status';
function sponsorshipApi() {
    return getJAKoreaHomepageAdminAPISponsorshipSubset();
}
async function listRemote(filter: TalentDonationApplicationListFilter, page: number): Promise<AdminListPage<TalentDonationApplication>> {
    const response = await sponsorshipApi().list13(toTalentApplicationListParams(filter, page));
    return toAdminListPage((response.items ?? []).map(mapTalentApplicationListItemToDomain), page, response);
}
export async function listTalentDonationApplicationsPageService(filter: TalentDonationApplicationListFilter = {}, page = 0): Promise<AdminListPage<TalentDonationApplication>> {
    return listRemote(filter, page);
}
export async function getTalentDonationApplicationService(id: string, actorName?: string): Promise<TalentDonationApplication | null> {
    void actorName;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0)
        return null;
    try {
        const row = await sponsorshipApi().detail7(numericId);
        return mapTalentApplicationDetailToDomain(row);
    }
    catch (error) {
        if (isAdminForbidden(error) || isAdminNotFound(error))
            throw error;
        return null;
    }
}
export async function downloadTalentDonationApplicationAttachmentService(id: string, assetId?: number | null): Promise<{
    downloadUrl: string;
    originalName?: string;
} | null> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0)
        return null;
    const response = assetId != null && assetId > 0
        ? await sponsorshipApi().attachmentDownloadByAsset(numericId, assetId)
        : await sponsorshipApi().attachmentDownload(numericId);
    if (!response.downloadUrl)
        return null;
    return {
        downloadUrl: response.downloadUrl,
        originalName: response.originalName,
    };
}
export async function removeTalentDonationApplicationsService(ids: string[], _cachedRows?: TalentDonationApplication[]): Promise<void> {
    void _cachedRows;
    const numericIds = ids
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && id > 0);
    if (numericIds.length === 0)
        return;
    await sponsorshipApi().delete3(numericIds);
    return;
}
export async function confirmTalentDonationApplicationsService(ids: string[], actorName?: string, _cachedRows?: TalentDonationApplication[]): Promise<TalentDonationApplication[]> {
    void _cachedRows;
    const results: TalentDonationApplication[] = [];
    for (const id of ids) {
        const numericId = Number(id);
        if (!Number.isFinite(numericId) || numericId <= 0)
            continue;
        const updated = await sponsorshipApi().updateStatus(numericId, toTalentApplicationStatusUpdateRequest('confirmed'));
        const mapped = mapTalentApplicationListItemToDomain(updated);
        if (actorName?.trim() && !mapped.confirmedByName) {
            mapped.confirmedByName = actorName.trim();
        }
        results.push(mapped);
    }
    return results;
}
