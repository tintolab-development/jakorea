import { useMemo } from 'react'
import { Alert, Checkbox, Radio, Spin, Typography } from 'antd'
import type { ProgramMaterialCandidateResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialCandidateResponse'
import type { ProgramMaterialResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialResponse'
import {
  type ProgramMaterialAssignmentStatus,
  type ProgramMaterialAssignmentItemRequest,
} from '@/features/program/general/api/program-materials-api-client'
import {
  useProgramMaterialEditorState,
  useProgramMaterials,
} from '@/features/program/general/hooks/use-program-materials'
import { CmsButton } from '@/shared/ui'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import './program-materials-section.css'

type MaterialEditorMode = ProgramMaterialAssignmentStatus

function materialKey(item: { textbookId?: number; kitId?: number; kitVersionId?: number }): string {
  return `${item.textbookId ?? ''}:${item.kitId ?? ''}:${item.kitVersionId ?? ''}`
}

function statusLabel(status: ProgramMaterialAssignmentStatus): string {
  if (status === 'NONE') return '교재 없음'
  if (status === 'ASSIGNED') return '교재 설정'
  return '미결정'
}

function candidateLabel(candidate: ProgramMaterialCandidateResponse): string {
  const name = candidate.textbookNameKo?.trim() || candidate.textbookNameEn?.trim() || '교재명 없음'
  const kit = candidate.kitName?.trim()
  const target = candidate.targetLevel?.trim()
  return [name, kit, target].filter(Boolean).join(' · ')
}

function materialSummary(item: ProgramMaterialResponse): string {
  const values = [
    item.targetLevel?.trim(),
    item.studentCountBasis != null ? `기준 학생 ${item.studentCountBasis}명` : undefined,
    item.calculatedKitCount != null ? `${item.calculatedKitCount}키트` : undefined,
    item.booksPerKitSnapshot != null ? `${item.booksPerKitSnapshot}권/키트` : undefined,
    item.deliveryStatusTag?.trim(),
  ]
  return values.filter(Boolean).join(' · ') || '-'
}

function toRequestItem(
  candidate: ProgramMaterialCandidateResponse,
  existing: ProgramMaterialResponse | undefined
): ProgramMaterialAssignmentItemRequest {
  return {
    textbookId: candidate.textbookId,
    kitId: candidate.kitId,
    kitVersionId: candidate.kitVersionId,
    targetLevel: candidate.targetLevel,
    // 기존 서버 snapshot은 보존하고, 새 항목의 수량은 서버가 산정한다.
    ...(existing?.booksPerKitSnapshot != null
      ? { booksPerKitSnapshot: existing.booksPerKitSnapshot }
      : candidate.bookCountPerKit != null
        ? { booksPerKitSnapshot: candidate.bookCountPerKit }
        : {}),
    ...(existing?.studentCountBasis != null
      ? { studentCountBasis: existing.studentCountBasis }
      : {}),
    ...(existing?.calculatedKitCount != null
      ? { calculatedKitCount: existing.calculatedKitCount }
      : {}),
    autoMatchedYn: existing?.autoMatchedYn ?? false,
  }
}

export function ProgramMaterialsSection({
  programId,
  isEditMode,
}: {
  programId: string
  isEditMode: boolean
}) {
  const { materials, candidates, isLoading, isSaving, error, save, remoteEnabled } =
    useProgramMaterials(programId, true)

  const itemKeys = useMemo(() => (materials?.items ?? []).map(materialKey), [materials?.items])
  const editor = useProgramMaterialEditorState(materials?.assignmentStatus, itemKeys)

  const candidateByKey = useMemo(() => {
    const map = new Map<string, ProgramMaterialCandidateResponse>()
    for (const candidate of candidates) map.set(materialKey(candidate), candidate)
    return map
  }, [candidates])
  const existingByKey = useMemo(() => {
    const map = new Map<string, ProgramMaterialResponse>()
    for (const item of materials?.items ?? []) map.set(materialKey(item), item)
    return map
  }, [materials?.items])

  if (!remoteEnabled) return null

  const saveChanges = async () => {
    const items =
      editor.mode === 'ASSIGNED'
        ? editor.selectedKeys.flatMap(key => {
            const candidate = candidateByKey.get(key)
            if (!candidate) return []
            return [toRequestItem(candidate, existingByKey.get(key))]
          })
        : []
    const assignmentStatus: MaterialEditorMode =
      editor.mode === 'ASSIGNED' && items.length === 0 ? 'UNDECIDED' : editor.mode

    await save({
      noneYn: assignmentStatus === 'NONE',
      items,
    })
    editor.reset()
  }

  return (
    <section className="program-materials-section" aria-label="프로그램 교재 설정">
      <div className="program-materials-section__header">
        <div>
          <Typography.Title level={4}>프로그램 교재 설정</Typography.Title>
          <Typography.Text type="secondary">
            기관·개인 신청에 사용할 교재 후보는 서버가 사업 분야 기준으로 검증합니다.
          </Typography.Text>
        </div>
        {isEditMode && (
          <CmsButton
            size="h40"
            onClick={() => void saveChanges()}
            loading={isSaving}
            disabled={isLoading}
          >
            교재 설정 저장
          </CmsButton>
        )}
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={extractApiErrorMessage(error, { fallback: '교재 설정을 불러오지 못했습니다.' })}
        />
      )}

      {isLoading ? (
        <div className="program-materials-section__loading">
          <Spin size="small" /> 교재 설정을 불러오는 중입니다.
        </div>
      ) : (
        <>
          <div className="program-materials-section__status">
            <span className="program-materials-section__label">설정 상태</span>
            {isEditMode ? (
              <Radio.Group
                value={editor.mode}
                onChange={event => editor.setMode(event.target.value as MaterialEditorMode)}
              >
                <Radio value="UNDECIDED">미결정</Radio>
                <Radio value="NONE">교재 없음</Radio>
                <Radio value="ASSIGNED">교재 설정</Radio>
              </Radio.Group>
            ) : (
              <Typography.Text strong>
                {statusLabel(materials?.assignmentStatus ?? 'UNDECIDED')}
              </Typography.Text>
            )}
          </div>

          {isEditMode && editor.mode === 'ASSIGNED' && (
            <div className="program-materials-section__candidates">
              <div className="program-materials-section__label">교재 후보</div>
              {candidates.length === 0 ? (
                <Typography.Text type="secondary">
                  사용 가능한 교재 후보가 없습니다.
                </Typography.Text>
              ) : (
                candidates.map(candidate => {
                  const key = materialKey(candidate)
                  return (
                    <Checkbox
                      key={key}
                      checked={editor.selectedKeys.includes(key)}
                      onChange={event => {
                        const next = event.target.checked
                          ? [...editor.selectedKeys, key]
                          : editor.selectedKeys.filter(selectedKey => selectedKey !== key)
                        editor.setSelectedKeys(next)
                      }}
                    >
                      {candidateLabel(candidate)}
                    </Checkbox>
                  )
                })
              )}
            </div>
          )}

          <div className="program-materials-section__items">
            <div className="program-materials-section__label">서버 저장값</div>
            {(materials?.items ?? []).length === 0 ? (
              <Typography.Text type="secondary">저장된 교재가 없습니다.</Typography.Text>
            ) : (
              (materials?.items ?? []).map(item => (
                <div className="program-materials-section__item" key={item.id ?? materialKey(item)}>
                  <span>
                    {item.textbookNameKo?.trim() || item.textbookNameEn?.trim() || '교재명 없음'}
                  </span>
                  <Typography.Text type="secondary">{materialSummary(item)}</Typography.Text>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}
