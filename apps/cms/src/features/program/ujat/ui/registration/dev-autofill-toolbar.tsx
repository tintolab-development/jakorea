import { useState } from 'react'
import {
  UJAT_DEV_AUTOFILL_CASE_DESCRIPTIONS,
  UJAT_DEV_AUTOFILL_CASE_IDS,
  UJAT_DEV_AUTOFILL_CASE_LABELS,
  isUjatDevAutofillCaseId,
  type UjatDevAutofillCaseId,
} from '@/features/program/ujat/lib/dev-autofill-cases'
import {
  applyUjatDevAutofillCase,
  UjatDevAutofillError,
  type UjatDevAutofillResult,
} from '@/features/program/ujat/lib/apply-dev-autofill'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'

type UjatDevAutofillToolbarProps = {
  caseId: UjatDevAutofillCaseId
  businessYear: number
  onCaseIdChange: (caseId: UjatDevAutofillCaseId) => void
}

function resultContent(result: UjatDevAutofillResult) {
  return (
    <div style={{ whiteSpace: 'pre-line' }}>
      {[
        `${result.caseLabel} (${result.businessYear}년) 값을 6단계에 채웠습니다.`,
        `프로그램 관리명: ${result.programManagementName}`,
        '프로그램 등록은 [등록] 버튼을 눌러야 진행됩니다.',
        result.manualInputRequired.length > 0
          ? `직접 입력 필요: ${result.manualInputRequired.join(', ')}`
          : '',
        result.incompleteRequiredFields.length > 0
          ? `필수 미입력: ${result.incompleteRequiredFields.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')}
    </div>
  )
}

/** UJAT 등록 — DEV 6케이스 자동입력. 폼 값만 채우고 서버에는 저장하지 않는다. */
export function UjatDevAutofillToolbar({
  caseId,
  businessYear,
  onCaseIdChange,
}: UjatDevAutofillToolbarProps) {
  const { showAlert } = useCmsAlert()
  const [running, setRunning] = useState(false)

  if (!import.meta.env.DEV) return null

  const handleAutofill = async () => {
    if (running) return
    setRunning(true)
    try {
      const result = await applyUjatDevAutofillCase({ caseId, businessYear })
      window.dispatchEvent(
        new CustomEvent('cms:registration-dev-autofill-complete', {
          detail: {
            typedEducationSchedule: result.typedEducationSchedule,
            typedBasicInfo: result.typedBasicInfo,
            typedRecruitment: result.typedRecruitment,
          },
        })
      )
      showAlert({ title: '자동입력 완료', content: resultContent(result) })
    } catch (error) {
      showAlert({
        title: '자동입력 실패',
        content: (
          <div style={{ whiteSpace: 'pre-line' }}>
            {error instanceof UjatDevAutofillError || error instanceof Error
              ? error.message
              : '자동입력 중 오류가 발생했습니다.'}
            {'\n입력값은 변경되지 않았습니다.'}
          </div>
        ),
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="ujat-dev-autofill-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <CmsSelect
        aria-label="UJAT 개발용 자동입력 케이스"
        inputSize="small"
        width={200}
        title={UJAT_DEV_AUTOFILL_CASE_DESCRIPTIONS[caseId]}
        value={caseId}
        disabled={running}
        options={UJAT_DEV_AUTOFILL_CASE_IDS.map(id => ({
          value: id,
          label: UJAT_DEV_AUTOFILL_CASE_LABELS[id],
        }))}
        onChange={value => {
          if (isUjatDevAutofillCaseId(value)) onCaseIdChange(value)
        }}
      />
      <CmsButton
        variant="secondary"
        type="button"
        loading={running}
        disabled={running}
        onClick={() => void handleAutofill()} >
        자동입력(개발용)
      </CmsButton>
    </div>
  )
}
