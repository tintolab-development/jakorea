# 폼 양식 관리 수동 QA 체크리스트

> 경로: `/templates/form-management`  
> 계정: DEV 임시 로그인 (admin1 / pm1 / partner1 / viewer1 @jakorea.org, `test1234!`)  
> 마스터 MFA: `000000`  
> Notion 인덱스: [2-0 모집](https://app.notion.com/p/tintolab/2-0-391f3e2a77d0807f9a43e3b983ffc13b) · [3-0 신청](https://app.notion.com/p/tintolab/3-0-33af3e2a77d08088bdfaf105deb2f6e5) · [4-0 설문](https://app.notion.com/p/tintolab/4-0-33af3e2a77d08070bad6dbdff5cfa26e) · [5-0 동의](https://app.notion.com/p/tintolab/5-0-33af3e2a77d0809ea5fcd0d79ef84741) · [1. 보고](https://app.notion.com/p/tintolab/1-33af3e2a77d08045b79ff6054bb94352) · [2. 발급](https://app.notion.com/p/tintolab/2-33af3e2a77d080e3a6d3c7128c9c40c3)

## 공통 절차 (양식 1건당)

- [ ] 목록에서 **양식 상세보기** → 풀페이지 모달 진입
- [ ] 단락 선택 → 좌측 카드·우측 커스텀 필드·잠금 안내 문구 확인
- [ ] **단락 이동 유지** — A 입력/선택 → B 선택 → A 재선택 → 값 동일
- [ ] **카드 blur 유지** — structureLocked 객관식·하단동의: A 선택 → B로 blur → draft 유지
- [ ] **미리보기 반영** — authoring 입력·선택이 userPreview/A4에 동일 표시
- [ ] **저장** → 성공 알럿
- [ ] 모달 닫기 → 재진입 → 저장값 유지
- [ ] (해당 시) overlay 필드(모집 정보·일정 등) 저장·복원

### 단락 교차 검증 (실패 시 의심 코드)

| 검증 축 | 확인 방법 | 의심 코드 |
|---------|-----------|-----------|
| 단락 이동 유지 | A 입력 → B → A 재선택 | `updateParagraph`, overlay sync |
| 카드 blur 유지 | structureLocked MC/하단동의 blur 후 draft | `multiple-choice.tsx` `preservePreviewSelectionOnCardBlur` |
| 미리보기 반영 | 미리보기 열기 후 값·선택 일치 | `use-template-preview-controller`, A4 preview |

> **설문 authoring**의 일반 객관식은 blur 시 미리보기 선택 **초기화가 정상**이다. structureLocked 양식(모집·신청·동의)만 blur 유지를 검증한다.

## 작성 양식 — 등록 4종

| templateCode | Notion | structure lock | overlay | 단락 이동 | blur | 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|----------------|---------|-----------|------|----------|------|---------|------|
| `registration-general` | — | ☑ | ☑ | ☐ | — | ☐ | ☑ | — | 참여 대상·일정 |
| `registration-economy` | — | ☑ | ☑ | ☐ | — | ☐ | ☑ | — | 1c-1s 커리큘럼 |
| `registration-ujat` | — | ☑ | ☑ | ☐ | — | ☐ | ☑ | — | UJAT 전용 editor |
| `registration-trained-teachers` | — | ☑ | ☑ | ☐ | — | ☐ | ☑ | — | trainedTeachers variant |

## 작성 양식 — 모집 9종

| templateCode | Notion | structure lock | overlay | 단락 이동 | blur | 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|----------------|---------|-----------|------|----------|------|---------|------|
| `recruitment-instructor` | 2-1 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 단락 추가/삭제/복제 **전부** 비활성 |
| `recruitment-volunteer` | 2-2 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 면접 일정 단락 |
| `recruitment-participant-school` | 2-3 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 상세 정보 overlay |
| `recruitment-participant-individual` | 2-4 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |
| `recruitment-economy` | 2-5 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |
| `recruitment-gemini-visiting-training` | 2-6 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | Gemini overlay |
| `recruitment-ujat-school` | 2-7 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 공고용 프로그램명 |
| `recruitment-ujat-volunteer` | 2-8 | ☑ | ☑ | — | — | — | **Fail** | — | **진입 크래시** — gap #1 |
| `recruitment-trained-teachers` | 2-9 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 일정·차시 단락 |

## 작성 양식 — 신청 11종

| templateCode | Notion | seed lock | overlay/조건부 | 단락 이동 | blur | 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|-----------|----------------|-----------|------|----------|------|---------|------|
| `application-instructor` | 3-1 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | MOCK | 강의 일정·성범죄 조회 |
| `application-volunteer` | 3-2 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 면접·봉사 일정 |
| `application-participant-school` | 3-3 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |
| `application-participant-individual` | 3-4 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |
| `application-economy` | 3-5 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | 2차시 교시 자동 |
| `application-gemini-visiting-training-school` | 3-6 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |
| `application-gemini-visiting-training-instructor` | 3-7 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |
| `application-ujat-school` | 3-8 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | **API** | 희망 교육일 |
| `application-ujat-volunteer` | 3-9 | ☑ | ☑ | ☑ | ☑ | ☐ | ☑ | — | 지원 형태·제출 확인 MC |
| `application-trained-teachers` | 3-10 | ☑ | ☑ | ☐ | ☐ | ☐ | ☑ | — | |

## 작성 양식 — 설문 4종

| templateCode | Notion | 편집 | 단락 이동 | 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|------|-----------|----------|------|---------|------|
| `survey-default` | 4-0 | ☑ | ☐ | ☑ | ☑ | — | |
| `survey-student` | 4-0 | ☑ | ☐ | ☐ | ☑ | — | audience seed |
| `survey-teacher` | 4-0 | ☑ | ☐ | ☐ | ☑ | — | |
| `survey-admin` | 4-0 | ☑ | ☐ | ☐ | ☑ | — | 강의평가 |
| *(신규)* `mode=new&type=survey` | — | ☑ | ☐ | ☐ | ☑ | — | 최초 저장 후 edit 전환 |

## 작성 양식 — 동의 5종

| templateCode | Notion | 편집 경로 | 단락 이동 | blur | A4 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|-----------|-----------|------|-------------|------|---------|------|
| `agreement-portrait` | 5-0 | AgreementShell | ☐ | ☐ | ☐ | ☑ | — | 초상권 |
| `agreement-third-party` | 5-0 | AgreementShell | ☐ | ☐ | ☐ | ☑ | — | 지급조서 사전 |
| `agreement-crime` | 5-0 | **전용 모달** | — | — | ☐ | — | **settingsJson·이미지** | 문서 다운로드/변경 |
| `agreement-notice` | 5-0 | AgreementShell | ☐ | ☑ | ☐ | ☑ | — | 행정정보 |
| `agreement-expense` | 5-0 | AgreementShell | ☑ | ☑ | ☑ | ☑ | — | 교육진행자 서약 MC |

## 발급 양식 — 보고 4종

| templateCode | Notion | A4 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|-------------|------|---------|------|
| `issuance-2` | UJAT 교육계획서 | ☐ | ☑ | — | 안내문·봉사자 4필드 |
| `issuance-ujat-edu-journal` | UJAT 교육일지 | ☐ | ☑ | — | |
| `issuance-3` | 강의보고서 | ☐ | ☑ | — | |
| `issuance-4` | 정산 신청서 | ☐ | ☑ | — | |
| ~~`issuance-5`~~ | 폐기 | — | — | — | 목록 비노출 |

## 발급 양식 — 서류 5종

| templateCode | Notion | settingsJson / schema | 미리보기 | 저장 | BE 대기 | 비고 |
|--------------|--------|----------------------|----------|------|---------|------|
| `document-payment-order-issue` | 지급조서 발급 | Payload A | ☐ | ☑ | — | |
| `document-participation-certificate` | 참가인증서 | settingsJson | ☐ | ☑ | **이미지 URL** | 로고 업로드 |
| `document-3` | 수료증 | settingsJson | ☐ | ☑ | **이미지 URL** | |
| `document-4` | 강사 활동인증서 | settingsJson | ☐ | ☑ | **이미지 URL** | |
| `document-5` | 봉사 활동인증서 | settingsJson | ☐ | ☑ | **이미지 URL** | |

## 회귀 위험 구간 (우선 확인)

1. **모집** — seed 단락 잠금 + 단락 추가 버튼 비노출
2. **신청 일정 단락** — 템플릿=안내문, 프로그램 연동 preview=실데이터
3. **동의 A4** — 표·서명·필수 마크
4. **structureLocked MC** — `agreement-expense` 단락 blur·미리보기 (P0)
5. **인증서** — 이미지 업로드 후 재진입 (localStorage)
6. **API fallback** — mock auth 시 localStorage 저장

## 결과 기록

| 일자 | QA 담당 | BE 연동 | Pass | Fail | 메모 |
|------|---------|---------|------|------|------|
| 2026-09-02 | Playwright E2E smoke | mock auth | 10/10 | 0 | 초기 smoke |
| 2026-09-02 | Playwright E2E 전수 확장 | mock auth, localStorage | **59/60** | **1** | P0 회귀·42종 open+save·양식 테스트; Fail: `recruitment-ujat-volunteer` 진입 크래시 (1 skipped) |

### E2E 재실행

```bash
cd apps/cms && pnpm test:e2e:templates:qa
```

- 포트 **3001** 전용 dev 서버 (기존 `:3000` dev와 충돌 없음)
- BE 자격 불일치 시 `E2E_MOCK_AUTH=1`로 localStorage mock 세션 사용

### BE 시딩 2차 QA

FE 한계·갭 상세: [`form-template-fe-gap-report.md`](./form-template-fe-gap-report.md)
