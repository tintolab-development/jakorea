import type { JaKoreaWorldwide } from '@/entities/ja-korea-worldwide/model/types';
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api';
import { mapWorldwideResponseToDomain, toWorldwideUpdateRequest } from './mappers';
function jaKoreaApi() {
    return getJAKoreaHomepageAdminAPIJAKoreaSubset();
}
export async function getJaKoreaWorldwideService(): Promise<JaKoreaWorldwide> {
    const response = await jaKoreaApi().worldwide();
    return mapWorldwideResponseToDomain(response);
}
export async function saveJaKoreaWorldwideService(data: JaKoreaWorldwide): Promise<JaKoreaWorldwide> {
    const updated = await jaKoreaApi().updateWorldwide(toWorldwideUpdateRequest(data));
    return mapWorldwideResponseToDomain(updated);
}
