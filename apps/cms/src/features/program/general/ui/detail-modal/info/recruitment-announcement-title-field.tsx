import { Controller, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { pickRecruitmentCopyRow } from '@/features/program/shared/lib/recruitment-row-copy'
import type { RecruitmentCopyAudience } from '@/features/program/shared/lib/recruitment-row-copy'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'

/** 일반 프로그램 모집 탭 공고명. 이 행 announcementTitle만 저장하고, 다른 행·프로그램 제목은 건드리지 않는다. */
export function RecruitmentAnnouncementTitleField({
  program,
  form,
  isEdit,
  audience,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  audience: RecruitmentCopyAudience
}) {
  const type = program.backendProgramType?.toUpperCase() ?? ''
  if (type !== 'GENERAL' && !type.startsWith('GENERAL_')) return null
  const stored = pickRecruitmentCopyRow(program, audience)?.announcementTitle?.trim()
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="공고용 프로그램명"
        fullRow
        view={stored || '-'}
        edit={
          isEdit && form ? (
            <Controller
              name="announcementTitle"
              control={form.control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  inputSize="medium"
                  width="100%"
                  placeholder="이 모집의 공고용 프로그램명을 입력하세요"
                />
              )}
            />
          ) : undefined
        }
      />
    </DetailInfoForm.Row>
  )
}
