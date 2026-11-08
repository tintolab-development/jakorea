import type { CorporateConsultation, CorporateConsultationListFilter, } from '@/entities/corporate-consultation/model/types';
import { fetchAllAdminListPages, toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api';
import { mapConsultationDetailToDomain, mapConsultationListItemToDomain, toBulkRequest, toConsultationListParams, toStatusUpdateRequest, } from './mappers';
import { isAdminForbidden, isAdminNotFound } from '@/features/system-inbox/lib/http-status';
import { downloadHomepageProtectedAttachment, homepageCorporateConsultationAttachmentUrl } from '@/shared/lib/protected-attachment-download';
function sponsorshipApi() {
    return getJAKoreaHomepageAdminAPISponsorshipSubset();
}
async function listRemoteConsultations(filter: CorporateConsultationListFilter, page: number): Promise<AdminListPage<CorporateConsultation>> {
    const response = await sponsorshipApi().list14(toConsultationListParams(filter, page));
    return toAdminListPage((response.items ?? []).map(mapConsultationListItemToDomain), page, response);
}
function resolveRowsFromCache(ids: string[], cachedRows?: CorporateConsultation[]): CorporateConsultation[] {
    const idSet = new Set(ids);
    return (cachedRows ?? []).filter(row => idSet.has(row.id));
}
export async function listCorporateConsultationsPageService(filter: CorporateConsultationListFilter = {}, page = 0): Promise<AdminListPage<CorporateConsultation>> {
    return listRemoteConsultations(filter, page);
}
/**
 * 상세 진입 = 개인정보 원문 조회. 버튼 없이 진입 시 바로 `revealPii=true`로 원문을 받는다.
 * 열람 기록은 BE가 상세 GET 200마다 남긴다(homepage_admin_audit_log PII_READ · homepage_privacy_access_log) —
 * FE에서 별도 로그 POST를 하지 않는다. 상세 쿼리는 staleTime/gcTime 0이라 진입할 때마다 GET(=로그 1건).
 */
export async function getCorporateConsultationService(id: string, actorName?: string): Promise<CorporateConsultation | null> {
    void actorName;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0)
        return null;
    try {
        const row = await sponsorshipApi().detail8(numericId, { revealPii: true });
        return mapConsultationDetailToDomain(row);
    }
    catch (error) {
        if (isAdminForbidden(error) || isAdminNotFound(error))
            throw error;
        return null;
    }
}
/** applicationId·consultationId 진입 모두 상담 PK를 path id로 쓴다. */
export async function downloadCorporateConsultationAttachmentService(id: string, assetId: number | null | undefined, password: string, fallbackFileName: string): Promise<void> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
        throw new Error('첨부파일을 불러오지 못했습니다.');
    }
    await downloadHomepageProtectedAttachment({
        url: homepageCorporateConsultationAttachmentUrl(numericId, assetId),
        password,
        fallbackFileName,
    });
}
export async function removeCorporateConsultationsService(ids: string[], cachedRows?: CorporateConsultation[]): Promise<void> {
    if (ids.length === 0)
        return;
    let rows = resolveRowsFromCache(ids, cachedRows);
    if (rows.length === 0) {
        const listed = await fetchAllAdminListPages(page => listRemoteConsultations({}, page));
        rows = resolveRowsFromCache(ids, listed);
    }
    if (rows.length === 0)
        return;
    await sponsorshipApi().bulkDelete6(toBulkRequest(rows));
    return;
}
export async function confirmCorporateConsultationsService(ids: string[], actorName?: string, cachedRows?: CorporateConsultation[]): Promise<CorporateConsultation[]> {
    if (ids.length === 0)
        return [];
    let rows = resolveRowsFromCache(ids, cachedRows).filter(row => row.status === 'pending');
    if (rows.length === 0) {
        const listed = await fetchAllAdminListPages(page => listRemoteConsultations({}, page));
        rows = resolveRowsFromCache(ids, listed).filter(row => row.status === 'pending');
    }
    if (rows.length === 0)
        return [];
    if (rows.length === 1) {
        const row = rows[0]!;
        const updated = await sponsorshipApi().updateStatus1(Number(row.id), toStatusUpdateRequest(row, 'confirmed'));
        return [mapConsultationListItemToDomain(updated)];
    }
    await sponsorshipApi().bulkConfirm(toBulkRequest(rows));
    const confirmedAt = new Date().toISOString();
    return rows.map(row => ({
        ...row,
        status: 'confirmed' as const,
        confirmedAt,
        confirmedByName: actorName?.trim() ? actorName.trim() : row.confirmedByName,
        version: row.version + 1,
    }));
}
