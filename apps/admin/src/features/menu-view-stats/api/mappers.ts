/**
 * 메뉴별 조회 통계 — OpenAPI ↔ 도메인 매핑
 * 섹션 구조(라벨·각주·kind)는 FE 템플릿, 수치는 metricCode 합산
 */

import {
  ALUMNI_FOOTNOTE,
  DISABLED_MENU_MESSAGE,
  NTS_FOOTNOTE,
  ONLINE_LEARNING_FOOTNOTE,
  type MenuViewMetric,
  type MenuViewPeriod,
  type MenuViewSection,
  type MenuViewStatsResult,
  type MenuViewSummary,
  type MenuViewTabId,
} from '@/entities/menu-view-stats/model/types'
import type { MenuStatistics } from '@/shared/api/generated/statistics/schemas/menuStatistics'
import type { MenusParams } from '@/shared/api/generated/statistics/schemas/menusParams'
import { TopMenuStatisticsTopMenu } from '@/shared/api/generated/statistics/schemas/topMenuStatisticsTopMenu'

function n(v: number | undefined | null): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export function toMenusParams(period: MenuViewPeriod): MenusParams {
  return { from: period.from, to: period.to }
}

function buildMetricIndex(response: MenuStatistics): Map<string, number> {
  const map = new Map<string, number>()
  for (const top of response.menus ?? []) {
    for (const item of top.items ?? []) {
      for (const metric of item.metrics ?? []) {
        const code = metric.metricCode?.trim()
        if (!code) continue
        map.set(code, n(metric.eventCount))
      }
    }
  }
  return map
}

function sumCodes(index: Map<string, number>, codes: readonly string[]): number {
  return codes.reduce((sum, code) => sum + n(index.get(code)), 0)
}

function fillMetric(
  index: Map<string, number>,
  metric: MenuViewMetric,
  codes: {
    entry?: readonly string[]
    posts?: readonly string[]
    midRows?: ReadonlyArray<{
      id: string
      viewCodes: readonly string[]
      postCodes?: readonly string[]
    }>
  },
): MenuViewMetric {
  if (metric.kind === 'disabled') return metric
  if (metric.kind === 'simple') {
    return {
      kind: 'simple',
      entryViews: sumCodes(index, codes.entry ?? []),
    }
  }
  if (metric.kind === 'entry-posts') {
    return {
      kind: 'entry-posts',
      entryViews: sumCodes(index, codes.entry ?? []),
      postViews: sumCodes(index, codes.posts ?? []),
    }
  }
  if (metric.kind === 'transparency') {
    return {
      kind: 'transparency',
      entryViews: sumCodes(index, codes.entry ?? []),
      midRows: metric.midRows.map(row => {
        const spec = codes.midRows?.find(m => m.id === row.id)
        if (!spec) {
          return { ...row, viewCount: 0, postViewCount: row.postViewCount === undefined ? undefined : 0 }
        }
        return {
          ...row,
          viewCount: sumCodes(index, spec.viewCodes),
          postViewCount:
            row.postViewCount === undefined || !spec.postCodes
              ? undefined
              : sumCodes(index, spec.postCodes),
        }
      }),
    }
  }
  return metric
}

type SectionSpec = {
  section: MenuViewSection
  codes: {
    entry?: readonly string[]
    posts?: readonly string[]
    midRows?: ReadonlyArray<{
      id: string
      viewCodes: readonly string[]
      postCodes?: readonly string[]
    }>
  }
}

function buildSectionSpecs(): Record<MenuViewTabId, SectionSpec[]> {
  return {
    'ja-korea': [
      {
        section: {
          id: 'intro',
          title: '기관 소개',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['JA_ORGANIZATION_VIEW'] },
      },
      {
        section: {
          id: 'transparency',
          title: '투명경영',
          footnote: NTS_FOOTNOTE,
          metric: {
            kind: 'transparency',
            entryViews: 0,
            midRows: [
              { id: 'annual', label: '연차보고서', viewCount: 0, postViewCount: 0 },
              { id: 'audit', label: '회계감사 보고서', viewCount: 0, postViewCount: 0 },
              { id: 'nts', label: '국세청 공시 (이동)', viewCount: 0, isRedirect: true },
            ],
          },
        },
        codes: {
          entry: ['JA_TRANSPARENCY_VIEW'],
          midRows: [
            {
              id: 'annual',
              viewCodes: ['JA_TRANSPARENCY_ANNUAL_REPORT_LIST_VIEW'],
              postCodes: ['JA_TRANSPARENCY_ANNUAL_REPORT_DOWNLOAD'],
            },
            {
              id: 'audit',
              viewCodes: ['JA_TRANSPARENCY_AUDIT_REPORT_LIST_VIEW'],
              postCodes: ['JA_TRANSPARENCY_AUDIT_REPORT_DOWNLOAD'],
            },
            {
              id: 'nts',
              viewCodes: ['JA_TRANSPARENCY_DISCLOSURE_OUTBOUND_CLICK'],
            },
          ],
        },
      },
      {
        section: {
          id: 'notices',
          title: '공지사항',
          metric: { kind: 'entry-posts', entryViews: 0, postViews: 0 },
        },
        codes: {
          entry: ['JA_KOREA_NOTICE_LIST_VIEW'],
          posts: ['JA_KOREA_NOTICE_DETAIL_VIEW'],
        },
      },
      {
        section: {
          id: 'people',
          title: '함께하는 사람들',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['JA_PEOPLE_VIEW'] },
      },
      {
        section: {
          id: 'history',
          title: 'JA History',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['JA_HISTORY_VIEW'] },
      },
      {
        section: {
          id: 'recruit',
          title: '채용',
          metric: { kind: 'entry-posts', entryViews: 0, postViews: 0 },
        },
        codes: {
          entry: ['JA_RECRUIT_VIEW'],
          posts: ['JA_RECRUIT_POST_VIEW'],
        },
      },
    ],
    impact: [
      {
        section: {
          id: 'impact-main',
          title: '임팩트 스토리',
          metric: { kind: 'entry-posts', entryViews: 0, postViews: 0 },
        },
        codes: {
          entry: ['IMPACT_STORY_HOME_VIEW', 'IMPACT_STORY_LIST_VIEW'],
          posts: ['IMPACT_STORY_DETAIL_VIEW'],
        },
      },
    ],
    education: [
      {
        section: {
          id: 'career',
          title: '진로취업',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['EDU_CAREER_VIEW'] },
      },
      {
        section: {
          id: 'finance',
          title: '경제금융',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['EDU_ECONOMY_VIEW'] },
      },
      {
        section: {
          id: 'entrepreneur',
          title: '기업가 정신',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['EDU_ENTREPRENEURSHIP_VIEW'] },
      },
      {
        section: {
          id: 'digital',
          title: '디지털 리터러시',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['EDU_DIGITAL_LITERACY_VIEW'] },
      },
      {
        section: {
          id: 'textbook',
          title: '교재 소개',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['EDU_MATERIAL_LIST_VIEW'] },
      },
    ],
    participate: [
      {
        section: {
          id: 'program-apply',
          title: '프로그램 신청',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: {
          entry: ['PARTICIPATION_APPLY_VIEW'],
        },
      },
      {
        section: {
          id: 'result-check',
          title: '결과 확인',
          metric: { kind: 'disabled', message: DISABLED_MENU_MESSAGE },
        },
        codes: {},
      },
      {
        section: {
          id: 'online-learning',
          title: '온라인 학습',
          footnote: ONLINE_LEARNING_FOOTNOTE,
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['PARTICIPATION_ONLINE_CLICK'] },
      },
      {
        section: {
          id: 'alumni',
          title: 'Alumni',
          footnote: ALUMNI_FOOTNOTE,
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['PARTICIPATION_ALUMNI_CLICK'] },
      },
    ],
    sponsor: [
      {
        section: {
          id: 'individual',
          title: '개인후원',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: {
          entry: ['DONATION_PERSONAL_VIEW', 'DONATION_OUTBOUND_CLICK'],
        },
      },
      {
        section: {
          id: 'corporate',
          title: '기업후원',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['DONATION_CORPORATE_VIEW'] },
      },
      {
        section: {
          id: 'talent',
          title: '재능기부',
          metric: { kind: 'simple', entryViews: 0 },
        },
        codes: { entry: ['SPONSOR_TALENT_VIEW'] },
      },
    ],
  }
}

function mapSummary(response: MenuStatistics): MenuViewSummary {
  const byTop = new Map<string, number>()
  for (const top of response.menus ?? []) {
    if (top.topMenu) byTop.set(top.topMenu, n(top.eventCount))
  }
  const jaKorea = n(byTop.get(TopMenuStatisticsTopMenu.JA_KOREA))
  const impact = n(byTop.get(TopMenuStatisticsTopMenu.IMPACT_STORY))
  const education = n(byTop.get(TopMenuStatisticsTopMenu.EDUCATION))
  const participate = n(byTop.get(TopMenuStatisticsTopMenu.PARTICIPATION))
  const sponsor = n(byTop.get(TopMenuStatisticsTopMenu.SPONSORSHIP))
  return {
    jaKorea,
    impact,
    education,
    participate,
    sponsor,
    total: jaKorea + impact + education + participate + sponsor,
  }
}

export function mapMenuStatisticsToDomain(
  response: MenuStatistics,
  period: MenuViewPeriod,
): MenuViewStatsResult {
  const index = buildMetricIndex(response)
  const specs = buildSectionSpecs()
  const sectionsByTab = {} as Record<MenuViewTabId, MenuViewSection[]>

  for (const tab of Object.keys(specs) as MenuViewTabId[]) {
    sectionsByTab[tab] = specs[tab].map(({ section, codes }) => ({
      ...section,
      metric: fillMetric(index, section.metric, codes),
    }))
  }

  return {
    period: {
      from: response.from ?? period.from,
      to: response.to ?? period.to,
    },
    summary: mapSummary(response),
    sectionsByTab,
  }
}
