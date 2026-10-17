import type { EducationTeacherApplicationInstitution } from '../../model/types'
import { PFFormField, PFFormFieldRow, PFFormFieldTable } from '@/shared/ui'
import { PipeSeparatedFieldValue } from './pipe-separated-field-value'
import styles from './teacher-application-content.module.css'

type InstitutionInfoTableProps = {
  institution: EducationTeacherApplicationInstitution
  /** 프로그램 `educationForm === 'participant_choice'`일 때만 희망 교육 형태·교육 장소 노출 */
  showPreferredEducationForm?: boolean
}

export function InstitutionInfoTable({
  institution,
  showPreferredEducationForm = false,
}: InstitutionInfoTableProps) {
  const showPreferredForm =
    showPreferredEducationForm && Boolean(institution.preferredEducationForm?.trim())
  const venue =
    showPreferredEducationForm && institution.venue?.trim() ? institution.venue.trim() : ''

  return (
    <PFFormFieldTable>
      <PFFormFieldRow type="double">
        <PFFormField label="신청 기관명" labelWidth="wider">
          <p className={styles.fieldValue}>{institution.name}</p>
        </PFFormField>
        <PFFormField label="신청 학년" labelWidth="wider">
          <p className={styles.fieldValue}>{institution.grade}</p>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="double">
        <PFFormField label="기관 소재지" labelWidth="wider">
          <p className={styles.fieldValue}>{institution.address}</p>
        </PFFormField>
        <PFFormField label="상세주소" labelWidth="wider">
          <p className={styles.fieldValue}>{institution.addressDetail}</p>
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
            <p className={styles.fieldValue}>{institution.preferredEducationForm}</p>
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
          <p className={styles.fieldValue}>{institution.reason}</p>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow>
        <PFFormField label="기타 요청사항" labelWidth="wider" fullWidth>
          <p className={styles.fieldValue}>{institution.otherRequests}</p>
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
