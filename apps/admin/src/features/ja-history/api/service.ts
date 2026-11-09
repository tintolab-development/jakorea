import { JaHistorySaveError, type JaHistoryCtaSaveInput, type JaHistoryData, type JaHistoryEraSaveInput, type JaHistoryHeroSaveInput, type JaHistoryOriginSaveInput, type JaHistoryPhilosophySaveInput, type JaHistoryThriveSaveInput, type JaHistoryTimelineSaveInput, } from '@/entities/ja-history/model/types';
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api';
import { isOptimisticLockConflictError, readApiErrorMessage, } from '@/shared/lib/api-error-message';
import { mapJaHistoryPageResponseToDomain, toJaHistoryCtaUpdateRequest, toJaHistoryErasUpdateRequest, toJaHistoryHeroUpdateRequest, toJaHistoryOriginUpdateRequest, toJaHistoryPhilosophyUpdateRequest, toJaHistoryThriveUpdateRequest, toJaHistoryTimelineUpdateRequest, } from './mappers';
import { uploadJaHistoryImageAsset, type JaHistoryUploadPurpose, } from './upload-ja-history-image';
function jaKoreaApi() {
    return getJAKoreaHomepageAdminAPIJAKoreaSubset();
}
async function fetchRemote(): Promise<JaHistoryData> {
    return mapJaHistoryPageResponseToDomain(await jaKoreaApi().get14());
}
async function resolveVersion(cached?: JaHistoryData): Promise<{
    data: JaHistoryData;
    version: number;
}> {
    const data = cached ?? (await fetchRemote());
    return { data, version: data.version };
}
function rethrowRemote(error: unknown): never {
    if (error instanceof JaHistorySaveError)
        throw error;
    if (isOptimisticLockConflictError(error)) {
        throw new JaHistorySaveError('OPTIMISTIC_LOCK', '다른 관리자가 내용을 수정했습니다.\n새로고침 후 다시 시도해 주세요.');
    }
    const message = readApiErrorMessage(error);
    if (message) {
        throw new JaHistorySaveError('REQUIRED', message);
    }
    throw error;
}
async function resolveImageAssetId(params: {
    imageFile?: File | null;
    imageAssetId?: number | null;
    fallbackAssetId?: number;
    purpose: JaHistoryUploadPurpose;
    requiredLabel: string;
}): Promise<number> {
    if (params.imageFile) {
        return uploadJaHistoryImageAsset(params.imageFile, params.purpose);
    }
    const assetId = params.imageAssetId ?? params.fallbackAssetId;
    if (assetId == null) {
        throw new JaHistorySaveError('REQUIRED', params.requiredLabel);
    }
    return assetId;
}
export async function getJaHistoryService(): Promise<JaHistoryData> {
    return fetchRemote();
}
export async function saveJaHistoryHeroService(input: JaHistoryHeroSaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { data, version } = await resolveVersion(cached);
        const imageAssetId = await resolveImageAssetId({
            imageFile: input.imageFile,
            imageAssetId: input.imageAssetId,
            fallbackAssetId: data.hero.image.assetId,
            purpose: 'JA_HISTORY_HERO_IMAGE',
            requiredLabel: '히어로 이미지를 등록해 주세요.',
        });
        const updated = await jaKoreaApi().updateHero(toJaHistoryHeroUpdateRequest(input, imageAssetId, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryOriginService(input: JaHistoryOriginSaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { version } = await resolveVersion(cached);
        const updated = await jaKoreaApi().updateOrigin(toJaHistoryOriginUpdateRequest(input, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryErasService(input: JaHistoryEraSaveInput[], cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { version } = await resolveVersion(cached);
        const updated = await jaKoreaApi().updateEras(toJaHistoryErasUpdateRequest(input, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryWorldTimelineService(input: JaHistoryTimelineSaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { data, version } = await resolveVersion(cached);
        const imageAssetId = await resolveImageAssetId({
            imageFile: input.imageFile,
            imageAssetId: input.imageAssetId,
            fallbackAssetId: data.worldTimeline.image.assetId,
            purpose: 'JA_HISTORY_WORLD_TIMELINE_IMAGE',
            requiredLabel: '대표 이미지를 등록해 주세요.',
        });
        const updated = await jaKoreaApi().updateWorldTimeline(toJaHistoryTimelineUpdateRequest(input, imageAssetId, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryKoreaTimelineService(input: JaHistoryTimelineSaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { data, version } = await resolveVersion(cached);
        const imageAssetId = await resolveImageAssetId({
            imageFile: input.imageFile,
            imageAssetId: input.imageAssetId,
            fallbackAssetId: data.koreaTimeline.image.assetId,
            purpose: 'JA_HISTORY_KOREA_TIMELINE_IMAGE',
            requiredLabel: '대표 이미지를 등록해 주세요.',
        });
        const updated = await jaKoreaApi().updateKoreaTimeline(toJaHistoryTimelineUpdateRequest(input, imageAssetId, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryPhilosophyService(input: JaHistoryPhilosophySaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { data, version } = await resolveVersion(cached);
        const cards = [];
        for (const card of input.cards) {
            const current = data.philosophy.cards.find(item => item.id === card.id);
            const imageAssetId = await resolveImageAssetId({
                imageFile: card.imageFile,
                imageAssetId: card.imageAssetId,
                fallbackAssetId: current?.image.assetId,
                purpose: 'JA_HISTORY_PHILOSOPHY_CARD_IMAGE',
                requiredLabel: '교육 카드 이미지를 등록해 주세요.',
            });
            cards.push({
                id: card.id,
                title: card.title,
                description: card.description,
                imageAssetId,
            });
        }
        const updated = await jaKoreaApi().updatePhilosophy(toJaHistoryPhilosophyUpdateRequest({ ...input, cards }, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryThriveService(input: JaHistoryThriveSaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { version } = await resolveVersion(cached);
        const updated = await jaKoreaApi().updateThrive(toJaHistoryThriveUpdateRequest(input, version));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
export async function saveJaHistoryCtaService(input: JaHistoryCtaSaveInput, cached?: JaHistoryData): Promise<JaHistoryData> {
    try {
        const { version } = await resolveVersion(cached);
        const imageAssetId = input.imageFile
            ? await uploadJaHistoryImageAsset(input.imageFile, 'JA_HISTORY_CTA_IMAGE')
            : undefined;
        const updated = await jaKoreaApi().updateCta(toJaHistoryCtaUpdateRequest(input, version, imageAssetId));
        return mapJaHistoryPageResponseToDomain(updated);
    }
    catch (error) {
        rethrowRemote(error);
    }
}
