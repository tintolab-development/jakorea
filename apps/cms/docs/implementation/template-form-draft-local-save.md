# 템플릿 양식 임시저장 구현 가이드

**작성일**: 2026-05-26  
**상태**: 구현 설계

---

## 1. 목적

템플릿 양식 폼의 `임시저장`은 백엔드 API 연동 없이 브라우저 `localStorage`에 작성 중인 폼 상태를 저장한다. 사용자는 모달을 닫거나 화면을 다시 열어도 마지막으로 임시저장한 내용을 이어서 작성할 수 있어야 한다.

이 문서는 일반 프로그램 등록 폼을 포함한 템플릿 작성 양식에 적용할 표준 임시저장 방식과 구현 순서를 정의한다.

---

## 2. 저장소

저장소는 브라우저의 `localStorage`이다. 서버, DB, mock API에 저장하지 않는다.

| 용도 | localStorage key | 현재 상태 |
|------|------------------|-----------|
| 일반 작성 양식 템플릿 | `cms.jakorea.writingFormTemplateSaves.v1` | 공통 저장 유틸 존재 |
| UJAT 모집 템플릿 | `cms.jakorea.ujatRecruitTemplateSaves.v1` | 별도 저장 유틸 존재 |
| UJAT 프로그램 등록 | `cms.jakorea.ujatRegistrationLocalSaves.v1` | 목록 노출용 임시 프로그램 저장 |

일반 프로그램 등록 폼의 임시저장은 새 저장소를 만들기보다 `cms.jakorea.writingFormTemplateSaves.v1`를 우선 사용한다. 단, 임시저장 결과를 프로그램 목록에 곧바로 노출해야 하는 별도 요구가 생기면 UJAT 프로그램 등록처럼 도메인 전용 저장소를 둘 수 있다.

---

## 3. 저장 단위

기본 저장 단위는 `templateId`이다. 하나의 `templateId`에는 가장 최근 임시저장 1건만 유지한다.

```json
{
  "version": 1,
  "byTemplateId": {
    "registration-general": {
      "version": 1,
      "templateId": "registration-general",
      "savedAt": "2026-05-26T10:00:00.000Z",
      "draft": {},
      "overlay": {},
      "editorState": {}
    }
  }
}
```

여러 단계 또는 탭이 있는 플로우는 다음 중 하나를 선택한다.

| 방식 | 사용 조건 | 예시 |
|------|-----------|------|
| 단계별 `templateId` 저장 | 각 단계가 독립 템플릿으로 동작할 때 | `registration-general`, `recruitment-ujat-school` |
| 플로우 단위 저장 | 한 화면에서 여러 탭 상태를 한 번에 복원해야 할 때 | `program-registration-general-flow` |

현재 코드 구조는 UJAT 플로우처럼 단계별 editor VM을 전환하는 방식이므로, 우선은 단계별 `templateId` 저장을 따른다. 탭 이동 상태까지 복원해야 하면 `editorState.activeStep`을 함께 저장한다.

---

## 4. 저장 데이터 모델

임시저장은 세 종류의 상태를 하나의 스냅샷으로 저장한다.

| 필드 | 역할 | 저장 대상 |
|------|------|-----------|
| `draft` | `WritingFormDraft` 기반 템플릿 구조와 단락 값 | 제목 번호, 단락 순서, `updateParagraph`로 관리되는 테이블/문항 값 |
| `overlay` | `WritingFormDraft` 밖에서 관리되는 단락 입력값 | 단락 내부 `useState`, 미리보기와 공유해야 하는 상세 입력 |
| `editorState` | 에디터 훅의 로컬 UI/구조 상태 | 참여 대상, 프로그램 유형, 차시 수, 활성 단락, 활성 탭 |

기존 공통 유틸은 이 구조를 이미 지원한다.

```typescript
export type WritingFormTemplateSaveRecord = {
  version: 1
  templateId: string
  savedAt: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
}
```

---

## 5. 저장/복원 대상 구분

### 5.1 `draft`에 저장할 것

`WritingFormDraft` 안에 이미 들어가거나 `updateParagraph`로 변경되는 값은 `draft`에 둔다.

- 단락 목록과 순서
- 단락 제목, 설명, 필수 여부
- 가로형/세로형 테이블 구조와 셀 값
- 객관식/주관식/날짜/시간 등 공통 문항 설정
- `formSettings.titleNumbering`

### 5.2 `overlay`에 저장할 것

단락 컴포넌트 내부에서 `useState`로만 관리되는 입력값은 `overlay`에 둔다. 특히 풀페이지와 미리보기 모달이 동시에 마운트될 수 있는 값은 overlay store를 통해 공유해야 한다.

예시:

- 일반 프로그램 기본 정보의 사업 분야, 담당자, 운영 기간 등 상세 입력
- 안내 사항의 라디오 선택값
- 선호 일정의 복합 입력 상태
- UJAT 등록 폼처럼 `WritingFormDraft`에 넣기 애매한 도메인 입력값

키는 충돌을 피하기 위해 단락/영역 prefix를 붙인다.

```typescript
const GENERAL_PROGRAM_REGISTRATION_OVERLAY_KEYS = {
  businessField: 'generalRegistration.basicInfo.businessField',
  partnerInvolvement: 'generalRegistration.basicInfo.partnerInvolvement',
  guidanceComputerRoom: 'generalRegistration.guidance.computerRoom',
} as const
```

### 5.3 `editorState`에 저장할 것

에디터 훅에서 단락 렌더링 조건이나 개수 제어에 사용하는 state를 저장한다.

일반 프로그램 등록 기준 후보:

```typescript
type ProgramRegistrationEditorState = {
  participant: {
    individual: boolean
    organization: boolean
    teacherInstructor: boolean
    volunteer: boolean
  }
  programType: 'curriculum' | 'schedule'
  sessionRoundType: 'single' | 'multi'
  educationFormScheduleDetail: 'common' | 'individual'
  participationScheduleDetail: 'common' | 'individual'
  ipsScheduleDetail: 'common' | 'individual'
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  scheduleCurriculumPreEducation: boolean
  activeParagraphId?: string | null
  activeStep?: string
}
```

---

## 6. 구현 절차

### 6.1 공통 저장 유틸 사용

일반 작성 양식은 `apps/cms/src/features/template/lib/writing-form-template-local-save.ts`의 함수를 사용한다.

```typescript
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
```

저장 시 `normalizeWritingFormDraft()`가 적용되므로 오래된 저장본도 로드 시 최소한의 스키마 보정이 가능하다.

### 6.2 일반 프로그램 등록 overlay store 추가

UJAT 등록 폼의 `ujat-program-registration-overlay-sync.ts`와 같은 패턴으로 일반 프로그램 등록 전용 overlay store를 만든다.

권장 파일:

```text
apps/cms/src/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync.ts
```

필수 API:

```typescript
export function getProgramRegistrationOverlayRecord(): Record<string, unknown>
export function replaceProgramRegistrationOverlay(next: Record<string, unknown>): void
export function resetProgramRegistrationOverlay(): void
export function useProgramRegistrationOverlayKv<T>(key: string, defaultValue: T): [T, (next: T) => void]
```

UJAT overlay store에는 `replace` 함수가 없으므로 일반 프로그램 등록에서는 복원을 위해 반드시 추가한다.

### 6.3 단락 내부 state를 overlay로 이전

현재 일반 프로그램 등록 단락 중 일부는 컴포넌트 내부 `useState`를 사용한다. 임시저장 대상인 필드부터 다음 형태로 바꾼다.

변경 전:

```typescript
const [businessField, setBusinessField] = useState('')
```

변경 후:

```typescript
const [businessField, setBusinessField] = useProgramRegistrationOverlayKv(
  'generalRegistration.basicInfo.businessField',
  ''
)
```

이전 우선순위는 다음과 같다.

1. 사용자가 직접 입력하는 텍스트/셀렉트/라디오
2. 화면 조건 분기를 바꾸는 값
3. 미리보기에서 동일하게 보여야 하는 값
4. 단순 UI focus나 임시 hover 상태는 제외

### 6.4 `useProgramRegistrationEditor`에서 저장 구현

`use-program-registration-editor.ts`의 빈 `handleSave`에 저장 스냅샷 생성을 연결한다.

```typescript
const handleSave = useCallback(() => {
  try {
    persistWritingFormTemplateSave({
      templateId: `registration-${programRegistrationFormVariant}`,
      draft,
      overlay: { ...getProgramRegistrationOverlayRecord() },
      editorState: {
        participant,
        programType,
        sessionRoundType,
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail,
        curriculumSessionCount,
        curriculumChartSessionCount,
        scheduleCurriculumDetailCount,
        scheduleCurriculumGroupCount,
        scheduleCurriculumPreEducation,
        activeParagraphId,
      },
    })
  } catch (error) {
    console.debug('programRegistrationEditor save failed', error)
  }
}, [
  activeParagraphId,
  curriculumChartSessionCount,
  curriculumSessionCount,
  draft,
  educationFormScheduleDetail,
  ipsScheduleDetail,
  participant,
  participationScheduleDetail,
  programRegistrationFormVariant,
  programType,
  scheduleCurriculumDetailCount,
  scheduleCurriculumGroupCount,
  scheduleCurriculumPreEducation,
  sessionRoundType,
])
```

저장 성공 후 사용자에게 `임시 저장` 확인 모달을 띄우는 것은 호출부 또는 공통 `TemplateFullpageModal` 상위에서 처리한다.

### 6.5 `useProgramRegistrationEditor`에서 복원 구현

`active`가 true가 되는 시점에 저장본을 먼저 확인한다.

```typescript
useEffect(() => {
  if (!active) return

  const templateId = `registration-${programRegistrationFormVariant}`
  const saved = loadWritingFormTemplateSave(templateId)

  if (saved) {
    const next = normalizeWritingFormDraft(saved.draft)
    setDraft(next)
    setActiveParagraphId(
      typeof saved.editorState?.activeParagraphId === 'string'
        ? saved.editorState.activeParagraphId
        : next.paragraphs[0]?.id ?? null
    )
    replaceProgramRegistrationOverlay(saved.overlay ?? {})
    restoreProgramRegistrationEditorState(saved.editorState)
    return
  }

  resetProgramRegistrationOverlay()
  resetProgramRegistrationEditorToSeed()
}, [active, programRegistrationFormVariant])
```

복원 로직은 안전하게 좁혀서 적용한다. `editorState`는 `unknown`에서 들어오기 때문에 문자열 union, number range, boolean 여부를 확인한 뒤 setter를 호출한다.

예시:

```typescript
function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}
```

### 6.6 모달 닫기와 overlay 초기화

작성 중인 값을 모달 닫기만으로 삭제하지 않는다. 닫을 때는 메모리 overlay만 초기화하고, `localStorage` 저장본은 유지한다.

```typescript
useEffect(() => {
  if (!active) {
    resetProgramRegistrationOverlay()
    closeWritingUserPreview()
  }
}, [active, closeWritingUserPreview])
```

저장본 삭제는 최종 제출 또는 명시적 삭제 액션에서만 수행한다.

---

## 7. UX 정책

### 7.1 임시저장 버튼

상단 `임시저장` 버튼 클릭 시 현재 탭 또는 현재 단계의 스냅샷을 저장한다.

저장 성공 메시지:

```text
작성 내용을 임시 저장하였습니다.
임시 저장본은 가장 최근에 저장한 1개의 항목만 유지됩니다.
```

### 7.2 저장본 복원

권장 동작은 자동 복원이다. 사용자가 폼을 다시 열었을 때 저장본이 있으면 바로 반영한다.

별도 확인 UX가 필요하면 다음 문구를 사용한다.

```text
임시 저장된 내용이 있습니다.
이어서 작성하시겠습니까?
```

확인 모달을 둘 경우 `불러오기`는 저장본을 적용하고, `새로 작성`은 메모리와 localStorage 저장본을 삭제하거나 해당 세션에서 무시한다.

### 7.3 최종 등록 완료

최종 등록 완료 API가 생기면 성공 시 해당 `templateId`의 임시저장 record를 삭제한다. API가 없는 mock 단계에서는 최종 완료 버튼이 실제 완료 의미를 갖는 화면에서만 삭제한다.

---

## 8. 삭제 API

현재 공통 저장 유틸에는 삭제 함수가 없다. 최종 제출 후 저장본 제거를 위해 다음 함수를 추가한다.

```typescript
export function removeWritingFormTemplateSave(templateId: string): void {
  const file = readFile()
  delete file.byTemplateId[templateId]
  writeFile(file)
}
```

저장 후 목록/상세가 같은 저장본을 보고 있다면 삭제 후에도 `WRITING_FORM_TEMPLATE_SAVE_EVENT`와 같은 이벤트를 발행해 구독 화면을 갱신한다.

---

## 9. localStorage 장애 처리

`localStorage`는 다음 경우 실패할 수 있다.

- 브라우저 저장소 용량 초과
- 사생활 보호 모드 또는 브라우저 정책
- JSON 파싱 불가한 손상 데이터

정책:

1. `load` 실패 시 저장본이 없는 것으로 간주하고 시드 draft를 사용한다.
2. `save` 실패 시 사용자에게 실패 안내를 띄운다.
3. 개발 로그는 `console.debug` 수준으로 남긴다.

저장 실패 메시지:

```text
임시 저장에 실패했습니다.
브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.
```

---

## 10. 구현 체크리스트

- [ ] `templateId` 결정: `registration-general`, `registration-economy` 등
- [ ] 일반 프로그램 등록 overlay store 추가
- [ ] 복원이 필요한 단락 내부 `useState`를 overlay hook으로 이전
- [ ] `useProgramRegistrationEditor.handleSave`에서 `draft + overlay + editorState` 저장
- [ ] `active` 진입 시 저장본 로드 및 editorState 복원
- [ ] 모달 닫힘 시 메모리 overlay만 초기화
- [ ] 최종 완료 시 저장본 삭제 함수 연결
- [ ] 저장 성공/실패 모달 연결
- [ ] DevTools `localStorage`에서 저장 키 확인
- [ ] 새로고침 후 폼 재진입 시 복원 확인

---

## 11. 수동 검증 시나리오

1. 일반 프로그램 등록 폼을 연다.
2. 기본 정보, 참여 대상, 교육 과정, 일정 관련 값을 변경한다.
3. `임시저장`을 클릭한다.
4. DevTools에서 `cms.jakorea.writingFormTemplateSaves.v1` 값을 확인한다.
5. 모달을 닫았다가 다시 연다.
6. `draft`, `overlay`, `editorState` 값이 모두 복원되는지 확인한다.
7. 미리보기를 열고 풀페이지와 동일 값이 보이는지 확인한다.
8. 다른 탭/단계로 이동한 뒤 임시저장하고 재진입 시 해당 단계 상태가 유지되는지 확인한다.
9. 최종 등록 완료 후 같은 폼을 다시 열었을 때 이전 저장본이 남아 있지 않은지 확인한다.

---

## 12. 주의사항

- 비밀번호, 주민등록번호, 파일 원본 등 민감 정보는 `localStorage`에 저장하지 않는다.
- `File` 객체는 JSON 직렬화가 되지 않으므로 저장하지 않는다. 파일 첨부 임시저장이 필요하면 IndexedDB를 별도 검토한다.
- 단락별로 localStorage key를 여러 개 만들지 않는다. 복원 순서와 삭제 정책이 복잡해진다.
- `overlay` key는 사람이 읽을 수 있는 namespace를 사용한다.
- 저장본은 같은 브라우저와 같은 origin에서만 공유된다. 다른 브라우저, 시크릿 창, 다른 PC와는 공유되지 않는다.
- 브라우저 저장소이므로 배포 환경의 실제 API 저장과 동일한 신뢰성을 기대하지 않는다.

---

## 13. 관련 파일

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/template/lib/writing-form-template-local-save.ts` | 일반 작성 양식 localStorage 저장 유틸 |
| `apps/cms/src/features/template/hooks/use-program-registration-editor.ts` | 일반 프로그램 등록 editor VM, 저장/복원 연결 대상 |
| `apps/cms/src/features/template/ui/form-set/registration-form/UJAT/use-ujat-program-registration-editor.ts` | UJAT 등록 폼 저장 참고 구현 |
| `apps/cms/src/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync.ts` | overlay store 참고 구현 |
| `apps/cms/src/features/template/hooks/use-program-participant-application-editor.ts` | 일반 템플릿 저장/복원 참고 구현 |
| `apps/cms/src/features/program/ujat/lib/ujat-registration-local-save.ts` | 목록 노출형 UJAT 등록 임시저장 참고 구현 |
