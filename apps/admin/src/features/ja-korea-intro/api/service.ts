import type { JaKoreaIntro } from '@/entities/ja-korea-intro/model/types';
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api';
import { mapIntroductionResponseToDomain, toIntroductionUpdateRequest } from './mappers';
function jaKoreaApi() {
    return getJAKoreaHomepageAdminAPIJAKoreaSubset();
}
export async function getJaKoreaIntroService(): Promise<JaKoreaIntro> {
    const response = await jaKoreaApi().introduction();
    return mapIntroductionResponseToDomain(response);
}
export async function saveJaKoreaIntroService(data: JaKoreaIntro): Promise<JaKoreaIntro> {
    const updated = await jaKoreaApi().updateIntroduction(toIntroductionUpdateRequest(data));
    return mapIntroductionResponseToDomain(updated);
}
