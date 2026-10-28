import { CmsRadio, CmsRadioGroup, type CmsRadioSize } from '@/shared/ui/cms-radio'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
  type ParticipantRecruitmentAnnouncementPublishedValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'

const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

export function ParticipantRecruitmentAnnouncementPublishedRadios({
  value,
  onChange,
  size = 'large',
}: {
  value: ParticipantRecruitmentAnnouncementPublishedValue | undefined
  onChange: (next: ParticipantRecruitmentAnnouncementPublishedValue) => void
  /** 참여 기관 모집 정보는 학생 명단 제출 여부와 같은 medium. 그 외 화면은 large. */
  size?: CmsRadioSize
}) {
  return (
    <CmsRadioGroup
      size={size}
      value={value}
      onChange={e => onChange(e.target.value as ParticipantRecruitmentAnnouncementPublishedValue)}
      className={RECRUITMENT_RADIO_CLASS}
    >
      {ANNOUNCEMENT_PUBLISHED_OPTIONS.map(option => (
        <CmsRadio key={option.value} value={option.value} size={size}>
          {option.label}
        </CmsRadio>
      ))}
    </CmsRadioGroup>
  )
}
