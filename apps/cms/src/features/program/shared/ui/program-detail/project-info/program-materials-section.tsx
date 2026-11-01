import { useMemo, useState } from 'react'
import { Alert, Checkbox, Radio, Spin, Typography } from 'antd'
import type { ProgramMaterialCandidateResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialCandidateResponse'
import type { ProgramMaterialResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialResponse'
import type { ProgramMaterialAssignmentStatus } from '@/features/program/general/api/program-materials-api-client'
import {
  useProgramMaterialEditorState,
  useProgramMaterials,
} from '@/features/program/general/hooks/use-program-materials'
import {
  buildProgramMaterialSaveRequest,
  formatProgramMaterialDisplay,
  logicalMaterialKey,
  uniqueCandidatesByLogicalKey,
} from '@/features/program/general/lib/program-material-assignment'
import { CmsButton } from '@/shared/ui'
import { extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'
import './program-materials-section.css'

type MaterialEditorMode = ProgramMaterialAssignmentStatus

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

export function ProgramMaterialsSection({
  programId,
  isEditMode,
}: {
  programId: string
  isEditMode: boolean
}) {
  const {
    materials,
    candidates,
    isMaterialsLoading,
    isCandidatesLoading,
    isSaving,
    materialsError,
    candidatesError,
    isCandidatesError,
    save,
    remoteEnabled,
  } = useProgramMaterials(programId, true)
  const [saveError, setSaveError] = useState('')

  const savedItems = materials?.items ?? []
  const itemKeys = useMemo(() => savedItems.map(logicalMaterialKey).filter(Boolean), [savedItems])
  const editor = useProgramMaterialEditorState(materials?.assignmentStatus, itemKeys)
  const visibleCandidates = useMemo(
    () => uniqueCandidatesByLogicalKey(candidates),
    [candidates]
  )

  const candidateByKey = useMemo(() => {
    const map = new Map<string, ProgramMaterialCandidateResponse>()
    for (const candidate of visibleCandidates) map.set(logicalMaterialKey(candidate), candidate)
    return map
  }, [visibleCandidates])
  const existingByKey = useMemo(() => {
    const map = new Map<string, ProgramMaterialResponse>()
    for (const item of savedItems) {
      const key = logicalMaterialKey(item)
      if (key) map.set(key, item)
    }
    return map
  }, [savedItems])

  if (!remoteEnabled) return null

  const saveChanges = async () => {
    const built = buildProgramMaterialSaveRequest({
      mode: editor.mode,
      selectedKeys: editor.selectedKeys,
      existingByKey,
      candidateByKey,
      previousItems: savedItems,
      isLoading: isMaterialsLoading || (isEditMode && isCandidatesLoading),
      candidatesFailed: isCandidatesError,
    })
    if (!built.ok) {
      setSaveError(built.message)
      return
    }

    setSaveError('')
    try {
      await save({
        noneYn: built.noneYn,
        items: built.items,
      })
      editor.reset()
    } catch (error) {
      setSaveError(
        extractApiErrorMessage(error, { fallback: '교재 설정 저장에 실패했습니다.' })
      )
    }
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
            disabled={isMaterialsLoading || isCandidatesLoading} >
            교재 설정 저장
          </CmsButton>
        )}
      </div>

      {materialsError && (
        <Alert
          type="error"
          showIcon
          message={extractApiErrorMessage(materialsError, {
            fallback: '교재 설정을 불러오지 못했습니다.',
          })}
        />
      )}
      {isEditMode && candidatesError && (
        <Alert
          type="warning"
          showIcon
          message={extractApiErrorMessage(candidatesError, {
            fallback: '교재 후보를 불러오지 못했습니다. 기존 배정은 유지됩니다.',
          })}
        />
      )}
      {saveError ? <Alert type="error" showIcon message={saveError} /> : null}

      {isMaterialsLoading ? (
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
              {isCandidatesLoading ? (
                <Typography.Text type="secondary">교재 후보를 불러오는 중입니다.</Typography.Text>
              ) : visibleCandidates.length === 0 ? (
                <Typography.Text type="secondary">
                  사용 가능한 교재 후보가 없습니다.
                </Typography.Text>
              ) : (
                visibleCandidates.map(candidate => {
                  const key = logicalMaterialKey(candidate)
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
            {savedItems.length === 0 ? (
              <Typography.Text type="secondary">저장된 교재가 없습니다.</Typography.Text>
            ) : (
              savedItems.map(item => {
                const display = formatProgramMaterialDisplay(item)
                return (
                  <div
                    className="program-materials-section__item"
                    key={item.id ?? logicalMaterialKey(item)}
                  >
                    <span className="program-materials-section__item-title">{display.title}</span>
                    <Typography.Text
                      type="secondary"
                      className="program-materials-section__item-meta"
                    >
                      {[
                        display.booksPerKitLabel,
                        display.studentCountLabel,
                        display.kitCountLabel,
                        display.deliveryLabel,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography.Text>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </section>
  )
}
