import type { BannerSaveInput, CultureSaveItem, InterviewSaveItem, RecruitGuideData, } from '@/entities/recruit-guide/model/types';
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api';
import { mapCareerGuideAdminToDomain, mergeBannerResponse, mergeCultureItemsResponse, mergeInterviewResponse, } from './mappers';
import { uploadCareerHeroImageAsset } from './upload-career-hero-image';
const CULTURE_ID: Record<CultureSaveItem['id'], number> = {
    make_an_impact: 1,
    keep_learning: 2,
    speak_openly: 3,
    ready_to_help: 4,
};
const CULTURE_IDS = new Set(Object.keys(CULTURE_ID));
function requiredText(value: string, requiredCode: string, tooLongCode: string, maxLength: number) {
    const normalized = value.trimEnd();
    if (!normalized.trim())
        throw new Error(requiredCode);
    if (normalized.length > maxLength)
        throw new Error(tooLongCode);
    return normalized;
}
function interviewYear(value: number | null): number | undefined {
    if (value == null)
        return undefined;
    if (!Number.isInteger(value) || value < 1900 || value > 2200) {
        throw new Error('INVALID_CAREER_GUIDE_INTERVIEW_YEAR');
    }
    return value;
}
function careersApi() {
    return getJAKoreaHomepageAdminAPICareersSubset();
}
async function resolvePrev(cached?: RecruitGuideData): Promise<RecruitGuideData> {
    if (cached)
        return cached;
    return getRecruitGuideService();
}
export async function getRecruitGuideService(): Promise<RecruitGuideData> {
    const row = await careersApi().guide1();
    return mapCareerGuideAdminToDomain(row);
}
export async function saveBannerService(input: BannerSaveInput, cached?: RecruitGuideData): Promise<RecruitGuideData> {
    const mainText = requiredText(input.mainText, 'BANNER_MAIN_TEXT_REQUIRED', 'BANNER_MAIN_TEXT_TOO_LONG', 1000);
    const subTextKo = requiredText(input.subText01, 'BANNER_SUB_TEXT_01_REQUIRED', 'BANNER_SUB_TEXT_01_TOO_LONG', 2000);
    const subTextEn = requiredText(input.subText02, 'BANNER_SUB_TEXT_02_REQUIRED', 'BANNER_SUB_TEXT_02_TOO_LONG', 2000);
    const hasNewImage = input.imageFile != null;
    let imageAssetId = input.imageAssetId ?? null;
    if (input.imageFile) {
        imageAssetId = await uploadCareerHeroImageAsset(input.imageFile);
    }
    // FileReader data URL은 미리보기 전용이다. 새 파일을 선택한 경우에는
    // 서버 응답/재조회 전까지 기존 URL을 캐시에 임시로 남기고 data URL은 절대 저장하지 않는다.
    const imageUrl = hasNewImage ? '' : input.imageUrl.trim();
    if (!imageUrl && imageAssetId == null)
        throw new Error('BANNER_IMAGE_REQUIRED');
    const prev = await resolvePrev(cached);
    const response = await careersApi().updateCareerGuideBanner({
        imageAssetId,
        mainText,
        subTextKo,
        subTextEn,
        version: input.version,
    });
    return mergeBannerResponse(prev, response, {
        imageUrl: hasNewImage ? undefined : imageUrl,
        imageFileName: hasNewImage
            ? input.imageFileName?.trim()
            : imageAssetId == null
                ? ''
                : input.imageFileName?.trim() || prev.banner.imageFileName,
        imageAssetId,
    });
}
export async function saveCultureService(items: CultureSaveItem[], cached?: RecruitGuideData): Promise<RecruitGuideData> {
    if (items.length !== 4 ||
        new Set(items.map(item => item.id)).size !== 4 ||
        items.some(item => !CULTURE_IDS.has(item.id))) {
        throw new Error('CULTURE_ITEMS_INVALID');
    }
    const prev = await resolvePrev(cached);
    const rows = await careersApi().updateCareerGuideCultureItems({
        items: items.map(item => {
            const id = CULTURE_ID[item.id];
            if (id == null)
                throw new Error('CULTURE_ITEMS_INVALID');
            const title = requiredText(item.title, 'CULTURE_TITLE_REQUIRED', 'CULTURE_TITLE_TOO_LONG', 500);
            const description = requiredText(item.description, 'CULTURE_DESCRIPTION_REQUIRED', 'CULTURE_DESCRIPTION_TOO_LONG', 2000);
            return {
                id,
                title,
                description,
                version: item.version,
            };
        }),
    });
    return mergeCultureItemsResponse(prev, rows);
}
export async function addInterviewService(input: InterviewSaveItem, cached?: RecruitGuideData): Promise<RecruitGuideData> {
    const prev = await resolvePrev(cached);
    if (!Number.isInteger(input.impactStoryId) || input.impactStoryId <= 0) {
        throw new Error('INTERVIEW_IMPACT_STORY_ID_INVALID');
    }
    const response = await careersApi().createCareerGuideInterview({
        impactStoryId: input.impactStoryId,
        title: requiredText(input.title, 'INTERVIEW_TITLE_REQUIRED', 'INTERVIEW_TITLE_TOO_LONG', 300),
        year: interviewYear(input.publishedYear),
    });
    return mergeInterviewResponse(prev, response);
}
export async function replaceInterviewService(id: string, input: InterviewSaveItem, cached?: RecruitGuideData): Promise<RecruitGuideData> {
    const prev = await resolvePrev(cached);
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId < 1) {
        throw new Error('INTERVIEW_ID_INVALID');
    }
    const current = prev.interviews.find(item => item.id === id);
    if (!current)
        throw new Error('INTERVIEW_NOT_FOUND');
    if (!Number.isInteger(input.impactStoryId) || input.impactStoryId <= 0) {
        throw new Error('INTERVIEW_IMPACT_STORY_ID_INVALID');
    }
    const title = requiredText(input.title, 'INTERVIEW_TITLE_REQUIRED', 'INTERVIEW_TITLE_TOO_LONG', 300);
    if (current.impactStoryId === input.impactStoryId) {
        const response = await careersApi().updateCareerGuideInterview(numericId, {
            title,
            year: interviewYear(input.publishedYear != null ? input.publishedYear : current.publishedYear),
            version: current.version,
        });
        return mergeInterviewResponse(prev, response);
    }
    await careersApi().deleteCareerGuideInterview(numericId, { version: current.version });
    await careersApi().createCareerGuideInterview({
        impactStoryId: input.impactStoryId,
        title,
        year: interviewYear(input.publishedYear),
    });
    return getRecruitGuideService();
}
export async function removeInterviewsService(ids: string[], cached?: RecruitGuideData): Promise<RecruitGuideData> {
    const prev = await resolvePrev(cached);
    if (ids.length === 0)
        throw new Error('INTERVIEW_NONE_SELECTED');
    const seen = new Set<number>();
    const items: {
        id: number;
        version: number;
    }[] = [];
    for (const id of ids) {
        const numericId = Number(id);
        const current = prev.interviews.find(item => item.id === id);
        if (!Number.isInteger(numericId) || numericId < 1) {
            throw new Error('INTERVIEW_ID_INVALID');
        }
        if (!current)
            throw new Error('INTERVIEW_NOT_FOUND');
        if (seen.has(numericId))
            throw new Error('VALIDATION_ERROR');
        seen.add(numericId);
        items.push({ id: numericId, version: current.version });
    }
    if (items.length > 9)
        throw new Error('VALIDATION_ERROR');
    await careersApi().bulkDeleteCareerGuideInterviews({ items });
    return getRecruitGuideService();
}
