# 강사진 추가 모달 명세 (개발 위임)

**대상**: 프로그램 상세 > 프로그램 진행현황 > 강사 정보 탭  
**역할**: 기획·디자이너·PM 디테일 확인 후 개발자 위임용  
**참조**: [persona.md](../../.cursor/rules/process/persona.md), [school-detail-add-instructor-assign-spec.md](./school-detail-add-instructor-assign-spec.md)

---

## 1. 요구사항 요약

- **트리거**: 프로그램 진행현황 > 강사 정보 탭에서 **「강사 추가」** 버튼 클릭 시
- **동작**: **강사진 추가** 모달이 노출되어, 강사 기본 정보·프로필 사진·최종 학력·경력 상세·자격 및 면허·수상 및 수료 내역을 입력한 뒤 추가할 수 있어야 함.
- **모달 치수**: width **1400px**, 헤더 제외 바디 height **830px**. 항목 추가 버튼 **100×32px**, 섹션 디바이더 **1×13px**.

---

## 2. 사용자 시나리오 (기획)

| 단계 | 사용자 행동 | 시스템 동작 |
| ---- | ----------- | ----------- |
| 1 | 강사 정보 탭에서 「강사 추가」 클릭 | 강사진 추가 모달이 열림 (1400×830 바디) |
| 2 | 기본 정보(성명·주소·연락처·이메일·정산 계좌·학교 배정 등) 입력 | 필수 필드 검증 적용 |
| 3 | (선택) 프로필 사진 업로드 | 이미지 미리보기 또는 placeholder 유지 |
| 4 | 최종 학력·경력·자격·수상 섹션에서 반복 항목 입력 및 「항목 추가」 | Form.List로 행 추가 |
| 5 | 「추가」 클릭 | 폼 검증 통과 시 참여 강사진 목록에 1건 추가, 모달 닫힘 |
| 6 | 「닫기」 또는 X/마스크 클릭 | 모달만 닫힘, 변경 없음 |

**예외**

- 필수 필드(한글 성명·연락처·이메일·주소·정산 계좌·최종 학력 검색 등) 미입력 시 「추가」 클릭 → 필수 입력 검증 메시지 표시.
- 프로필 사진 미등록 시에도 추가 가능(선택 항목).

---

## 3. UI/디자인 스펙 (디자이너)

### 3.1 모달 공통

| 항목 | 값 | 비고 |
| -------- | -------- | -------- |
| 컴포넌트 | `TealHeaderModal` | `width={1400}`, `className="teal-header-modal--instructor-add"` |
| 제목 | **강사진 추가** | 헤더 청록 배경, 흰색 텍스트 |
| 바디 높이 | 830px | 헤더 제외, min-height |
| 닫기 | 헤더 우측 X + 마스크 클릭 | 기존 TealHeaderModal 동작 |
| 푸터 | 닫기(보조) / 추가(주요, 청록) | AppButton variant="cancel" / variant="primary" modalTeal |

### 3.2 기본 정보 영역 치수

| 항목 | 값 | 비고 |
| -------- | -------- | -------- |
| 기본 정보 영역 전체 | 1340×384px | 프로필 + 우측 테이블 포함 |
| 프로필 사진 추가 영역 | 192×256px | 좌측, 연한 회색 테두리·카메라 아이콘 |
| 우측 테이블 영역 | 나머지 폭 × 384px | 1px 보더 테이블, 라벨 셀 회색·입력 셀 흰색 |

### 3.3 기본 정보 섹션 — 테이블 구조 (인풋이 아닌 테이블)

- **구조**: `<table>` 3열. `col1` 라벨(120px, 회색 배경) | `col2` 좌측 입력 | `col3` 우측 입력. 셀마다 세로·가로 구분선(1px border).
- **행 구성**:
  - 1행: 성명*(rowspan 3) | 한글* 입력 | 생년월일* 입력
  - 2행: | 한자* 입력 | 연락처* 입력
  - 3행: | 영문* 입력 | 이메일* 입력
  - 4행: 주소* | 주소 검색 입력 | 성별 및 병역사항* (드롭다운 2개)
  - 5행: 정산 계좌 정보* | 은행명·계좌번호·예금주명 (colspan 2)
  - 6행: 최종 학력* | 전체 드롭다운 + 학교명 검색 (colspan 2)
  - 7행: 학교 배정 | Select (colspan 2)
- **라벨 셀**: `background: var(--color-fill-quaternary)`, 필수 항목 레이블 옆 `*` 표시.
- **입력 셀**: 흰색 배경, 패딩 적용.

### 3.4 최종 학력 섹션

- 상단: 최종 학력 — 학교/상태 드롭다운.
- 반복 행: "대학 4년제" — 학교명, 전공, 입학년도, 졸업년도, 행 삭제(X).
- **항목 추가** 버튼: 100×32px, 청록 배경, 섹션 우측.

### 3.5 경력 상세 섹션

- 경력 구분: **신입** / **경력** 라디오.
- 반복 행: 경력 01 — 회사명, 담당 업무, 입사연월, 퇴사연월, 재직중 체크박스, 행 삭제(X).
- **항목 추가** 버튼: 100×32px.

### 3.6 자격 및 면허 / 수상 및 수료 내역 섹션

- 반복 행: 자격증·면허 + 취득연도 / 수상·수료 + 수상·수료연도, 행 삭제(X).
- **항목 추가** 버튼: 각 100×32px.

### 3.7 디바이더

- 섹션 사이 구분: **1×13px** 세로 선, `var(--color-border)`.

---

## 4. 데이터·로직 (개발자 참고)

### 4.1 폼 값 (AddInstructorFormValues)

- 기본: nameKorean, nameHanja, nameEnglish, birthDate, contact, email, address, gender, militaryStatus, bankName, accountNumber, accountHolder, educationLevel, educationSearch, schoolName.
- 반복: educations[], careers[], qualifications[], awards[] (각 항목 구조는 add-instructor-modal.tsx 타입 참고).

### 4.2 목록 행 매핑

- `buildInstructorRowFromForm(values, nextNo, nextId)`: nameKorean(우선) 또는 nameEnglish/nameHanja → instructorName, schoolName → 학교 배정. 나머지 참여 강사 행 필드는 mock 기본값(educationGrade, classCount, settlementStatus 등).

### 4.3 트리거

- `program-progress-tab.tsx`: 강사 정보 탭 상단 「강사 추가」 버튼 `onClick` → `setAddInstructorModalOpen(true)`.

---

## 5. 개발 작업 체크리스트

- [x] TealHeaderModal 바디 830px: `teal-header-modal--instructor-add` 클래스 및 CSS min-height: 830px.
- [x] AddInstructorModal: width 1400, 프로필 사진 영역(180×230), 기본 정보 2열, 최종 학력/경력/자격/수상 섹션, Form.List, 항목 추가 100×32, 디바이더 1×13.
- [x] AddInstructorFormValues 확장, buildInstructorRowFromForm에서 nameKorean/nameEnglish/nameHanja → instructorName 매핑.
- [ ] (선택) React Hook Form + Zod 검증 적용 — 기획 명세 확정 후.

---

## 6. 검증 기준 (Acceptance)

- 강사 정보 탭에서 「강사 추가」 클릭 시 **강사진 추가** 모달이 노출되고, 모달 width 1400px·바디 최소 높이 830px이 적용되어 있다.
- 기본 정보 섹션에 프로필 사진 placeholder(180×230, 카메라 아이콘)와 2열 필드(성명·주소·정산 계좌·최종 학력 / 생년월일·연락처·이메일·성별·병역·학교 배정)가 있다.
- 최종 학력·경력 상세·자격 및 면허·수상 및 수료 섹션에 반복 행과 「항목 추가」 버튼(100×32)이 있으며, 섹션 사이에 1×13 디바이더가 있다.
- 「추가」 클릭 시 필수 필드 검증 후 참여 강사진 목록에 1건 추가되고 모달이 닫힌다. 「닫기」 또는 X/마스크 클릭 시 모달만 닫힌다.

---

**문서 버전**: 1.0  
**작성 기준**: 스크린샷·계획서(강사진 추가 모달 위임), persona 기획·디자이너·개발자 역할별 위임 반영
