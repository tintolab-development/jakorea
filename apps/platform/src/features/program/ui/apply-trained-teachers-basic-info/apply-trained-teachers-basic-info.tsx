import { PFText, PFTextInput } from '@/shared/ui'
import styles from './apply-trained-teachers-basic-info.module.css'

export type ApplyTrainedTeachersBasicInfoValues = {
  schoolName: string
  classCount: string
  studentCount: string
}

type ApplyTrainedTeachersBasicInfoProps = {
  value: ApplyTrainedTeachersBasicInfoValues
  onChange: (next: ApplyTrainedTeachersBasicInfoValues) => void
  /** 프로필 학교명 — 있으면 학교명 필드 잠금 */
  schoolNameLocked?: boolean
}

export function ApplyTrainedTeachersBasicInfo({
  value,
  onChange,
  schoolNameLocked = false,
}: ApplyTrainedTeachersBasicInfoProps) {
  const patch = (partial: Partial<ApplyTrainedTeachersBasicInfoValues>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <PFText as="p" typo="bd-sm-md" color="neutral-cool-700" className={styles.fieldLabel}>
          학교명
        </PFText>
        <PFTextInput
          variant="formPage"
          size="large"
          placeholder="학교명을 입력해 주세요"
          value={value.schoolName}
          disabled={schoolNameLocked}
          onValueChange={next => patch({ schoolName: next })}
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <PFText as="p" typo="bd-sm-md" color="neutral-cool-700" className={styles.fieldLabel}>
            학급 수
          </PFText>
          <PFTextInput
            variant="formPage"
            size="large"
            inputMode="numeric"
            placeholder="학급 수"
            value={value.classCount}
            onValueChange={next => patch({ classCount: next.replace(/[^\d]/g, '') })}
          />
        </div>
        <div className={styles.field}>
          <PFText as="p" typo="bd-sm-md" color="neutral-cool-700" className={styles.fieldLabel}>
            학생 수
          </PFText>
          <PFTextInput
            variant="formPage"
            size="large"
            inputMode="numeric"
            placeholder="학생 수"
            value={value.studentCount}
            onValueChange={next => patch({ studentCount: next.replace(/[^\d]/g, '') })}
          />
        </div>
      </div>
    </div>
  )
}

export function emptyTrainedTeachersBasicInfo(): ApplyTrainedTeachersBasicInfoValues {
  return { schoolName: '', classCount: '', studentCount: '' }
}

export function basicInfoAnswerFromValues(
  values: ApplyTrainedTeachersBasicInfoValues,
): Record<string, unknown> | null {
  const schoolName = values.schoolName.trim()
  if (!schoolName) return null
  const classCount = Number.parseInt(values.classCount, 10)
  const studentCount = Number.parseInt(values.studentCount, 10)
  return {
    schoolName,
    ...(Number.isFinite(classCount) && classCount > 0 ? { classCount } : {}),
    ...(Number.isFinite(studentCount) && studentCount > 0 ? { studentCount } : {}),
  }
}

export function basicInfoValuesFromDraftAnswer(
  answer: unknown,
): ApplyTrainedTeachersBasicInfoValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const schoolName = typeof row.schoolName === 'string' ? row.schoolName : ''
  const classCount =
    typeof row.classCount === 'number'
      ? String(row.classCount)
      : typeof row.classCount === 'string'
        ? row.classCount
        : ''
  const studentCount =
    typeof row.studentCount === 'number'
      ? String(row.studentCount)
      : typeof row.studentCount === 'string'
        ? row.studentCount
        : ''
  if (!schoolName && !classCount && !studentCount) return null
  return { schoolName, classCount, studentCount }
}
