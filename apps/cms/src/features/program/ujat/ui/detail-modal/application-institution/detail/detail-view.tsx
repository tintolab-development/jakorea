import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { UjatInstitutionApplicationStatusBadge } from '../list/status-badge'
import {
  HomeAddressPrivacyValue,
  UjatInstitutionTeacherInfoValue,
} from './detail-display'
import type { UjatInstitutionApplicationDetail } from './detail-types'
import {
  ClassTimeTable,
  PipeSeparatedValues,
} from '../shared/institution-detail-shared'

export function UjatInstitutionApplicationDetailView({
  detail,
  personalInfoRevealed,
}: {
  detail: UjatInstitutionApplicationDetail
  personalInfoRevealed: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <DetailInfoForm title="임시 배정 현황" mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="임시 배정 현황"
            fullRow
            view={<UjatInstitutionApplicationStatusBadge status={detail.tempAssignmentStatus} />}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="기본 정보" mode="view">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="신청 기관명" view={detail.institutionName} />
          <DetailInfoForm.Field label="신청 지역" view={detail.regionLabel} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="기관 소재지" view={detail.address} />
          <DetailInfoForm.Field label="상세 주소" view={detail.addressDetail} />
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
          <DetailInfoForm.Field label="기타 요청사항" fullRow view={detail.otherRequests} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="학년 별 신청 정보" mode="view">
        {detail.gradeBlocks.map((block, blockIndex) => (
          <DetailInfoForm.Row key={`${block.gradeLabel}-${blockIndex}`} type="single">
            <DetailInfoForm.Field
              label={`${block.gradeLabel} (${block.classCount}학급)`}
              fullRow
              view={
                <PipeSeparatedValues
                  parts={block.classes.map(classRow => (
                    <span key={classRow.classNo}>
                      {classRow.classNo}반 : {classRow.studentCount}명
                    </span>
                  ))}
                />
              }
            />
          </DetailInfoForm.Row>
        ))}
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
                    <span key={date}>{date}</span>
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
