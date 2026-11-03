import type { ParticipateMenuLinks } from '@/entities/participate/model/types';
import { getJAKoreaHomepageAdminAPIParticipationSubset } from '@/shared/api/generated/participation/participation-api';
import { mapLinkResponsesToDomain, toLinksUpdateRequest } from './mappers';
function participationApi() {
    return getJAKoreaHomepageAdminAPIParticipationSubset();
}
export async function getParticipateMenuLinksService(): Promise<ParticipateMenuLinks> {
    const rows = await participationApi().list();
    return mapLinkResponsesToDomain(rows ?? []);
}
export async function saveParticipateMenuLinksService(data: ParticipateMenuLinks): Promise<ParticipateMenuLinks> {
    const updated = await participationApi().update3(toLinksUpdateRequest(data));
    return mapLinkResponsesToDomain(updated ?? []);
}
