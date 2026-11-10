import axios from 'axios';
import type { RecruitApplicant, RecruitApplicantDetail, RecruitApplicantListFilter, } from '@/entities/recruit-applicant/model/types';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api';
import { defaultXlsxFilename, downloadRemoteLogExcel } from '@/features/logs/shared/lib/download-binary';
import { mapCareerTalentApplicationDetail, mapCareerTalentApplicationListItem, toNumericId, toTalentApplicationExportParams, toTalentApplicationListParams, } from './mappers';
import { downloadHomepageProtectedAttachment, homepageRecruitAttachmentUrl } from '@/shared/lib/protected-attachment-download';
import { resolveApplicantRevealPii } from '@/features/auth/lib/applicant-reveal-pii';
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
 * 상세 진입 = 개인정보 원문 조회. 버튼 없이 진입 시 바로 원문을 받는다.
 * 단 HOMEPAGE_PII_VIEW가 없는 Program Viewer는 `revealPii=false`로 마스킹 상세를 받는다(권한 설정 V1.2).
 * 열람 기록은 BE가 상세 GET 200마다 남긴다(homepage_admin_audit_log PII_READ · homepage_privacy_access_log) —
 * FE에서 별도 로그 POST를 하지 않는다. 상세 쿼리는 staleTime/gcTime 0이라 진입할 때마다 GET(=로그 1건).
 */
export async function getRecruitApplicantService(id: string): Promise<RecruitApplicantDetail | null> {
    const row = await careersApi().detail9(toNumericId(id), { revealPii: await resolveApplicantRevealPii() });
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
/**
 * 엑셀 다운로드 — BE가 목록과 같은 필터·마스킹으로 xlsx를 만들고
 * 감사 로그(LIST_EXPORT)·파일 다운로드 이력을 남긴다. FE는 받은 파일을 저장만 한다.
 */
export async function exportRecruitApplicantsService(filter: RecruitApplicantListFilter | undefined): Promise<void> {
    await downloadRemoteLogExcel({
        url: '/api/admin/careers/talent-applications/export',
        params: toTalentApplicationExportParams(filter),
        filenameFallback: defaultXlsxFilename('인재채용 신청 목록'),
    });
}
