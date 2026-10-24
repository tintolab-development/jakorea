import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatNumberDisplay } from '@/shared/utils'
import { UjatInstitutionApplicationStatusBadge } from '../list/status-badge'
import {
  HomeAddressPrivacyValue,
  UjatInstitutionTeacherInfoValue,
} from './detail-display'
import type { UjatInstitutionApplicationDetail } from './detail-types'
import { formatUjatPreferredEducationDateDisplay } from '../education-schedule'
import {
  ClassTimeTable,
  PipeSeparatedValues,
} from '../shared/institution-detail-shared'
import './detail-page.css'

function displayOrDash(value: string | null | undefined): string {
  return value?.trim() || '-'
}

export function UjatInstitutionApplicationDetailView({
  detail,
  personalInfoRevealed,
}: {
  detail: UjatInstitutionApplicationDetail
  personalInfoRevealed: boolean
}) {
  return (
    <div className="ujat-institution-application-detail-view">
      <DetailInfoForm title="기본 정보" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="임시 배정 현황"
            fullRow
            view={
              <UjatInstitutionApplicationStatusBadge status={detail.tempAssignmentStatus} />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="신청 기관명" view={displayOrDash(detail.institutionName)} />
          <DetailInfoForm.Field label="신청 지역" view={displayOrDash(detail.regionLabel)} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="기관 소재지" view={displayOrDash(detail.address)} />
          <DetailInfoForm.Field label="상세 주소" view={displayOrDash(detail.addressDetail)} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="담당 교사 정보"
            fullRow
            view={
              <UjatInstitutionTeacherInfoValue
                contact={detail.teacherContact}
                revealed={personalInfoRevealed}
              />
            }
          />
        </DetailInfoForm.Row>
        {detail.teacherHomeAddress ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="담당 교사 자택 주소"
              fullRow
              view={
                <HomeAddressPrivacyValue
                  address={detail.teacherHomeAddress}
                  revealed={personalInfoRevealed}
                />
              }
            />
          </DetailInfoForm.Row>
        ) : null}
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="기타 요청사항"
            fullRow
            view={displayOrDash(detail.otherRequests)}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="학년 별 신청 정보" mode="view">
        {detail.gradeBlocks.length === 0 ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="학년 별 신청 정보" fullRow view="-" />
          </DetailInfoForm.Row>
        ) : (
          detail.gradeBlocks.map((block, blockIndex) => (
            <DetailInfoForm.Row key={`${block.gradeLabel}-${blockIndex}`} type="single">
              <DetailInfoForm.Field
                label={`${block.gradeLabel} (${formatNumberDisplay(block.classCount)}학급)`}
                fullRow
                view={
                  block.classes.length > 0 ? (
                    <PipeSeparatedValues
                      parts={block.classes.map(classRow => (
                        <span key={classRow.classNo}>
                          {classRow.classNo}반 : {formatNumberDisplay(classRow.studentCount)}명
                        </span>
                      ))}
                    />
                  ) : (
                    '-'
                  )
                }
              />
            </DetailInfoForm.Row>
          ))
        )}
      </DetailInfoForm>

      <DetailInfoForm title="학년 별 수업 시간" mode="view">
        <DetailInfoForm.Row type="custom">
          <ClassTimeTable rows={detail.classTimeRows} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="진행 희망 교육 일정" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 희망일"
            fullRow
            view={
              detail.preferredEducationDates.length > 0 ? (
                <PipeSeparatedValues
                  parts={detail.preferredEducationDates.map(date => (
                    <span key={date}>{formatUjatPreferredEducationDateDisplay(date)}</span>
                  ))}
                />
              ) : (
                '-'
              )
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
