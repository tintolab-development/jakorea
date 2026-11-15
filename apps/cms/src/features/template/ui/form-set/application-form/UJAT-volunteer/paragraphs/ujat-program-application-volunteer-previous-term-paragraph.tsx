import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  useUjatApplicationVolunteerOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { FILE_SELECT_MAX_FILE_BYTES } from '@/shared/ui/file-select-field-limits'
import {
  GENERAL_RECRUIT_DETAIL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE,
  GENERAL_RECRUIT_DETAIL_ATTACHMENT_MAX_COUNT,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-attachment'

// 시안 4082:106592 봉사자 신청 폼 「수료증 첨부」(16301:626058) 안내 문구
const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 PDF, JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  '- 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'
/** 안내 문구와 같은 제한 — 최대 10개 · 파일당 20MB · 총 100MB */
const CERTIFICATE_MAX_COUNT = GENERAL_RECRUIT_DETAIL_ATTACHMENT_MAX_COUNT
const CERTIFICATE_MAX_FILE_BYTES = FILE_SELECT_MAX_FILE_BYTES
const CERTIFICATE_MAX_TOTAL_BYTES = 100 * 1024 * 1024
const CERTIFICATE_FILE_EXCEEDED_MESSAGE = '파일당 최대 20MB까지 업로드 가능합니다.'
const CERTIFICATE_TOTAL_EXCEEDED_MESSAGE = '첨부 파일은 총 100MB까지 업로드 가능합니다.'

const TEMPLATE_UPLOAD_DISABLED_HINT = '프로그램에서 등록 시 첨부 가능합니다.'

export type UjatPreviousTermAttachmentRow = {
  fileName: string
  /** 총 용량 검사용 — 이전에 저장된 행은 없을 수 있다 */
  fileSize?: number
  fileObjectId?: number
  status: 'uploading' | 'uploaded' | 'failed'
  error?: string
}

function displayLabelForAttachment(row: UjatPreviousTermAttachmentRow): string {
  if (row.status === 'uploading') return `${row.fileName} (업로드 중)`
  if (row.status === 'failed') return `${row.fileName} (실패${row.error ? `: ${row.error}` : ''})`
  return row.fileName
}

/** UJAT 프로그램 봉사자 신청 폼 — 이전 UJAT 활동 기수 */
export function UjatProgramApplicationVolunteerPreviousTermParagraph(props?: {
  programLinkedPreview?: boolean
  /** 추가 등록·프로그램 연동 시 PROGRAM owner id. 없으면 업로드 비활성 */
  programId?: string | number | null
}) {
  /** 템플릿 관리 시안(12875:515697) — 활동 기수·활동 년도 입력 140 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const termYearInputWidth = isTemplateManagementScreen ? 140 : 240
  const [term, setTerm] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm,
    ''
  )
  const [year, setYear] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear,
    ''
  )
  const [attachments, setAttachments] = useUjatApplicationVolunteerOverlayKv<
    UjatPreviousTermAttachmentRow[]
  >(UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames, [])

  // 레거시: string[] 파일명만 저장된 경우 → 행으로 정규화 (id 없음)
  const normalizedAttachments = useMemo(() => {
    if (!Array.isArray(attachments)) return [] as UjatPreviousTermAttachmentRow[]
    return attachments.map(item => {
      if (item && typeof item === 'object' && 'fileName' in item) {
        return item as UjatPreviousTermAttachmentRow
      }
      const fileName = String(item ?? '').trim()
      return {
        fileName,
        status: 'failed' as const,
        error: '다시 첨부해 주세요',
      }
    })
  }, [attachments])

  const [, setFileObjectIds] = useUjatApplicationVolunteerOverlayKv<number[]>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileObjectIds,
    []
  )

  const syncIds = (rows: UjatPreviousTermAttachmentRow[]) => {
    setAttachments(rows)
    setFileObjectIds(
      rows.flatMap(row =>
        row.status === 'uploaded' && row.fileObjectId != null ? [row.fileObjectId] : []
      )
    )
  }

  const numericProgramId = parseFileObjectId(props?.programId)
  const fileUploadDisabled =
    props?.programLinkedPreview === true || numericProgramId == null

  const currentAttachmentBytes = normalizedAttachments.reduce(
    (total, row) => total + (row.status === 'failed' ? 0 : row.fileSize ?? 0),
    0
  )

  const uploadHint =
    numericProgramId == null && props?.programLinkedPreview !== true
      ? TEMPLATE_UPLOAD_DISABLED_HINT
      : undefined

  return (
    <DetailInfoForm title="이전 UJAT 활동 기수" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="이전 활동 기수 및 년도"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsNumericInput
                mode="numericText"
                inputSize="small"
                width={termYearInputWidth}
                placeholder="활동 기수"
                value={term}
                onValueChange={setTerm}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="small"
                width={termYearInputWidth}
                placeholder="활동 년도"
                value={year}
                onChange={e => setYear(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="수료증 첨부"
          fullRow
          edit={
            <>
              {uploadHint ? (
                <p className="form-editor-template-field-hint-text" role="status">
                  {uploadHint}
                </p>
              ) : null}
              <ParagraphFileUpload
                accept={CERTIFICATE_ACCEPT}
                multiple
                disabled={fileUploadDisabled}
                guideLines={CERTIFICATE_GUIDE_LINES}
                maxFileBytes={CERTIFICATE_MAX_FILE_BYTES}
                maxTotalBytes={CERTIFICATE_MAX_TOTAL_BYTES}
                currentTotalBytes={currentAttachmentBytes}
                sizeExceededMessage={file =>
                  file ? CERTIFICATE_FILE_EXCEEDED_MESSAGE : CERTIFICATE_TOTAL_EXCEEDED_MESSAGE
                }
                fileNames={
                  fileUploadDisabled
                    ? undefined
                    : normalizedAttachments.map(displayLabelForAttachment)
                }
                onFilesChange={
                  fileUploadDisabled
                    ? undefined
                    : files => {
                        if (normalizedAttachments.length + files.length > CERTIFICATE_MAX_COUNT) {
                          cmsAlertModal.show({
                            title: '안내',
                            content: GENERAL_RECRUIT_DETAIL_ATTACHMENT_COUNT_EXCEEDED_MESSAGE,
                          })
                          return
                        }
                        const owner = buildAdminFileOwner(
                          ADMIN_FILE_OWNER.PROGRAM,
                          numericProgramId,
                          ADMIN_FILE_PURPOSE.VOLUNTEER_APPLICATION_EVIDENCE
                        )
                        const placeholders: UjatPreviousTermAttachmentRow[] = files.map(file => ({
                          fileName: file.name,
                          fileSize: file.size,
                          status: 'uploading',
                        }))
                        const base = [...normalizedAttachments, ...placeholders]
                        syncIds(base)
                        void (async () => {
                          let next = [...base]
                          for (let i = 0; i < files.length; i += 1) {
                            const rowIndex = normalizedAttachments.length + i
                            try {
                              const result = await uploadAdminFileMaybeMock({
                                file: files[i]!,
                                owner,
                              })
                              next = next.map((row, index) =>
                                index === rowIndex
                                  ? {
                                      fileName: files[i]!.name,
                                      fileSize: files[i]!.size,
                                      fileObjectId: result.fileObjectId,
                                      status: 'uploaded' as const,
                                    }
                                  : row
                              )
                            } catch (error) {
                              const message =
                                error instanceof Error && error.message.trim()
                                  ? error.message
                                  : '업로드에 실패했습니다.'
                              next = next.map((row, index) =>
                                index === rowIndex
                                  ? {
                                      fileName: files[i]!.name,
                                      status: 'failed' as const,
                                      error: message,
                                    }
                                  : row
                              )
                            }
                            syncIds(next)
                          }
                        })()
                      }
                }
                onRemoveFile={
                  fileUploadDisabled
                    ? undefined
                    : index => syncIds(normalizedAttachments.filter((_, i) => i !== index))
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

export function hasIncompleteUjatPreviousTermUploads(
  attachments: unknown
): boolean {
  if (!Array.isArray(attachments)) return false
  return attachments.some(item => {
    if (item && typeof item === 'object' && 'status' in item) {
      const status = (item as UjatPreviousTermAttachmentRow).status
      return status === 'uploading' || status === 'failed'
    }
    return true
  })
}
