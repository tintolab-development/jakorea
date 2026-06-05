import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
  type ParticipantRecruitmentAnnouncementPublishedValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'

const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

export function ParticipantRecruitmentAnnouncementPublishedRadios({
  value,
  onChange,
}: {
  value: ParticipantRecruitmentAnnouncementPublishedValue | undefined
  onChange: (next: ParticipantRecruitmentAnnouncementPublishedValue) => void
}) {
  return (
    <CmsRadioGroup
      size="large"
      value={value}
      onChange={e => onChange(e.target.value as ParticipantRecruitmentAnnouncementPublishedValue)}
      className={RECRUITMENT_RADIO_CLASS}
    >
      {ANNOUNCEMENT_PUBLISHED_OPTIONS.map(option => (
        <CmsRadio key={option.value} value={option.value} size="large">
          {option.label}
        </CmsRadio>
      ))}
    </CmsRadioGroup>
  )
}
