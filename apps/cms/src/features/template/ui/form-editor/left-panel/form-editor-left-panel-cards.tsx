import { memo } from 'react'
import { areFormEditorCardPropsEqual } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-card-memo'
import { SortOrderDragIcon } from '@/shared/ui/sort-order-drag-icon'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ParagraphCard,
  type ParagraphCardEditableHeading,
} from '@/features/template/ui/template-management/template-fullpage-modal'
import {
  type FormEditorKind,
  type FormTitleNumberingStyle,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { isAgreementAdminProxyConfirmHostId } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { FormEditorLeftPanelProps } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel.types'
import { renderFormEditorParagraphBody } from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-paragraph-body'
import { useInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  isTitleWithPeriodParagraph,
  paragraphEditableHeading,
  withInstitutionApplicationPreferredScheduleHeading,
  withProgramApplicationFixedScheduleHeading,
  withProgramApplicationFormVolunteerTitleTrailing,
  withProgramRegistrationCurriculumTitleTrailing,
  withProgramRegistrationEducationScheduleSettingsRegistrationDescription,
  withUjatProgramApplicationFormInstitutionGradeClassTimeTitleTrailing,
  withUjatProgramApplicationFormInstitutionGradeInfoTitleTrailing,
  withMultipleChoiceAllowMultipleTitleHint,
  withSurveyWriteTitleNumbering,
  withoutPlaceholderDescriptionInPreview,
  withoutTitleRequired,
} from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-heading'
import {
  modalCardFooterActions,
  modalCardFooterToggles,
} from '@/features/template/ui/form-editor/left-panel/form-editor-left-panel-card-footer'
import { useRegistrationWizardValidationHighlight } from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import { useHideParagraphSelectionChrome } from '@/features/template/context/paragraph-selection-chrome-context'

function isAgreementAdminProxyConfirmCard(
  paragraph: WritingFormParagraph,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): boolean {
  return (
    paragraphBodyOptions?.agreementAdminProxyConfirm === true &&
    isAgreementAdminProxyConfirmHostId(paragraph.id)
  )
}

function withAgreementAdminProxyConfirmHeading(
  heading: ParagraphCardEditableHeading,
  paragraph: WritingFormParagraph,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): ParagraphCardEditableHeading {
  if (!isAgreementAdminProxyConfirmCard(paragraph, paragraphBodyOptions)) return heading
  return {
    ...heading,
    titleValue: '',
    titleClassName: undefined,
    showDescription: false,
  }
}

/** 고정·구조 잠금 단락 — 순서 변경은 불가하나 양식 테스트와 동일한 햄버거 아이콘 노출 */
export function ParagraphCardDragHandleNonInteractive() {
  return (
    <span
      className="paragraph-card__drag-handle paragraph-card__drag-handle--non-interactive"
      aria-hidden
    >
      <SortOrderDragIcon />
    </span>
  )
}

export interface PinnedCardProps {
  paragraph: WritingFormParagraph
  paragraphIndex: number
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: FormEditorLeftPanelProps['updateParagraph']
  editorKind: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: FormEditorLeftPanelProps['onSelectSingleItemListItem']
  horizontalTableRowSelectionsByParagraphId: FormEditorLeftPanelProps['horizontalTableRowSelectionsByParagraphId']
  onHorizontalTableRowSelectionChange: FormEditorLeftPanelProps['onHorizontalTableRowSelectionChange']
  verticalTableBodyRowSelection: FormEditorLeftPanelProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPanelProps['onVerticalTableBodyRowSelectionChange']
  middleParagraphActions: FormEditorLeftPanelProps['middleParagraphActions']
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  showEditorChrome?: boolean
  structureLockedParagraphIds?: ReadonlySet<string>
  allowAddAfterStructureLockedParagraphs?: boolean
  hideDragHandleForParagraphIds?: ReadonlySet<string>
  hideParagraphRequiredChrome?: boolean
  headingDescriptionExtraClassName?: string
  surveyWriteNumbering?: boolean
}

function PinnedFormCardInner({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
  singleItemListActiveItemId,
  onSelectSingleItemListItem,
  horizontalTableRowSelectionsByParagraphId,
  onHorizontalTableRowSelectionChange,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowSelectionChange,
  middleParagraphActions,
  paragraphBodyOptions,
  showEditorChrome = true,
  structureLockedParagraphIds,
  allowAddAfterStructureLockedParagraphs = false,
  hideDragHandleForParagraphIds,
  hideParagraphRequiredChrome,
  headingDescriptionExtraClassName,
  surveyWriteNumbering = false,
}: PinnedCardProps) {
  useInstitutionApplicationProgramBridge()
  const isSelected = selectedCardId === paragraph.id
  const hideDragHandle =
    (hideDragHandleForParagraphIds?.has(paragraph.id) ?? false) ||
    (editorKind === 'horizontal_table' &&
      structureLockedParagraphIds != null &&
      !allowAddAfterStructureLockedParagraphs)
  const editableHeadingBase = withoutPlaceholderDescriptionInPreview(
    withoutTitleRequired(
      withSurveyWriteTitleNumbering(
        withMultipleChoiceAllowMultipleTitleHint(
          paragraphEditableHeading(
            paragraph,
            paragraphs,
            titleNumbering,
            isSelected,
            updateParagraph,
            editorKind,
            structureLockedParagraphIds,
            headingDescriptionExtraClassName,
            paragraphBodyOptions?.structureLockedAuthoringOperationalFill === true
          ),
          paragraph
        ),
        paragraphs,
        paragraph,
        titleNumbering,
        surveyWriteNumbering
      ),
      hideParagraphRequiredChrome
    ),
    !showEditorChrome
  )
  const editableHeading = withAgreementAdminProxyConfirmHeading(
    withProgramApplicationFixedScheduleHeading(
      withInstitutionApplicationPreferredScheduleHeading(
        withProgramApplicationFormVolunteerTitleTrailing(
          withUjatProgramApplicationFormInstitutionGradeClassTimeTitleTrailing(
            withUjatProgramApplicationFormInstitutionGradeInfoTitleTrailing(
              withProgramRegistrationEducationScheduleSettingsRegistrationDescription(
                withProgramRegistrationCurriculumTitleTrailing(
                  editableHeadingBase as ParagraphCardEditableHeading,
                  paragraph,
                  paragraphBodyOptions
                ),
                paragraph,
                paragraphBodyOptions
              ),
              paragraph,
              paragraphBodyOptions
            ),
            paragraph,
            paragraphBodyOptions
          ),
          paragraph,
          paragraphBodyOptions
        ),
        paragraph,
        paragraphBodyOptions
      ),
      paragraph,
      paragraphBodyOptions
    ),
    paragraph,
    paragraphBodyOptions
  )
  const adminProxyConfirmCard = isAgreementAdminProxyConfirmCard(paragraph, paragraphBodyOptions)
  const seedFillLocked =
    paragraphBodyOptions?.seedApplicantFillLocked === true &&
    (structureLockedParagraphIds?.has(paragraph.id) ?? false)
  const registrationWizardHighlight = useRegistrationWizardValidationHighlight()
  const paragraphRequiredIncomplete =
    registrationWizardHighlight.attemptId > 0 &&
    registrationWizardHighlight.isParagraphIncomplete(paragraph.id)
  const hideSelectionChrome = useHideParagraphSelectionChrome()
  const showSelectionChrome = showEditorChrome && !hideSelectionChrome

  return (
    <ParagraphCard
      dataParagraphId={paragraph.id}
      className={[
        'form-editor-card',
        paragraphRequiredIncomplete ? 'paragraph-card--required-incomplete' : '',
        showSelectionChrome ? 'paragraph-card--selectable' : '',
        showSelectionChrome && selectedCardId === paragraph.id ? 'paragraph-card--active' : '',
        isTitleWithPeriodParagraph(paragraph) ? 'paragraph-card--survey-title-with-period' : '',
        paragraph.kind === 'single_item' && paragraph.variant === 'scale_type'
          ? 'paragraph-card--scale-type'
          : '',
        adminProxyConfirmCard ? 'agreement-admin-proxy-confirm-card' : '',
        seedFillLocked ? 'paragraph-card--seed-fill-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={showEditorChrome ? () => onSelectCard(paragraph.id) : undefined}
      actionSlot={
        showSelectionChrome && !hideDragHandle ? <ParagraphCardDragHandleNonInteractive /> : undefined
      }
      editableHeading={editableHeading}
      toggles={
        showSelectionChrome
          ? modalCardFooterToggles(
              paragraph,
              isSelected,
              updateParagraph,
              structureLockedParagraphIds,
              hideParagraphRequiredChrome
            )
          : undefined
      }
      actions={
        showSelectionChrome
          ? modalCardFooterActions(
              paragraph,
              isSelected,
              updateParagraph,
              middleParagraphActions,
              paragraphs,
              structureLockedParagraphIds,
              editorKind,
              allowAddAfterStructureLockedParagraphs
            )
          : undefined
      }
    >
      {renderFormEditorParagraphBody(
        paragraph,
        updateParagraph,
        isSelected,
        editorKind,
        horizontalTableRowSelectionsByParagraphId,
        onHorizontalTableRowSelectionChange,
        verticalTableBodyRowSelection,
        onVerticalTableBodyRowSelectionChange,
        singleItemListActiveItemId,
        onSelectSingleItemListItem,
        paragraphBodyOptions
      )}
    </ParagraphCard>
  )
}

export interface SortableMiddleCardProps {
  paragraph: WritingFormParagraph
  paragraphIndex: number
  paragraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  selectedCardId: string | null
  onSelectCard: (id: string) => void
  updateParagraph: FormEditorLeftPanelProps['updateParagraph']
  editorKind: FormEditorKind
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: FormEditorLeftPanelProps['onSelectSingleItemListItem']
  horizontalTableRowSelectionsByParagraphId: FormEditorLeftPanelProps['horizontalTableRowSelectionsByParagraphId']
  onHorizontalTableRowSelectionChange: FormEditorLeftPanelProps['onHorizontalTableRowSelectionChange']
  verticalTableBodyRowSelection: FormEditorLeftPanelProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowSelectionChange: FormEditorLeftPanelProps['onVerticalTableBodyRowSelectionChange']
  middleParagraphActions: FormEditorLeftPanelProps['middleParagraphActions']
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  showEditorChrome?: boolean
  structureLockedParagraphIds?: ReadonlySet<string>
  allowAddAfterStructureLockedParagraphs?: boolean
  hideDragHandleForParagraphIds?: ReadonlySet<string>
  hideParagraphRequiredChrome?: boolean
  headingDescriptionExtraClassName?: string
  surveyWriteNumbering?: boolean
}

function SortableMiddleFormCardInner({
  paragraph,
  paragraphs,
  titleNumbering,
  selectedCardId,
  onSelectCard,
  updateParagraph,
  editorKind,
  singleItemListActiveItemId,
  onSelectSingleItemListItem,
  horizontalTableRowSelectionsByParagraphId,
  onHorizontalTableRowSelectionChange,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowSelectionChange,
  middleParagraphActions,
  paragraphBodyOptions,
  showEditorChrome = true,
  structureLockedParagraphIds,
  allowAddAfterStructureLockedParagraphs = false,
  hideDragHandleForParagraphIds,
  hideParagraphRequiredChrome,
  headingDescriptionExtraClassName,
  surveyWriteNumbering = false,
}: SortableMiddleCardProps) {
  useInstitutionApplicationProgramBridge()
  const hideDragHandle =
    (hideDragHandleForParagraphIds?.has(paragraph.id) ?? false) ||
    (editorKind === 'horizontal_table' &&
      structureLockedParagraphIds != null &&
      !allowAddAfterStructureLockedParagraphs)
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: paragraph.id })

  const isSelected = selectedCardId === paragraph.id
  const editableHeadingBase = withoutPlaceholderDescriptionInPreview(
    withoutTitleRequired(
      withSurveyWriteTitleNumbering(
        withMultipleChoiceAllowMultipleTitleHint(
          paragraphEditableHeading(
            paragraph,
            paragraphs,
            titleNumbering,
            isSelected,
            updateParagraph,
            editorKind,
            structureLockedParagraphIds,
            headingDescriptionExtraClassName,
            paragraphBodyOptions?.structureLockedAuthoringOperationalFill === true
          ),
          paragraph
        ),
        paragraphs,
        paragraph,
        titleNumbering,
        surveyWriteNumbering
      ),
      hideParagraphRequiredChrome
    ),
    !showEditorChrome
  )
  const editableHeading = withAgreementAdminProxyConfirmHeading(
    withProgramApplicationFixedScheduleHeading(
      withInstitutionApplicationPreferredScheduleHeading(
        withProgramApplicationFormVolunteerTitleTrailing(
          withUjatProgramApplicationFormInstitutionGradeClassTimeTitleTrailing(
            withUjatProgramApplicationFormInstitutionGradeInfoTitleTrailing(
              withProgramRegistrationEducationScheduleSettingsRegistrationDescription(
                withProgramRegistrationCurriculumTitleTrailing(
                  editableHeadingBase as ParagraphCardEditableHeading,
                  paragraph,
                  paragraphBodyOptions
                ),
                paragraph,
                paragraphBodyOptions
              ),
              paragraph,
              paragraphBodyOptions
            ),
            paragraph,
            paragraphBodyOptions
          ),
          paragraph,
          paragraphBodyOptions
        ),
        paragraph,
        paragraphBodyOptions
      ),
      paragraph,
      paragraphBodyOptions
    ),
    paragraph,
    paragraphBodyOptions
  )
  const adminProxyConfirmCard = isAgreementAdminProxyConfirmCard(paragraph, paragraphBodyOptions)
  const seedFillLocked =
    paragraphBodyOptions?.seedApplicantFillLocked === true &&
    (structureLockedParagraphIds?.has(paragraph.id) ?? false)
  const registrationWizardHighlight = useRegistrationWizardValidationHighlight()
  const paragraphRequiredIncomplete =
    registrationWizardHighlight.attemptId > 0 &&
    registrationWizardHighlight.isParagraphIncomplete(paragraph.id)
  const hideSelectionChrome = useHideParagraphSelectionChrome()
  const showSelectionChrome = showEditorChrome && !hideSelectionChrome

  return (
    <div
      ref={setNodeRef}
      style={{
        // DndContext가 over·active rect 비율로 scaleX/Y를 넣을 수 있어, 동일 폭 리스트에서 카드가 가로로 찌그러짐 → 이동만 반영
        transform:
          transform != null
            ? CSS.Translate.toString({
                x: transform.x,
                y: transform.y,
                scaleX: 1,
                scaleY: 1,
              })
            : undefined,
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
    >
      <ParagraphCard
        dataParagraphId={paragraph.id}
        className={[
          'form-editor-card',
          paragraphRequiredIncomplete ? 'paragraph-card--required-incomplete' : '',
          showSelectionChrome ? 'paragraph-card--selectable' : '',
          showSelectionChrome && selectedCardId === paragraph.id ? 'paragraph-card--active' : '',
          isTitleWithPeriodParagraph(paragraph) ? 'paragraph-card--survey-title-with-period' : '',
          paragraph.kind === 'single_item' && paragraph.variant === 'scale_type'
            ? 'paragraph-card--scale-type'
            : '',
          adminProxyConfirmCard ? 'agreement-admin-proxy-confirm-card' : '',
          seedFillLocked ? 'paragraph-card--seed-fill-locked' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={showEditorChrome ? () => onSelectCard(paragraph.id) : undefined}
        actionSlot={
          showSelectionChrome && !hideDragHandle ? (
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="paragraph-card__drag-handle"
              aria-label="카드 순서 변경"
              onClick={event => event.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <SortOrderDragIcon />
            </button>
          ) : showSelectionChrome && hideDragHandle ? (
            <ParagraphCardDragHandleNonInteractive />
          ) : undefined
        }
        editableHeading={editableHeading}
        toggles={
          showSelectionChrome
            ? modalCardFooterToggles(
                paragraph,
                isSelected,
                updateParagraph,
                structureLockedParagraphIds,
                hideParagraphRequiredChrome
              )
            : undefined
        }
        actions={
          showSelectionChrome
            ? modalCardFooterActions(
                paragraph,
                isSelected,
                updateParagraph,
                middleParagraphActions,
                paragraphs,
                structureLockedParagraphIds,
                editorKind,
                allowAddAfterStructureLockedParagraphs
              )
            : undefined
        }
      >
        {renderFormEditorParagraphBody(
          paragraph,
          updateParagraph,
          isSelected,
          editorKind,
          horizontalTableRowSelectionsByParagraphId,
          onHorizontalTableRowSelectionChange,
          verticalTableBodyRowSelection,
          onVerticalTableBodyRowSelectionChange,
          singleItemListActiveItemId,
          onSelectSingleItemListItem,
          paragraphBodyOptions
        )}
      </ParagraphCard>
    </div>
  )
}

export const PinnedFormCard = memo(PinnedFormCardInner, areFormEditorCardPropsEqual)
export const SortableMiddleFormCard = memo(SortableMiddleFormCardInner, areFormEditorCardPropsEqual)
