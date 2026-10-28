import { CmsRadio, CmsRadioGroup, type CmsRadioSize } from '@/shared/ui/cms-radio'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
  type ParticipantRecruitmentAnnouncementPublishedValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'

const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

export function ParticipantRecruitmentAnnouncementPublishedRadios({
  value,
  onChange,
  size = 'medium',
}: {
  value: ParticipantRecruitmentAnnouncementPublishedValue | '' | undefined
  onChange: (next: ParticipantRecruitmentAnnouncementPublishedValue) => void
  /** 프로그램 상세·모집 양식 수정은 14px(medium). */
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
