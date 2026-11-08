import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsSelect } from '@/shared/ui'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { useParticipatingVolunteerAddRegistrationPluginState } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import type { ParticipatingVolunteerAddRegistrationSectionContext } from './add-registration-form-types'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'

const CERTIFICATE_GUIDE_LINES = [
  '- 파일은 PDF, JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  '- 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const CERTIFICATE_ACCEPT = '.jpg,.jpeg,.png,.pdf'
const CERTIFICATE_MAX_FILES = 10

function buildProgramYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const years: { value: string; label: string }[] = []
  for (let year = currentYear; year >= currentYear - 15; year -= 1) {
    years.push({ value: String(year), label: String(year) })
  }
  return years
}

const PROGRAM_YEAR_OPTIONS = buildProgramYearOptions()

/** 참여 봉사자 추가 등록 — 이전 참여 JA 봉사 프로그램 plugin 본문 */
export function ParticipatingVolunteerAddRegistrationPreviousJaProgramParagraph(
  props: ParticipatingVolunteerAddRegistrationSectionContext
) {
  const {
    values,
    setPreviousJaProgramYear,
    setPreviousJaProgramName,
    appendPreviousJaCertificateFiles,
    removePreviousJaCertificateFileAt,
  } = useParticipatingVolunteerAddRegistrationPluginState()

  const { previousJaProgram } = values
  const remainingSlots = Math.max(
    0,
    CERTIFICATE_MAX_FILES - previousJaProgram.certificateFiles.length
  )

  return (
    <DetailInfoForm title="이전 참여 JA 봉사 프로그램" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="참여 JA 봉사 프로그램"
          required
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="small"
                width={140}
                withAllOption={false}
                placeholder="진행년도"
                value={previousJaProgram.programYear || undefined}
                options={PROGRAM_YEAR_OPTIONS}
                onChange={value => setPreviousJaProgramYear(value == null ? '' : String(value))}
                getPopupContainer={() => document.body}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                inputSize="small"
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                placeholder="참여한 봉사 프로그램명을 입력해 주세요"
                value={previousJaProgram.programName}
                onChange={e => setPreviousJaProgramName(e.target.value)}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="증빙서류 첨부"
          required
          fullRow
          edit={
            <ParagraphFileUpload
              accept={CERTIFICATE_ACCEPT}
              multiple
              guideLines={CERTIFICATE_GUIDE_LINES}
              fileNames={previousJaProgram.certificateFiles.map(file => file.fileName)}
              onFilesChange={files => {
                if (remainingSlots <= 0) return
                const programId = Number(props.programId)
                const ownerId =
                  Number.isSafeInteger(programId) && programId > 0 ? programId : null
                if (ownerId == null) return
                const owner = buildAdminFileOwner(
                  ADMIN_FILE_OWNER.PROGRAM,
                  ownerId,
                  ADMIN_FILE_PURPOSE.VOLUNTEER_APPLICATION_EVIDENCE
                )
                const accepted = files.slice(0, remainingSlots)
                void (async () => {
                  const uploaded: { fileObjectId: string; fileName: string }[] = []
                  for (const file of accepted) {
                    try {
                      const result = await uploadAdminFileMaybeMock({ file, owner })
                      if (result.fileObjectId != null) {
                        uploaded.push({
                          fileObjectId: String(result.fileObjectId),
                          fileName: file.name,
                        })
                      }
                    } catch {
                      // 실패한 파일은 id 목록에 넣지 않는다 — 등록 시 필수 검증이 막는다.
                    }
                  }
                  appendPreviousJaCertificateFiles(uploaded)
                })()
              }}
              onRemoveFile={index => removePreviousJaCertificateFileAt(index)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
