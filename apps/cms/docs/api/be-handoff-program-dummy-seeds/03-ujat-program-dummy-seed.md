# 03 — UJAT 프로그램 더미 시드 요청 (BE)

CMS `/programs/ujat` **목록 · 등록 · 상세 LNB** 를 FE mock과 동일하게 검증하려면 아래 케이스로 시드해 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | UJAT만 (`programType=UJAT`) |
| **FE SSOT** | `ujat-programs-list-mock.ts` · `ujat-institution-application-mock.ts` · `ujat-volunteer-applicants-mock.ts` · `ujat-education-progress-*-mock.ts` |
| **패키지** | [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) |

> **도메인**
>
> - UJAT에서 **봉사자 = 강사**(교육을 진행). 일반 「강사」 리소스를 복제하지 마세요.
> - 학교 모집 **연 1회**, 봉사단 **상반기·하반기 2회**.
> - 교육 요일: **금요일 1~4교시**만.
> - 교육 지역 8곳(마스터): 서울, 경기(남부), 인천, 대전, 대구, 부산, 광주, 전북(전주) — [`ujatEducationRegions`](./programs-api-backend-gaps-consolidated.md) API와 맞춤.

**Remote 게이트 (FE 검증)**

```env
VITE_REAL_API_MODULES=...,programs,ujatPrograms,ujatEducationRegions,formsSurveys
```

> **주의:** 현재 FE는 UJAT **목록/CRUD만** remote. 상세 신청·선발·진행은 **mock**.  
> 시드를 넣어도 상세 LNB는 API가 붙기 전까지 FE mock UI로 보일 수 있음.  
> 그래도 **BE 시드 + 향후 API** 를 위해 mock과 동일한 형상 데이터를 미리 준비해 주세요.  
> API 갭: [`programs-seed-case-api-coverage-backend-handoff-2026-07-30.md`](./programs-seed-case-api-coverage-backend-handoff-2026-07-30.md) §2.3·§3.

---

## 0. 우선순위

```text
P0  UJAT-L-01 ~ L-05     목록 진행현황 5종 (FE mock 1:1)
P0  UJAT-R-01 ~ R-08     교육 지역 마스터 8건
P1  UJAT-I-01 ~ I-06     기관 신청 (대기/승인/반려 × 반기 배정)
P1  UJAT-V-01 ~ V-12     상·하반기 봉사 서류/면접/최종 샘플
P2  UJAT-E-01 ~ E-04     교육 진행(지역·기관·봉사·출석) 요약 행
```

title 접두어: `[UJAT더미]`

---

## 1. P0 — 목록 프로그램 5건 (FE mock 대응)

FE id 패턴: `ujat-progress-{status-kebab}`

| CASE | FE mock id | `ujatProgressStatus` | lifecycle (모집 연동용) | 비고 |
|------|------------|----------------------|-------------------------|------|
| **UJAT-L-01** | `ujat-progress-education-scheduled` | `EDUCATION_SCHEDULED` | `planned` | 진행 예정 |
| **UJAT-L-02** | `ujat-progress-participant-recruiting` | `PARTICIPANT_RECRUITING` | `recruiting_students` | 학교 모집 UI·가이드 문구 채움 |
| **UJAT-L-03** | `ujat-progress-volunteer-recruiting` | `VOLUNTEER_RECRUITING` | `recruiting_instructors` | 봉사 모집 |
| **UJAT-L-04** | `ujat-progress-education-in-progress` | `EDUCATION_IN_PROGRESS` | `education_in_progress` | 진행 중 |
| **UJAT-L-05** | `ujat-progress-program-ended` | `PROGRAM_ENDED` | `document_processing_completed` | 완료 |

### 공통 필드 (FE mock 기준)

```json
{
  "programType": "UJAT",
  "title": "[UJAT더미] {year}년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집",
  "sponsorNameHint": "JA Korea",
  "listCaps": {
    "schools": "≤30",
    "firstHalfVolunteers": "≤30",
    "secondHalfVolunteers": "≤30"
  }
}
```

| 필드 | L-02 / L-03 (모집 데모) | 그 외 |
|------|-------------------------|------|
| `mainTitle` | `{year}년 JA Korea 초등 경제교육 대상 학교` | 생략 가능 |
| `description` / `recruitmentGuide` / `district` / contact | FE mock 문구와 동일하게 채움 | 비워도 됨 |
| `applicationStartDate` ~ `resultAnnouncementDate` | year 기준 기간 | — |

**검증:** `GET /api/admin/programs?programType=UJAT&size=500` → 5건 · 진행 현황 컬럼 5종.

BE local demo `164021`(모집중) / `164022`(진행중) 이 있으면 L-02·L-04에 매핑해도 됨.

---

## 2. P0 — 교육 지역 마스터 8건

| CASE | 지역 라벨 (기본) | 비고 |
|------|------------------|------|
| UJAT-R-01 | 서울 | |
| UJAT-R-02 | 경기(남부) | |
| UJAT-R-03 | 인천 | |
| UJAT-R-04 | 대전 | |
| UJAT-R-05 | 대구 | |
| UJAT-R-06 | 부산 | |
| UJAT-R-07 | 광주 | |
| UJAT-R-08 | 전북(전주) | |

정렬·사용중 삭제 409 정책은 gaps consolidated Cat3 참고.

---

## 3. P1 — 기관 신청 (L-02 또는 L-04에 스코프)

FE: `ujat-institution-application-mock.ts`

| CASE | 상태 | 건수(프로그램당) | 목적 |
|------|------|------------------|------|
| UJAT-I-01 | 검토대기 | ≥1 | 목록·승인 UX |
| UJAT-I-02 | 승인 | ≥1 | 일정 임시배정·확정 진입 |
| UJAT-I-03 | 반려 | ≥1 | 반려 사유 |
| UJAT-I-04 | 승인 + 상반기 배정 | ≥1 | partner-assignment |
| UJAT-I-05 | 승인 + 하반기 배정 | ≥1 | |
| UJAT-I-06 | 금요일 1~4교시 위반 후보 | 1 | 검증(거절)용 — 서버 validation |

각 행: 학교명 · 교육지역 · 학년 · 희망 금요일 교시 · 담당교사 연락처.

---

## 4. P1 — 봉사자 신청 (상·하반기)

FE: `ujat-volunteer-applicants-mock.ts` · `ujat-volunteer-interview-schedule*.ts`

| CASE | 반기 | 단계 | 상태 샘플 |
|------|------|------|-----------|
| UJAT-V-01~03 | H1 | 서류 | 대기 / 합격 / 불합격 |
| UJAT-V-04~06 | H1 | 면접·최종 | 면접대기 / 최종합격 / 포기 |
| UJAT-V-07~09 | H2 | 서류 | 동일 3종 |
| UJAT-V-10~12 | H2 | 면접·최종 | 동일 3종 |

면접 슬롯: 공휴일 제외 · 프로그램 가능일 — FE는 mock 공휴일(`2026` keys). BE는 공휴일 API 또는 정적 테이블.

---

## 5. P2 — 교육 진행 하위

FE: `ujat-education-progress-summary-mock.ts` · `…-institutions-mock` · `…-volunteers-mock` · `…-attendance-mock` · `…-assignments-mock`

| CASE | 내용 |
|------|------|
| UJAT-E-01 | 지역별 요약 (학교 수 · 봉사 수) |
| UJAT-E-02 | 기관 진행 상세 1건 (application · assignment · posts) |
| UJAT-E-03 | 봉사 진행 상세 1건 (출석 · 1365 시간) |
| UJAT-E-04 | 과제/출석 샘플 행 |

L-04(`EDUCATION_IN_PROGRESS`)에 스코프.

---

## 6. 검증 체크리스트

- [ ] UJAT 목록에 진행현황 5종 각 ≥1
- [ ] 교육 지역 8 · reorder 가능
- [ ] L-02에 기관 신청 대기/승인/반려
- [ ] H1/H2 봉사 서류·면접 샘플
- [ ] L-04에 진행 요약 데이터
- [ ] `UJAT` vs `UJAT_DGBONG` 필터 정책 문서화

**Last updated:** 2026-07-30
