import type { JaKoreaBi } from '@/entities/ja-korea-bi/model/types';
import { getJAKoreaHomepageAdminAPIJAKoreaSubset } from '@/shared/api/generated/ja-korea/ja-korea-api';
import { mapBiResponseToDomain, toBiUpdateRequest } from './mappers';
function jaKoreaApi() {
    return getJAKoreaHomepageAdminAPIJAKoreaSubset();
}
export async function getJaKoreaBiService(): Promise<JaKoreaBi> {
    const response = await jaKoreaApi().bi();
    return mapBiResponseToDomain(response);
}
export async function saveJaKoreaBiService(data: JaKoreaBi): Promise<JaKoreaBi> {
    const updated = await jaKoreaApi().updateBi(toBiUpdateRequest(data));
    return mapBiResponseToDomain(updated);
}
