import { useMemo, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  parseFileObjectId,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'

const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 PDF, JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  '- 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'

type AttachmentRow = {
  fileName: string
  fileObjectId?: number
  status: 'uploading' | 'uploaded' | 'failed'
  error?: string
}

function displayLabel(row: AttachmentRow): string {
  if (row.status === 'uploading') return `${row.fileName} (업로드 중)`
  if (row.status === 'failed') return `${row.fileName} (실패${row.error ? `: ${row.error}` : ''})`
  return row.fileName
}

/** 프로그램 봉사자 신청 폼 — 이전 참여 JA 봉사 프로그램 */
export function VolunteerPreviousJaProgramParagraph(props?: {
  programId?: string | number | null
}) {
  /** 템플릿 관리 시안(12875:514060) — 진행년도 입력 140 고정, 프로그램명 입력이 남은 폭 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [applicationYear, setApplicationYear] = useGeneralApplicationOverlayKv(
    'application.volunteer.previousProgram.applicationYear',
    ''
  )
  const [programName, setProgramName] = useGeneralApplicationOverlayKv(
    'application.volunteer.previousProgram.programName',
    ''
  )
  const [fileNames] = useGeneralApplicationOverlayKv<string[]>(
    'application.volunteer.previousProgram.fileNames',
    []
  )
  const [fileObjectIds] = useGeneralApplicationOverlayKv<number[]>(
    'application.volunteer.previousProgram.fileObjectIds',
    []
  )
  const [pendingRows, setPendingRows] = useState<AttachmentRow[]>([])

  const numericProgramId = parseFileObjectId(props?.programId)
  const uploadDisabled = numericProgramId == null

  const uploadedRows: AttachmentRow[] = useMemo(() => {
    return fileNames.map((fileName, index) => ({
      fileName,
      fileObjectId: fileObjectIds[index],
      status: fileObjectIds[index] != null ? ('uploaded' as const) : ('failed' as const),
      error: fileObjectIds[index] == null ? '다시 첨부해 주세요' : undefined,
    }))
  }, [fileNames, fileObjectIds])

  const allRows = [...uploadedRows, ...pendingRows]

  return (
    <DetailInfoForm title="이전 참여 JA 봉사 프로그램" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="참여 JA 봉사 프로그램"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                inputSize="small"
                width={isTemplateManagementScreen ? 140 : '100%'}
                style={
                  isTemplateManagementScreen
                    ? { flex: '0 0 140px' }
                    : { flex: '3 1 0', minWidth: 0 }
                }
                placeholder="진행년도"
                value={applicationYear}
                onChange={e => setApplicationYear(e.target.value)}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="small"
                width="100%"
                style={{ flex: '7 1 0', minWidth: 0 }}
                placeholder="참여한 봉사 프로그램명을 입력해 주세요"
                value={programName}
                onChange={e => setProgramName(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="증빙서류 첨부"
          fullRow
          edit={
            <>
              {/* 템플릿 편집 「프로그램에서 등록 시 첨부 가능합니다.」 안내 제거 (QA 261113 #62) */}
              <ParagraphFileUpload
                accept={CERTIFICATE_ACCEPT}
                multiple
                disabled={uploadDisabled}
                guideLines={CERTIFICATE_GUIDE_LINES}
                fileNames={uploadDisabled ? undefined : allRows.map(displayLabel)}
                onFilesChange={
                  uploadDisabled
                    ? undefined
                    : files => {
                        const owner = buildAdminFileOwner(
                          ADMIN_FILE_OWNER.PROGRAM,
                          numericProgramId,
                          ADMIN_FILE_PURPOSE.VOLUNTEER_APPLICATION_EVIDENCE
                        )
                        const placeholders: AttachmentRow[] = files.map(file => ({
                          fileName: file.name,
                          status: 'uploading',
                        }))
                        setPendingRows(prev => [...prev, ...placeholders])
                        void (async () => {
                          for (let i = 0; i < files.length; i += 1) {
                            const file = files[i]!
                            try {
                              const result = await uploadAdminFileMaybeMock({ file, owner })
                              setPendingRows(prev =>
                                prev.filter(
                                  row =>
                                    !(row.fileName === file.name && row.status === 'uploading')
                                )
                              )
                              updateGeneralApplicationOverlayKey<string[]>(
                                'application.volunteer.previousProgram.fileNames',
                                prev => [...(prev ?? []), file.name]
                              )
                              updateGeneralApplicationOverlayKey<number[]>(
                                'application.volunteer.previousProgram.fileObjectIds',
                                prev => [...(prev ?? []), result.fileObjectId]
                              )
                            } catch (error) {
                              const message =
                                error instanceof Error && error.message.trim()
                                  ? error.message
                                  : '업로드에 실패했습니다.'
                              setPendingRows(prev =>
                                prev.map(row =>
                                  row.fileName === file.name && row.status === 'uploading'
                                    ? { ...row, status: 'failed', error: message }
                                    : row
                                )
                              )
                            }
                          }
                        })()
                      }
                }
                onRemoveFile={
                  uploadDisabled
                    ? undefined
                    : index => {
                        if (index < uploadedRows.length) {
                          updateGeneralApplicationOverlayKey<string[]>(
                            'application.volunteer.previousProgram.fileNames',
                            prev => (prev ?? []).filter((_, i) => i !== index)
                          )
                          updateGeneralApplicationOverlayKey<number[]>(
                            'application.volunteer.previousProgram.fileObjectIds',
                            prev => (prev ?? []).filter((_, i) => i !== index)
                          )
                          return
                        }
                        const pendingIndex = index - uploadedRows.length
                        setPendingRows(prev => prev.filter((_, i) => i !== pendingIndex))
                      }
                }
              />
            </>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
