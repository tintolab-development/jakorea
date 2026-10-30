import type { EducationTeacherApplicationInstitution } from '../../model/types'
import { PFFormField, PFFormFieldRow, PFFormFieldTable } from '@/shared/ui'
import { PipeSeparatedFieldValue } from './pipe-separated-field-value'
import styles from './teacher-application-content.module.css'

type InstitutionInfoTableProps = {
  institution: EducationTeacherApplicationInstitution
  /** 참여자 선택 또는 교육받은 교사 프로그램에서 희망 교육 형태·교육 장소 노출 */
  showPreferredEducationForm?: boolean
}

function displayInstitutionField(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || '-'
}

export function InstitutionInfoTable({
  institution,
  showPreferredEducationForm = false,
}: InstitutionInfoTableProps) {
  const showPreferredForm =
    showPreferredEducationForm && Boolean(institution.preferredEducationForm?.trim())
  const venue =
    showPreferredEducationForm && institution.venue?.trim() ? institution.venue.trim() : ''

  const showGeminiTrainingFields =
    Boolean(institution.studentCount?.trim()) ||
    Boolean(institution.jobTitle?.trim()) ||
    Boolean(institution.subject?.trim())

  return (
    <PFFormFieldTable>
      {showGeminiTrainingFields ? (
        <>
          <PFFormFieldRow type="double">
            <PFFormField label="수강 인원" labelWidth="wider">
              <p className={styles.fieldValue}>{displayInstitutionField(institution.studentCount)}</p>
            </PFFormField>
            <PFFormField label="직급" labelWidth="wider">
              <p className={styles.fieldValue}>{displayInstitutionField(institution.jobTitle)}</p>
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow type="single">
            <PFFormField label="담당 과목" labelWidth="wider" fullWidth>
              <p className={styles.fieldValue}>{displayInstitutionField(institution.subject)}</p>
            </PFFormField>
          </PFFormFieldRow>
        </>
      ) : null}
      <PFFormFieldRow type="double">
        <PFFormField label="신청 기관명" labelWidth="wider">
          <p className={styles.fieldValue}>{displayInstitutionField(institution.name)}</p>
        </PFFormField>
        <PFFormField label="신청 학년" labelWidth="wider">
          <p className={styles.fieldValue}>{displayInstitutionField(institution.grade)}</p>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="double">
        <PFFormField label="기관 소재지" labelWidth="wider">
          <p className={styles.fieldValue}>{displayInstitutionField(institution.address)}</p>
        </PFFormField>
        <PFFormField label="상세주소" labelWidth="wider">
          <p className={styles.fieldValue}>{displayInstitutionField(institution.addressDetail)}</p>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type={showPreferredForm ? 'double' : 'single'}>
        <PFFormField
          label="신청 학급 수 및 총 인원"
          labelWidth="wider"
          fullWidth={!showPreferredForm}
        >
          <PipeSeparatedFieldValue value={institution.classAndHeadcount} />
        </PFFormField>
        {showPreferredForm ? (
          <PFFormField label="희망 교육 형태" labelWidth="wider">
            <p className={styles.fieldValue}>
              {displayInstitutionField(institution.preferredEducationForm)}
            </p>
          </PFFormField>
        ) : null}
      </PFFormFieldRow>
      {venue ? (
        <PFFormFieldRow>
          <PFFormField label="교육 장소" labelWidth="wider" fullWidth>
            <p className={styles.fieldValue}>{venue}</p>
          </PFFormField>
        </PFFormFieldRow>
      ) : null}
      <PFFormFieldRow>
        <PFFormField label="담당 교사 정보" labelWidth="wider" fullWidth>
          <PipeSeparatedFieldValue value={institution.teacherContact} />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow>
        <PFFormField label="신청 사유" labelWidth="wider" fullWidth>
          <p className={styles.fieldValue}>{displayInstitutionField(institution.reason)}</p>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow>
        <PFFormField label="기타 요청사항" labelWidth="wider" fullWidth>
          <p className={styles.fieldValue}>{displayInstitutionField(institution.otherRequests)}</p>
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
