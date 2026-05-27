import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeminiRecruitmentDetail } from '../../model/recruitment/detail-types'
import { StatusBadge } from '@/shared/components/status-badge'
import {
  formatRecruitmentAuditLine,
  formatRecruitmentPeriodRange,
} from '../../lib/recruitment/format-period'
import {
  geminiRecruitmentStatusToEnrollmentDisplay,
  resolveRecruitmentStatus,
} from '../../lib/recruitment/resolve-status'
import './recruitment-info-tab.css'

export function GeminiRecruitmentInfoTab({
  detail,
  todayKey,
}: {
  detail: GeminiRecruitmentDetail
  todayKey: string
}) {
  const status = resolveRecruitmentStatus(
    detail.applicationPeriodStart,
    detail.applicationPeriodEnd,
    dayjs(todayKey)
  )

  return (
    <div className="gemini-recruitment-info-tab">
      <div className="gemini-recruitment-info-tab__basic-info" role="group" aria-label="기본 정보">
        <DetailInfoForm title="기본 정보" mode="view" className="program-registration-paragraph">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최초 등록일"
              view={formatRecruitmentAuditLine(detail.createdAt, detail.createdByName)}
            />
            <DetailInfoForm.Field
              label="마지막 수정일"
              view={formatRecruitmentAuditLine(detail.updatedAt, detail.updatedByName)}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm
          title="기본 정보"
          hideHeader
          mode="view"
          className="program-registration-paragraph gemini-recruitment-info-tab__basic-info-block"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="공고명" view={detail.title} />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="신청 기간"
              view={formatRecruitmentPeriodRange(
                detail.applicationPeriodStart,
                detail.applicationPeriodEnd
              )}
            />
            <DetailInfoForm.Field
              label="연수 요청 가능 기간"
              view={formatRecruitmentPeriodRange(
                detail.trainingRequestPeriodStart,
                detail.trainingRequestPeriodEnd
              )}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최소 수강 인원"
              view={detail.minStudentCount.toLocaleString('ko-KR')}
            />
            <DetailInfoForm.Field
              label="프로그램 진행 현황"
              view={
                <StatusBadge
                  domain="programEnrollment"
                  status={geminiRecruitmentStatusToEnrollmentDisplay(status)}
                  variant="text"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <DetailInfoForm title="연수 내용" mode="view" className="gemini-recruitment-info-tab__training">
        <DetailInfoForm.Row type="custom">
          <div className="gemini-recruitment-info-tab__training-body">{detail.trainingContent}</div>
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
