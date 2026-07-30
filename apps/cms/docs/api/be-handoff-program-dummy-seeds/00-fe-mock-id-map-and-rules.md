# 00 — FE mock ID ↔ BE 시드 규칙 · ID 맵

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | 백엔드 더미 시드 생성 |
| **원칙** | **FE mock이 SSOT**. BE는 mock과 **같은 분기·같은 LNB**가 열리게 시드한다. |

---

## 1. 공통 규칙

1. **식별자**
   - FE mock은 문자열 id (`general-prog-…`, `economy-prog-001`).
   - BE는 숫자 PK(`166401` 등)를 써도 된다. 그 경우 **본 문서 맵 또는 title 접두어**로 FE·QA가 대응할 수 있게 한다.
   - 가능하면 response에 `externalKey` / `demoCaseCode` 등 mock id를 **그대로** 넣는 필드를 권장한다.

2. **title 접두어 (권장)**

   | 유형 | 접두어 예 |
   |------|-----------|
   | 일반 | `[일반더미]` 또는 FE mock title 그대로 |
   | 1사1교 | `[1사1교더미]` |
   | UJAT | `[UJAT더미]` |
   | 교육받은 교사 | `[TT더미]` |
   | Gemini | `[Gemini더미]` |

3. **programType**

   | 메뉴 | OpenAPI `programType` |
   |------|------------------------|
   | 일반 | `GENERAL` / `GENERAL_ORGANIZATION` / `GENERAL_INDIVIDUAL` (BE SSOT에 맞게) |
   | 1사1교 | `COMPANY_SCHOOL` (`ONE_COMPANY_ONE_SCHOOL` legacy와 병존 시 필터 문서화) |
   | UJAT | `UJAT` (`UJAT_DGBONG` legacy 병존 주의) |
   | 교육받은 교사 | `TRAINED_TEACHER` |
   | Gemini 찾아가는 연수 | FE 잠정 `GEMINI_TRAINING` — BE 확정 시 문서 갱신 |

4. **상태**
   - FE UI lifecycle(`recruiting_students` 등) ↔ API `periodStatus`(`SCHEDULED`/`RECRUITING`/`ACTIVE`/`COMPLETED`) 매핑을 시드마다 명시한다.
   - 시드 원본(`프로그램유형.md`) CASE-19~21은 화면명에 예정·진행·완료가 섞여도 DB `period_status`가 모두 `SCHEDULED`일 수 있음 → **의도적 불일치면 문서에 남길 것**.

5. **하위 데이터**
   - 프로그램만 만들고 신청·참여자를 안 넣으면 상세 LNB가 비어 보인다.
   - ACTIVE/COMPLETED 시드는 [`05-nested-child-data-dummy-seed.md`](./05-nested-child-data-dummy-seed.md)를 **같이** 적용한다.

---

## 2. BE local demo ID (프로그램유형.md) ↔ FE mock / CASE

BE에 이미 `166401` 시리즈가 있다면 **재사용**하고, FE mock CASE와 아래처럼 맞춘다.  
없으면 FE mock id 기준으로 신규 생성해도 된다.

### 2.1 일반 28 CASE

| BE ID | CASE | FE mock `programId` (대표) | 시나리오 요약 |
|-------|------|----------------------------|---------------|
| 166401 | 01 | `general-prog-type-org-curriculum-single` | 기관·커리큘럼·단일·강사·봉사면접·설문 |
| 166402 | 02 | `general-prog-type-org-curriculum-multi` | 기관·복수 회차 |
| 166403 | 03 | `general-prog-type-ind-curriculum-single` | 개인·커리큘럼·단일·면접 |
| 166404 | 04 | `general-prog-type-ind-curriculum-multi` | 개인·복수 |
| 166405 | 05 | `general-prog-type-org-schedule-single` | 기관·일정형·단일 |
| 166406 | 06 | `general-prog-type-org-schedule-multi` | 기관·일정형·복수 |
| 166407 | 07 | `general-prog-type-ind-schedule-single` | 개인·일정형·단일 |
| 166408 | 08 | `general-prog-type-ind-schedule-multi` | 개인·일정형·복수 |
| 166409 | 09 | `general-prog-type-org-curriculum-multi-edu-ips-per-schedule` | 교육/IPS 일정별 상이 |
| 166410 | 10 | `general-prog-lnb-16` | LNB full · 봉사 면접 2depth |
| 166411 | 11 | `general-prog-lnb-17` | 봉사 면접 없음 |
| 166412 | 12 | `general-prog-lnb-18` | 강사 없음 · 봉사 면접 |
| 166413 | 13 | `general-prog-lnb-19` | 최소 LNB |
| 166414 | 14 | `general-prog-lnb-20` | 설문만 · 완료 |
| 166415 | 15 | `general-prog-lnb-21` | 강사만 · 모집 |
| 166416 | 16 | `general-prog-lnb-22` | 봉사만+면접 · 모집 |
| 166417 | 17 | `general-prog-lnb-23` | 강사+봉사면접 · 설문없음 |
| 166418 | 18 | `general-prog-lnb-24` | 봉사+설문 · 완료 |
| 166419 | 19 | `general-prog-scheduled-2` | 개인 ·명 UJAT 36기 |
| 166420 | 20 | `general-prog-in-progress-2` | 특별한 JOB탐 |
| 166421 | 21 | `general-prog-completed-2` | Global Career Discovery |
| 166422 | 22 | `general-prog-in-progress-3` | 기관·봉사 면접 |
| 166423 | 23 | `general-prog-completed-1` | SAP 함께 성장JA |
| 166424 | 24 | `general-prog-in-progress-1` | Growth to Professional |
| 166425 | 25 | *(FE bridge 갭 — BE 신규)* | 최대 일정 수 |
| 166426 | 26 | *(FE bridge 갭)* | 교육형태 참여자 선택 |
| 166427 | 27 | *(FE bridge 갭)* | 사전교육 안내 불필요 |
| 166428 | 28 | `general-prog-scheduled-1` | HSBC · 학교신청만 |

상세 필드 레시피 → [`01-general-program-dummy-seed.md`](./01-general-program-dummy-seed.md)

### 2.2 1사1교 8 CASE

| BE ID | CASE | FE mock id | title (FE) |
|-------|------|------------|------------|
| 167001 | CS-01 | `economy-prog-001` | HSBC/HKU Business Case… |
| 167002 | CS-02 | `economy-prog-002` | UJAT 36기 (1사1교 시드명) |
| 167003 | CS-03 | `economy-prog-003` | EY Growth to Professional… |
| 167004 | CS-04 | `economy-prog-004` | 초등 경제교육 |
| 167005 | CS-05 | `economy-prog-005` | SAP 함께 성장하JA |
| 167006 | CS-06 | `economy-prog-006` | Global Career Discovery · **장거리 125.5km** |
| 167007 | CS-07 | `economy-prog-007` | 경제금융교육 전문강사단 |
| 167008 | CS-08 | `economy-prog-008` | 특별한 JOB담 |

레시피 → [`02-company-school-dummy-seed.md`](./02-company-school-dummy-seed.md)

### 2.3 UJAT 목록 5종 (FE mock)

| FE mock id | `ujatProgressStatus` | 라벨 |
|------------|----------------------|------|
| `ujat-progress-education-scheduled` | `EDUCATION_SCHEDULED` | 프로그램 진행 예정 |
| `ujat-progress-participant-recruiting` | `PARTICIPANT_RECRUITING` | 참여자 모집 중 |
| `ujat-progress-volunteer-recruiting` | `VOLUNTEER_RECRUITING` | 봉사자 모집 중 |
| `ujat-progress-education-in-progress` | `EDUCATION_IN_PROGRESS` | 프로그램 진행 중 |
| `ujat-progress-program-ended` | `PROGRAM_ENDED` | 프로그램 진행 완료 |

BE local demo의 `164021`/`164022` 메뉴 더미와 **별개**로, 위 5종을 맞추는 것을 권장.  
상세 → [`03-ujat-program-dummy-seed.md`](./03-ujat-program-dummy-seed.md)

### 2.4 교육받은 교사 8건

| FE mock id | 한 줄 |
|------------|------|
| `trained-teachers-prog-001` ~ `008` | 커리큘럼/일정 × 단일/복수 × 교육일지·IPS 상이 매트릭스 |

→ [`04-trained-teachers-dummy-seed.md`](./04-trained-teachers-dummy-seed.md)

### 2.5 Gemini

BE `165001`~`165005` 와 FE Gemini CASE 코드(`GVT-R-*`, `GPERF-*`) 매핑은 [`06-gemini-dummy-seed.md`](./06-gemini-dummy-seed.md) 참고.

### 2.6 메뉴 전용 · Rich demo (목록만 채워도 됨)

| BE ID | 용도 |
|-------|------|
| 164001–164042 | LNB 유형별 목록 비지 않게 |
| 162301 등 Rich | Happy path · 정산 연계 |
| 165300–165304 | **정산 메뉴** (프로그램 상세 범위 밖) |
| 163401–163408 | 후원 이력 |

---

## 3. FE mock 파일 위치 (참고 — BE는 zip 문서만으로 작업)

문서에 적힌 `apps/cms/src/data/mock/…` 경로는 CMS 저장소 안 SSOT 위치다.  
zip만 받은 BE는 **본 패키지 MD의 CASE 표·JSON**만 따르면 된다.

| 영역 | mock 파일명 |
|------|-------------|
| 일반 프로그램 | `general-programs.ts` |
| 1사1교 | `economy-programs.ts` |
| UJAT 목록 | `ujat-programs-list-mock.ts` |
| UJAT 기관신청 | `ujat-institution-application-mock.ts` |
| UJAT 봉사 | `ujat-volunteer-applicants-mock.ts` |
| UJAT 진행 | `ujat-education-progress-*-mock.ts` |
| TT | `trained-teachers-programs.ts` · `trained-teachers-institution-detail.ts` |
| 기관/강사 신청 | `applicant-institutions.ts` · `applicant-instructors.ts` |
| 개인신청 | `general-individual-applications-mock.ts` |
| 봉사신청 | `general-volunteer-applicants-mock.ts` |
| 진행 학교/강사/봉사/개인 | `participating-*.ts` |

---

## 4. 우선순위 요약

| 우선 | 내용 |
|------|------|
| **P0** | 일반 CASE-01~09 + 1사1교 CS-01~08 + UJAT 진행5종 + TT 001~008 + Gemini P0 featured |
| **P1** | 일반 LNB CASE-10~18 · 신청/진행 하위 행(05) · Gemini 기관/강사 신청 |
| **P2** | 캘린더 CASE-19~24 · bridge 25~28 · 볼륨·필터용 소량 |

**Last updated:** 2026-07-30
