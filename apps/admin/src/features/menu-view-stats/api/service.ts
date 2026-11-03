import type { MenuViewPeriod, MenuViewStatsResult, } from '@/entities/menu-view-stats/model/types';
import { getJAKoreaHomepageAdminAPIStatisticsSubset } from '@/shared/api/generated/statistics/statistics-api';
import { mapMenuStatisticsToDomain, toMenusParams } from './mappers';
function statisticsApi() {
    return getJAKoreaHomepageAdminAPIStatisticsSubset();
}
export async function getMenuViewStatsService(period: MenuViewPeriod): Promise<MenuViewStatsResult> {
    const response = await statisticsApi().menus(toMenusParams(period));
    return mapMenuStatisticsToDomain(response, period);
}
