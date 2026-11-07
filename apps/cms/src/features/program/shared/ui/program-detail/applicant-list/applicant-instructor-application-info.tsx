import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import './applicant-instructor-application-info.css'

export interface ApplicantInstructorApplicationInfoData {
  officialDocumentRequired?: boolean | null
  officialDocumentRequiredInfo?: string | null
  institutionName?: string | null
  trainingDate?: string | null
  trainingTimeText?: string | null
}

function formatTrainingDate(value?: string | null): string {
  const trimmed = value?.trim() ?? ''
  const parsed = dayjs(trimmed.replace(/\./gu, '-'))
  return parsed.isValid() ? parsed.format('YYYY년 M월 D일') : trimmed || '-'
}

function formatTrainingTime(value?: string | null): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  return trimmed
    .replace(/\s*[~〜]\s*/gu, ' ~ ')
    .replace(/\s*\(\d+차시\)\s*$/u, '')
    .trim()
}

function formatAvailableSchedule(data: ApplicantInstructorApplicationInfoData): string {
  const institutionName = data.institutionName?.trim() ?? ''
  const date = formatTrainingDate(data.trainingDate)
  const time = formatTrainingTime(data.trainingTimeText)
  const schedule = time && date !== '-' ? `${date} (${time})` : date
  if (!institutionName && schedule === '-') return '-'
  if (!institutionName) return schedule
  if (schedule === '-') return institutionName
  return `${institutionName} : ${schedule}`
}

function formatOfficialDocumentRequired(value?: boolean | null): string {
  if (value === true) return '필요'
  if (value === false) return '불필요'
  return '-'
}

export function ApplicantInstructorApplicationInfo({
  data,
}: {
  data: ApplicantInstructorApplicationInfoData
}) {
  return (
    <section className="applicant-instructor-application-info">
      <DetailInfoForm title="신청 정보">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공문 필요 여부"
            view={formatOfficialDocumentRequired(data.officialDocumentRequired)}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label="공문 필요 정보"
            view={data.officialDocumentRequiredInfo?.trim() || '-'}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="강의 진행 가능 일정"
            fullRow
            view={formatAvailableSchedule(data)}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </section>
  )
}
