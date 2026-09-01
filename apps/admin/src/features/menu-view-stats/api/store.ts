/**
 * 메뉴별 조회 통계 — 로컬 seed
 * 시안 수치: 요약 20/0/0/9/15 · total 44, 세부 대메뉴 9 · 게시글 15
 */

import {
  ALUMNI_FOOTNOTE,
  DISABLED_MENU_MESSAGE,
  NTS_FOOTNOTE,
  ONLINE_LEARNING_FOOTNOTE,
  type MenuViewPeriod,
  type MenuViewSection,
  type MenuViewStatsResult,
  type MenuViewSummary,
  type MenuViewTabId,
} from '@/entities/menu-view-stats/model/types'

function n(v: number | undefined | null): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function buildSummary(): MenuViewSummary {
  const jaKorea = 20
  const impact = 0
  const education = 0
  const participate = 9
  const sponsor = 15
  return {
    jaKorea,
    impact,
    education,
    participate,
    sponsor,
    total: jaKorea + impact + education + participate + sponsor,
  }
}

function buildSections(): Record<MenuViewTabId, MenuViewSection[]> {
  return {
    'ja-korea': [
      {
        id: 'intro',
        title: '기관 소개',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'transparency',
        title: '투명경영',
        footnote: NTS_FOOTNOTE,
        metric: {
          kind: 'transparency',
          entryViews: 9,
          midRows: [
            {
              id: 'annual',
              label: '연차보고서',
              viewCount: 9,
              postViewCount: 15,
            },
            {
              id: 'audit',
              label: '회계감사 보고서',
              viewCount: 9,
              postViewCount: 15,
            },
            {
              id: 'nts',
              label: '국세청 공시 (이동)',
              viewCount: 9,
              isRedirect: true,
            },
          ],
        },
      },
      {
        id: 'notices',
        title: '공지사항',
        metric: { kind: 'entry-posts', entryViews: 9, postViews: 15 },
      },
      {
        id: 'people',
        title: '함께하는 사람들',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'history',
        title: 'JA History',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'recruit',
        title: '채용',
        metric: { kind: 'entry-posts', entryViews: 9, postViews: 15 },
      },
    ],
    impact: [
      {
        id: 'impact-main',
        title: '임팩트 스토리',
        metric: { kind: 'entry-posts', entryViews: 9, postViews: 15 },
      },
    ],
    education: [
      {
        id: 'career',
        title: '진로취업',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'finance',
        title: '경제금융',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'entrepreneur',
        title: '기업가 정신',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'digital',
        title: '디지털 리터러시',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'textbook',
        title: '교재 소개',
        metric: { kind: 'simple', entryViews: 9 },
      },
    ],
    participate: [
      {
        id: 'program-apply',
        title: '프로그램 신청',
        metric: { kind: 'entry-posts', entryViews: 9, postViews: 15 },
      },
      {
        id: 'result-check',
        title: '결과 확인',
        metric: { kind: 'disabled', message: DISABLED_MENU_MESSAGE },
      },
      {
        id: 'online-learning',
        title: '온라인 학습',
        footnote: ONLINE_LEARNING_FOOTNOTE,
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'alumni',
        title: 'Alumni',
        footnote: ALUMNI_FOOTNOTE,
        metric: { kind: 'simple', entryViews: 9 },
      },
    ],
    sponsor: [
      {
        id: 'individual',
        title: '개인후원',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'corporate',
        title: '기업후원',
        metric: { kind: 'simple', entryViews: 9 },
      },
      {
        id: 'talent',
        title: '재능기부',
        metric: { kind: 'simple', entryViews: 9 },
      },
    ],
  }
}

function normalizeMetricCounts(
  sections: Record<MenuViewTabId, MenuViewSection[]>
): Record<MenuViewTabId, MenuViewSection[]> {
  const out = {} as Record<MenuViewTabId, MenuViewSection[]>
  for (const tab of Object.keys(sections) as MenuViewTabId[]) {
    out[tab] = sections[tab].map(section => {
      const m = section.metric
      if (m.kind === 'simple') {
        return { ...section, metric: { ...m, entryViews: n(m.entryViews) } }
      }
      if (m.kind === 'entry-posts') {
        return {
          ...section,
          metric: {
            ...m,
            entryViews: n(m.entryViews),
            postViews: n(m.postViews),
          },
        }
      }
      if (m.kind === 'transparency') {
        return {
          ...section,
          metric: {
            ...m,
            entryViews: n(m.entryViews),
            midRows: m.midRows.map(row => ({
              ...row,
              viewCount: n(row.viewCount),
              postViewCount:
                row.postViewCount === undefined
                  ? undefined
                  : n(row.postViewCount),
            })),
          },
        }
      }
      return section
    })
  }
  return out
}

/** period 별 seed (현재 기간 무관 동일 값 · 백엔드 연동 전) */
export async function readMenuViewStats(
  period: MenuViewPeriod
): Promise<MenuViewStatsResult> {
  const summary = buildSummary()
  const sectionsByTab = normalizeMetricCounts(buildSections())
  return {
    period: { from: period.from, to: period.to },
    summary: {
      jaKorea: n(summary.jaKorea),
      impact: n(summary.impact),
      education: n(summary.education),
      participate: n(summary.participate),
      sponsor: n(summary.sponsor),
      total:
        n(summary.jaKorea) +
        n(summary.impact) +
        n(summary.education) +
        n(summary.participate) +
        n(summary.sponsor),
    },
    sectionsByTab,
  }
}
