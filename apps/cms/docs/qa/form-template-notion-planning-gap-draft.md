# 양식 Notion 기획 보강 초안 (14종 + 공통)

> Notion 인덱스는 **시안 작업 완료**이나, **양식별 상세 페이지가 없는** 항목은 CMS 구현·QA 시 기획 공백이 있다.  
> 아래 초안을 Notion `CMS 어드민 기능정의서` DB에 **5-x / 1-x / 2-x / 4-x** 형식으로 보강할 때 사용한다.

---

## 1. 동의 양식 5종 (`5-0` 하위)

공통 에디터 규칙 (모든 동의 양식):

- 단락 추가·삭제·복제 **비활성** (성범죄 경력조회는 **이미지 교체만**)
- 일부 텍스트만 수정 가능 (개인정보 테이블 설명 등)
- A4 content-only 미리보기
- `requiredMark` / 답변 필수 고정

### 5-1. `agreement-portrait` — 초상권 수집·이용 동의

| 구분 | 기획 항목 |
|------|----------|
| 단락 | 서문 · 개인정보 동의 표 · 대리인 동의 표 · 이용 목적 표 |
| 필수 | 성명·소속·연락처·서명 |
| 보유기간 | 10년(일반) / 5년(14세 미만) — **하드코딩, 수정 불가** |
| 미리보기 | A4, 하단 동의 체크/서명 영역 |

### 5-2. `agreement-third-party` — 지급조서 사전 동의서

| 구분 | 기획 항목 |
|------|----------|
| 단락 | 제목 · 본문 조항 · 지급조서 기본정보 sidecar 연동 표 |
| fill | `PaymentStatementBasicInfoValues` sidecar — CMS fill과 Platform fill **동일 키** |
| 미리보기 | A4, 4조항 + 서명 |

### 5-3. `agreement-crime` — 성범죄 경력조회 동의서

| 구분 | 기획 항목 |
|------|----------|
| Payload | **D** — `schemaJson` empty, `settingsJson.documentImageUrl` |
| 편집 | 전체화면 모odal, **문서 이미지** 교체만 |
| fill | 회원 동의 = **파일(evidence)** 업로드, draft preview 아님 |
| BE | version GET·이미지 스토리지 |

### 5-4. `agreement-notice` — 행정정보 공동이용 사전 동의서

| 구분 | 기획 항목 |
|------|----------|
| 단락 | 제목 · 주체(성명/생년/연락처) · 기관 · 목적 · ID 유형 테이블 · 확인·서명 |
| 테이블 | 주민등록번호 / 운전면허 / 여권 — **행 추가 불가** |
| 미리보기 | A4 |

### 5-5. `agreement-expense` — 교육진행자 동의 서약서

| 구분 | 기획 항목 |
|------|----------|
| 제목 | `JA Korea 교육진행자 서약서` (안 제거) |
| 단락 | 4조항 본문 · 서명 · 날짜 |
| 대상 | 강사 & UJAT 봉사자 |

---

## 2. 보고 양식 4종 (`1. 보고` 하위)

공통: structure lock on seed IDs, A4 미리보기, `settingsJson: null`

### 1-1. `issuance-2` — UJAT 교육계획서

| 단락 | 내용 |
|------|------|
| 안내문 | 3항 설명 (시드 `UJAT_EDU_PLAN_EXPLANATION_BODY`) |
| 봉사자 정보 | name, addressRegion, educationTarget, educationGrade (기본 4필드) |
| 마감 | 작성 기간 프리셋 |
| 주소 라벨 | `자택 주소지` |

### 1-2. `issuance-ujat-edu-journal` — UJAT 교육일지

| 단락 | 내용 |
|------|------|
| 베이스 | 교육계획서와 동일 + 교육정보 · 피드백 · 사진 |
| 사용처 | [과제 관리 보기](https://app.notion.com/p/tintolab/36cf3e2a77d08071ba3ee54b3318636b) PDF 미리보기 |

### 1-3. `issuance-3` — 강의보고서

| 구분 | 기획 항목 |
|------|----------|
| 참고 | CMS [강의보고서 탭](https://app.notion.com/p/tintolab/382f3e2a77d08065ba0ccc4ec0674428) · 제출 내역 팝업 |
| 템플릿 | 단락 목록·필수·A4 레이아웃 **신규 페이지 필요** |

### 1-4. `issuance-4` — 정산 신청서

| 구분 | 기획 항목 |
|------|----------|
| 템플릿 | 정산 항목·증빙·서명 단락 **신규 페이지 필요** |

---

## 3. 발급 서류 5종 (`2. 발급` 하위)

### 2-1. `document-payment-order-issue` — 지급조서 (발급용)

- Payload A, schemaJson full
- A4 발급 레이아웃·직인·금액 표

### 2-2. `document-participation-certificate` — 참가인증서

- Payload D (`settingsJson`: titleName, bodyContent, logos…)
- [수료증/참여인증서 발급](https://app.notion.com/p/tintolab/37af3e2a77d08059a177c8a767f099a1): 발급 사유 셀렉 → 양식 반영

### 2-3. `document-3` — 수료증

- settingsJson, 이수 조건·3년 발급 기한 (발급 UX와 연동)

### 2-4. `document-4` / `document-5` — 강사·봉사 활동인증서

- Notion: 「발급 받는 사용자에 따라 구분」
- templateCode 분리 (`document-4` / `document-5`)

---

## 4. 설문 4종 (`4-0` 하위) — audience seed 정의

| templateCode | Notion 제목 | seed 차이 (제안) |
|--------------|------------|------------------|
| `survey-default` | 설문조사 | 기본 middle 문항 |
| `survey-student` | 만족도 (학생) | 학생용 카피·문항 프리셋 |
| `survey-teacher` | 만족도 (교사) | 교사용 카피 |
| `survey-admin` | 강의평가 (관리자) | 관리자 평가 항목 |

현재 코드: JSON seed 4종 분리, factory `createDefaultSurveyDraft()` 단일 → **audience별 default middle 문항** Notion 정의 필요.

---

## 5. 신규 Notion 페이지 작성 템플릿

각 양식 상세 페이지에 포함할 callout (모집·신청과 동일 형식):

1. **단락 선택 시** — 잠금·토글·버튼 비활성 규칙
2. **단락별 toggle** — 필드 타입·필수·조건부 노출·플레이스홀더
3. **미리보기** — authoring vs user 모드 차이
4. **저장** — overlay / editorState / settingsJson 여부

---

## 6. 우선 보강 순서

1. **동의 5종** — fill·A4·회원 상세 연동 QA blocker
2. **보고 issuance-3/4** — 템플릿 상세 없음
3. **발급 인증서 4종** — settingsJson 필드·로고
4. **설문 audience seed** — 4-1~4-4
