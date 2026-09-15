# 폼 템플릿 시드 QA — 2인 분담 체크리스트

> **대상:** DB 시딩 완료된 **46종** (`form-template-seeds/` SSOT)  
> **화면:** `/templates/form-management`  
> **절차 SSOT:** [form-template-management-manual-qa-checklist.md](./form-template-management-manual-qa-checklist.md)  
> **시드/API:** [form-template-db-seed-backend-handoff.md](../api/form-template-db-seed-backend-handoff.md)  
> **계정:** DEV 임시 로그인 (admin1 @jakorea.org / `test1234!`) · MFA `000000`

## 분담 요약

| 담당 | 범위 | 건수 |
|------|------|------|
| **A** | 작성 — 등록 · 모집 · 신청 | **23** |
| **B** | 작성 — 동의 · 설문 + 발급 전체 | **23** |
| | **합계** | **46** |

## 공통 절차 (양식 1건당)

기존 수동 QA와 동일. 한 건마다 아래를 전부 체크한다.

- [ ] 목록에 **표시명·category** 노출 (발급 숨김 5종은 API/직접 진입으로 확인)
- [ ] **양식 상세보기** → 풀페이지 모달 진입 (크래시 없음)
- [ ] 단락 선택 → 좌측 카드·우측 필드·잠금 안내 확인
- [ ] **단락 이동 유지** — A 입력 → B → A 재선택 → 값 동일
- [ ] **카드 blur 유지** — structureLocked MC/하단동의만 (설문 일반 MC는 blur 초기화 정상)
- [ ] **미리보기** — authoring 값이 userPreview/A4와 동일
- [ ] **저장** → 성공 → 닫기 → 재진입 → 값 유지
- [ ] (해당 시) overlay 필드 저장·복원

**Pass 기준:** 위 해당 항목 전부. Fail 시 표 `비고`에 증상·재현 경로 기록.

---

## A — 프로그램 작성 양식 (23)

담당: ________ · 일자: ________

### 등록 4

| # | templateCode | 표시명 | 진입 | 단락이동 | blur | 미리보기 | 저장 | Pass | 비고 |
|---|--------------|--------|------|----------|------|----------|------|------|------|
| 1 | `registration-general` | 일반 프로그램 등록 폼 | ☐ | ☐ | — | ☐ | ☐ | ☐ | 참여 대상·일정 |
| 2 | `registration-ujat` | UJAT 프로그램 등록 폼 | ☐ | ☐ | — | ☐ | ☐ | ☐ | UJAT editor |
| 3 | `registration-economy` | 1사1교 프로그램 등록 폼 | ☐ | ☐ | — | ☐ | ☐ | ☐ | 커리큘럼 |
| 4 | `registration-trained-teachers` | 교육받은 교사 프로그램 등록 폼 | ☐ | ☐ | — | ☐ | ☐ | ☐ | trainedTeachers |

### 모집 9

| # | templateCode | 표시명 | 진입 | 단락이동 | blur | 미리보기 | 저장 | Pass | 비고 |
|---|--------------|--------|------|----------|------|----------|------|------|------|
| 5 | `recruitment-instructor` | 공통_강사 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 단락 추가/삭제 비활성 |
| 6 | `recruitment-volunteer` | 공통_봉사자 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 면접 일정 |
| 7 | `recruitment-participant-individual` | 일반_참여자 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 8 | `recruitment-participant-school` | 일반_참여 기관 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 상세 overlay |
| 9 | `recruitment-ujat-school` | UJAT_참여 기관 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 10 | `recruitment-ujat-volunteer` | UJAT_봉사자 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 과거 진입 크래시 회귀 |
| 11 | `recruitment-economy` | 1사1교_참여 기관 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 12 | `recruitment-trained-teachers` | 교육받은 교사_참여 기관 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 일정·차시 |
| 13 | `recruitment-gemini-visiting-training` | Gemini_찾아가는 연수 모집 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Gemini overlay |

### 신청 10

| # | templateCode | 표시명 | 진입 | 단락이동 | blur | 미리보기 | 저장 | Pass | 비고 |
|---|--------------|--------|------|----------|------|----------|------|------|------|
| 14 | `application-instructor` | 공통_강사 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 강의 일정·성범죄 |
| 15 | `application-volunteer` | 공통_봉사자 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 면접·봉사 일정 |
| 16 | `application-participant-individual` | 일반_참여자 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 17 | `application-participant-school` | 일반_참여 기관 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 18 | `application-ujat-school` | UJAT_참여 기관 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 희망 교육일 |
| 19 | `application-ujat-volunteer` | UJAT_봉사자 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 지원 형태 MC |
| 20 | `application-economy` | 1사1교_참여 기관 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 2차시 교시 |
| 21 | `application-trained-teachers` | 교육받은 교사_참여 기관 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 22 | `application-gemini-visiting-training-instructor` | Gemini_찾아가는 연수 강사 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 23 | `application-gemini-visiting-training-school` | Gemini_찾아가는 연수 참여 기관 신청 폼 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

**A 소계:** Pass ____ / 23 · Fail ____ · Blocked ____

**A 우선 회귀**
1. `recruitment-ujat-volunteer` 진입 크래시
2. 모집 전종 — 단락 추가/삭제/복제 비노출
3. 등록↔모집↔신청 **같은 프로그램 유형** 스키마·필수 대칭 (일반 / UJAT / 1사1교 / Gemini / 교육받은 교사)

---

## B — 동의 · 설문 · 발급 (23)

담당: ________ · 일자: ________

### 동의 5

| # | templateCode | 표시명 | 진입 | 단락이동 | blur | A4/미리보기 | 저장 | Pass | 비고 |
|---|--------------|--------|------|----------|------|-------------|------|------|------|
| 1 | `agreement-portrait` | 초상권 수집·이용 동의 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | AgreementShell |
| 2 | `agreement-expense` | 교육진행자 동의 서약서 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | MC blur P0 |
| 3 | `agreement-notice` | 행정정보 공동이용 사전 동의서 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 4 | `agreement-crime` | 성범죄 경력조회 동의서 | ☐ | — | — | ☐ | ☐ | ☐ | 전용 모달·settingsJson |
| 5 | `agreement-third-party` | 지급조서 사전 동의서 | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

### 설문 4

| # | templateCode | 표시명 | 진입 | 단락이동 | 미리보기 | 저장 | Pass | 비고 |
|---|--------------|--------|------|----------|----------|------|------|------|
| 6 | `survey-default` | 설문조사 | ☐ | ☐ | ☐ | ☐ | ☐ | blur 초기화 정상 |
| 7 | `survey-student` | 만족도조사 (학생용) | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 8 | `survey-teacher` | 만족도조사 (교사용) | ☐ | ☐ | ☐ | ☐ | ☐ | |
| 9 | `survey-admin` | 강의평가 (관리자용) | ☐ | ☐ | ☐ | ☐ | ☐ | |

### 발급 — FE 목록 노출 9

| # | templateCode | 표시명 | 진입 | A4/미리보기 | 저장 | Pass | 비고 |
|---|--------------|--------|------|-------------|------|------|------|
| 10 | `document-3` | 수료증 | ☐ | ☐ | ☐ | ☐ | settingsJson·로고 |
| 11 | `document-4` | 강사 활동인증서 | ☐ | ☐ | ☐ | ☐ | 이미지 URL |
| 12 | `document-5` | 봉사 활동인증서 | ☐ | ☐ | ☐ | ☐ | 이미지 URL |
| 13 | `document-participation-certificate` | 참가인증서 | ☐ | ☐ | ☐ | ☐ | 이미지 URL |
| 14 | `issuance-2` | UJAT 교육계획서 | ☐ | ☐ | ☐ | ☐ | |
| 15 | `issuance-3` | 강의보고서 | ☐ | ☐ | ☐ | ☐ | |
| 16 | `issuance-4` | 정산 신청서 | ☐ | ☐ | ☐ | ☐ | |
| 17 | `issuance-ujat-edu-journal` | UJAT 교육일지 | ☐ | ☐ | ☐ | ☐ | |
| 18 | `document-payment-order-issue` | 지급조서(발급용) | ☐ | ☐ | ☐ | ☐ | |

### 발급 — 목록 숨김 5 (API/상세 직접 확인)

목록에 안 보여도 DB·시드에는 있어야 함. 에디터 URL·API로 진입.

| # | templateCode | 표시명 | API 존재 | 진입 | 저장/미리보기 | Pass | 비고 |
|---|--------------|--------|----------|------|---------------|------|------|
| 19 | `issuance-1` | UJAT 결과리포트 | ☐ | ☐ | ☐ | ☐ | FE 비노출 정상 |
| 20 | `issuance-5` | 결과보고서 | ☐ | ☐ | ☐ | ☐ | FE 비노출 정상 |
| 21 | `document-1` | 지출증빙서류(필수폼) | ☐ | ☐ | ☐ | ☐ | FE 비노출 정상 |
| 22 | `document-2` | 휴가 인증서 | ☐ | ☐ | ☐ | ☐ | FE 비노출 정상 |
| 23 | `document-payment-order-pre-consent` | 지급조서 사전 동의서 | ☐ | ☐ | ☐ | ☐ | FE 비노출 정상 |

**B 소계:** Pass ____ / 23 · Fail ____ · Blocked ____

**B 우선 회귀**
1. `agreement-expense` structureLocked MC blur·A4
2. 동의 5종 A4 표·서명·필수 마크
3. 인증서 4종(+`document-2`) 이미지 업로드 후 재진입
4. 발급 탭에 **9종만** 보이는지 (숨김 5종 미노출)

---

## 합산 · 인수

| 일자 | A 담당 | B 담당 | A Pass | B Pass | Fail 합 | BE 연동 | 메모 |
|------|--------|--------|--------|--------|---------|---------|------|
| | | | /23 | /23 | | 실 API / mock | |

### Fail 티켓 템플릿

```
templateCode:
화면: /templates/form-management
재현:
기대:
실제:
스크린샷/콘솔:
```

### 관련

- 수동 QA 상세 표(과거 결과 포함): [form-template-management-manual-qa-checklist.md](./form-template-management-manual-qa-checklist.md)
- FE 갭·2차 QA: [form-template-fe-gap-report.md](./form-template-fe-gap-report.md)
- E2E: `cd apps/cms && pnpm test:e2e:templates:qa`
