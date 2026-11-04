import axios from 'axios';
import type { RecruitApplicant, RecruitApplicantDetail, RecruitApplicantListFilter, } from '@/entities/recruit-applicant/model/types';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api';
import { mapCareerTalentApplicationDetail, mapCareerTalentApplicationListItem, toNumericId, toTalentApplicationListParams, } from './mappers';
import { toRevealPiiQueryParam } from '@/shared/lib/homepage-pii';
export type RecruitApplicantConfirmInput = {
    id: string;
    version: number;
};
function careersApi() {
    return getJAKoreaHomepageAdminAPICareersSubset();
}
/** 원격 목록 — 필터·totalCount 는 서버 응답을 그대로 사용한다. */
async function listRemote(filter: RecruitApplicantListFilter | undefined, page: number): Promise<AdminListPage<RecruitApplicant>> {
    const response = await careersApi().list15(toTalentApplicationListParams(filter, page));
    const items = (response.items ?? [])
        .map(mapCareerTalentApplicationListItem)
        .filter((row): row is RecruitApplicant => row != null);
    return toAdminListPage(items, page, response);
}
export function isRecruitApplicantNotFoundError(error: unknown): boolean {
    if (!axios.isAxiosError(error) || error.response?.status !== 404)
        return false;
    const data = error.response.data;
    if (!data || typeof data !== 'object')
        return false;
    return (data as {
        code?: unknown;
    }).code === 'CAREER_RESOURCE_NOT_FOUND';
}
export async function getRecruitApplicantService(id: string, options?: {
    revealPii?: boolean;
}): Promise<RecruitApplicantDetail | null> {
    const row = await careersApi().detail9(toNumericId(id), {
        revealPii: toRevealPiiQueryParam(options?.revealPii),
    });
    const mapped = mapCareerTalentApplicationDetail(row);
    if (!mapped) {
        throw new Error('신청 상세를 불러오지 못했습니다.');
    }
    return mapped;
}
export async function downloadRecruitApplicantAttachmentService(id: string, assetId?: number | null): Promise<{
    downloadUrl: string;
    originalName?: string;
} | null> {
    const numericId = toNumericId(id);
    const response = assetId != null && assetId > 0
        ? await careersApi().attachmentDownloadByAsset2(numericId, assetId)
        : await careersApi().attachmentDownload2(numericId);
    if (!response.downloadUrl)
        return null;
    return {
        downloadUrl: response.downloadUrl,
        originalName: response.originalName,
    };
}
export async function listRecruitApplicantsPageService(filter: RecruitApplicantListFilter | undefined, page: number): Promise<AdminListPage<RecruitApplicant>> {
    return listRemote(filter, page);
}
export async function confirmRecruitApplicantsService(items: RecruitApplicantConfirmInput[]): Promise<void> {
    const api = careersApi();
    for (const item of items) {
        await api.confirm4(toNumericId(item.id), { version: item.version });
    }
    return;
}
export async function removeRecruitApplicantsService(ids: string[]): Promise<void> {
    await careersApi().delete4(ids.map(toNumericId));
    return;
}
