import type { EducationTeacherApplicationInstitution } from '../../model/types'
import { PFFormField, PFFormFieldRow, PFFormFieldTable } from '@/shared/ui'
import styles from './teacher-application-content.module.css'

type InstitutionInfoTableProps = {
  institution: EducationTeacherApplicationInstitution
}

export function InstitutionInfoTable({ institution }: InstitutionInfoTableProps) {
  const showPreferredForm = Boolean(institution.preferredEducationForm?.trim())
  const venue = institution.venue?.trim() ?? ''

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
          <p className={styles.fieldValue}>{institution.classAndHeadcount}</p>
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
          <p className={styles.fieldValue}>{institution.teacherContact}</p>
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
