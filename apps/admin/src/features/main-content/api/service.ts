import type { DonationSection, EducationSection, ImpactStoryOption, ImpactStorySection, MainContents, PerformanceSection, } from '@/entities/main-content/model/types';
import { getJAKoreaHomepageAdminAPIMainSubset } from '@/shared/api/generated/main/main-api';
import type { DonationResponse } from '@/shared/api/generated/main/schemas/donationResponse';
import type { EducationResponse } from '@/shared/api/generated/main/schemas/educationResponse';
import type { ImpactResponse } from '@/shared/api/generated/main/schemas/impactResponse';
import type { PerformanceResponse } from '@/shared/api/generated/main/schemas/performanceResponse';
import { mapAdminContentToDomain, mergeDonationResponse, mergeEducationResponse, mergeImpactResponse, mergePerformanceResponse, toDonationUpdateRequest, toEducationUpdateRequest, toImpactUpdateRequest, toPerformanceUpdateRequest, } from './mappers';
function mainApi() {
    return getJAKoreaHomepageAdminAPIMainSubset();
}
async function fetchRemoteContents(): Promise<MainContents> {
    const response = await mainApi().get13();
    return mapAdminContentToDomain(response);
}
async function resolveRemoteContents(cached?: MainContents): Promise<MainContents> {
    if (cached)
        return cached;
    return fetchRemoteContents();
}
export async function getMainContentsService(): Promise<MainContents> {
    return fetchRemoteContents();
}
export async function listImpactStoryOptionsService(): Promise<ImpactStoryOption[]> {
    const contents = await fetchRemoteContents();
    return contents.impactStoryOptions ?? [];
}
export async function saveEducationSectionService(section: EducationSection, cached?: MainContents): Promise<MainContents> {
    const prev = await resolveRemoteContents(cached);
    const updated = await mainApi().updateEducation(toEducationUpdateRequest({ ...section, version: section.version ?? prev.education.version }));
    return mergeEducationResponse(prev, updated as EducationResponse);
}
export async function saveImpactStorySectionService(section: ImpactStorySection, cached?: MainContents): Promise<MainContents> {
    const prev = await resolveRemoteContents(cached);
    const updated = await mainApi().updateImpact(toImpactUpdateRequest({
        ...section,
        version: section.version ?? prev.impactStory.version,
    }));
    return mergeImpactResponse(prev, updated as ImpactResponse);
}
export async function savePerformanceSectionService(section: PerformanceSection, cached?: MainContents): Promise<MainContents> {
    const prev = await resolveRemoteContents(cached);
    const updated = await mainApi().updatePerformance(toPerformanceUpdateRequest({
        ...section,
        version: section.version ?? prev.performance.version,
    }));
    return mergePerformanceResponse(prev, updated as PerformanceResponse);
}
export async function saveDonationSectionService(section: DonationSection, cached?: MainContents): Promise<MainContents> {
    const prev = await resolveRemoteContents(cached);
    const updated = await mainApi().updateDonation(toDonationUpdateRequest({
        ...section,
        version: section.version ?? prev.donation.version,
    }));
    return mergeDonationResponse(prev, updated as DonationResponse);
}
