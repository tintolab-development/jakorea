import axios from 'axios';
import type { RecruitApplicant, RecruitApplicantDetail, RecruitApplicantListFilter, } from '@/entities/recruit-applicant/model/types';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api';
import { mapCareerTalentApplicationDetail, mapCareerTalentApplicationListItem, toNumericId, toTalentApplicationListParams, } from './mappers';
import { downloadHomepageProtectedAttachment, homepageRecruitAttachmentUrl } from '@/shared/lib/protected-attachment-download';
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
/**
 * 상세 진입 = 개인정보 원문 조회. 버튼 없이 진입 시 바로 `revealPii=true`로 원문을 받는다.
 * 열람 기록은 BE가 상세 GET 200마다 남긴다(homepage_admin_audit_log PII_READ · homepage_privacy_access_log) —
 * FE에서 별도 로그 POST를 하지 않는다. 상세 쿼리는 staleTime/gcTime 0이라 진입할 때마다 GET(=로그 1건).
 */
export async function getRecruitApplicantService(id: string): Promise<RecruitApplicantDetail | null> {
    const row = await careersApi().detail9(toNumericId(id), { revealPii: true });
    const mapped = mapCareerTalentApplicationDetail(row);
    if (!mapped) {
        throw new Error('신청 상세를 불러오지 못했습니다.');
    }
    return mapped;
}
export async function downloadRecruitApplicantAttachmentService(id: string, assetId: number | null | undefined, password: string, fallbackFileName: string): Promise<void> {
    const numericId = toNumericId(id);
    await downloadHomepageProtectedAttachment({
        url: homepageRecruitAttachmentUrl(numericId, assetId),
        password,
        fallbackFileName,
    });
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
