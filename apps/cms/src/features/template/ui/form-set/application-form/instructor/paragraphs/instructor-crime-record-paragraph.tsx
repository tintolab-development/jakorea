import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import '@/features/template/ui/shared/paragraph-file-upload.css'
import { FilePdfOutlined } from '@ant-design/icons'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'

/** 등록 위저드 · 템플릿 관리 · 프로그램 상세 미리보기/수정 — 동일 안내 */
const AGENCY_ID_HINT = '기관이 작성한 ID와 검증번호가 노출됩니다.'

/** 성범죄 경력 조회서 제출 — 가로 테이블 레이아웃 */
export function InstructorCrimeRecordParagraph({
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
}: {
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
}) {
  const [uploadedFile, setUploadedFile] = useGeneralApplicationOverlayKv<File | null>(
    'application.instructor.crimeRecordFile',
    null
  )
  const readOnly = isTemplateAuthoringMode || readOnlyPreview

  const agencyIdCell = (
    <span className="form-editor-template-field-hint-text">{AGENCY_ID_HINT}</span>
  )

  const fileUploadCell = (
    <div
      className={[
        'program-application-form-instructor__file-cell',
        // 활성 룩 유지 + 클릭만 차단 (disabled 스타일 금지 — 미리보기/템플릿 편집 동일)
        readOnly && 'program-application-form-instructor__file-cell--readonly-preview',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ParagraphFileUpload
        accept=".pdf"
        guideLines={[]}
        className="program-application-form-instructor__file-upload-trigger"
        onFilesChange={files => {
          if (readOnly) return
          const next = files[0]
          setUploadedFile(next ?? null)
          if (next) {
            const owner = buildAdminFileOwner(
              ADMIN_FILE_OWNER.INSTRUCTOR_APPLICATION,
              1,
              ADMIN_FILE_PURPOSE.CRIMINAL_HISTORY_EVIDENCE
            )
            void uploadAdminFileMaybeMock({ file: next, owner }).catch(() => undefined)
          }
        }}
      />
      {uploadedFile ? (
        <span className="program-application-form-instructor__file-attached">
          <FilePdfOutlined
            className="program-application-form-instructor__file-attached-icon"
            aria-hidden
          />
          <span className="program-application-form-instructor__mock-file-name">
            {uploadedFile.name}
          </span>
        </span>
      ) : null}
    </div>
  )

  return (
    <DetailInfoForm title="" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관 ID 및 검증번호"
          readOnlyDisplay
          edit={agencyIdCell}
          view={agencyIdCell}
        />
        {/* 파일 첨부만 작성 가능(미리보기·템플릿은 readOnly로 클릭 차단) */}
        <DetailInfoForm.Field
          label="파일 첨부"
          mode="edit"
          readOnlyDisplay={false}
          edit={fileUploadCell}
          view={fileUploadCell}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
