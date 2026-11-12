/**
 * 프로그램 등록 완료 전 「공고 게시」 확인 (QA-0121).
 *
 * 공고 게시 기본값은 「미게시」다. 관리자가 모집 탭에서 「게시」를 고른 채 등록하면
 * 사용자 홈페이지에 모집 공고가 노출되므로, 등록 직전에 노출 대상·시점을 한 번 더 확인받는다.
 * 판정은 등록 저장과 같은 스냅샷(`buildCurrentProgramSnapshot`)의 모집 정보를 쓴다.
 */
import type { Program } from '@/types/domain'

export const ANNOUNCEMENT_PUBLISH_CONFIRM_TITLE = '모집 공고 게시 확인'

export type PublishedRecruitAnnouncement = {
  /** 노출 대상 — 모집 탭 이름 */
  audienceLabel: string
  /** 모집 기간 표시(없으면 null) */
  recruitmentPeriodLabel: string | null
}

function periodLabel(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? ''
  return trimmed === '' || trimmed === '-' ? null : trimmed
}

/** 「게시」로 저장될 모집 탭 목록 (참여자 → 강사 → 봉사자 순) */
export function listPublishedRecruitAnnouncements(program: Program): PublishedRecruitAnnouncement[] {
  const info = program.generalCommonInfo
  if (info == null) return []
  const items: PublishedRecruitAnnouncement[] = []
  if (info.participantRecruitmentInfo?.announcementPublished === true) {
    items.push({
      audienceLabel: '참여자 모집',
      recruitmentPeriodLabel: periodLabel(info.participantRecruitmentInfo.recruitmentPeriodLabel),
    })
  }
  if (info.instructorRecruitmentInfo?.announcementPublished === true) {
    items.push({
      audienceLabel: '강사 모집',
      recruitmentPeriodLabel: periodLabel(info.instructorRecruitmentInfo.recruitmentPeriodLabel),
    })
  }
  if (info.volunteerRecruitmentInfo?.announcementPublished === true) {
    items.push({
      audienceLabel: '봉사자 모집',
      recruitmentPeriodLabel: periodLabel(info.volunteerRecruitmentInfo.recruitmentPeriodLabel),
    })
  }
  return items
}

/** 확인 팝업 본문 */
export function buildAnnouncementPublishConfirmContent(
  items: readonly PublishedRecruitAnnouncement[]
): string {
  const lines = items.map(item =>
    item.recruitmentPeriodLabel
      ? `· ${item.audienceLabel} (모집 기간: ${item.recruitmentPeriodLabel})`
      : `· ${item.audienceLabel}`
  )
  return [
    '아래 모집 공고가 「게시」로 설정되어 있습니다.',
    ...lines,
    '',
    '등록을 완료하면 사용자 홈페이지 모집 공고에 바로 노출됩니다.',
    '이대로 등록하시겠습니까?',
  ].join('\n')
}
