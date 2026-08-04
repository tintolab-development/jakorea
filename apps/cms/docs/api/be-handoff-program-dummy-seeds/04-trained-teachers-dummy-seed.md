# 04 — 교육받은 교사 프로그램 더미 시드 요청 (BE)

CMS `/programs/trained-teachers` **목록 · 상세(공통정보·기관신청·진행·교육일지)** 를 FE mock과 맞추려면 아래 8 CASE를 시드해 주세요.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-30 |
| **대상** | `programType=TRAINED_TEACHER` |
| **FE SSOT** | `trained-teachers-programs.ts` · `trained-teachers-institution-detail.ts` · `TRAINED_TEACHERS_COMMON_INFO_CASES` |
| **패키지** | [`00-fe-mock-id-map-and-rules.md`](./00-fe-mock-id-map-and-rules.md) |

**Remote 게이트**

```env
VITE_REAL_API_MODULES=...,programs,formsSurveys
VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true
```

> **없음:** 강사 신청 LNB · 봉사자 · 일반 students/attendance 탭.  
> **있음:** 기관 신청 · 참여 기관 · **교육일지** · performance-summary.

BE local demo `164041`/`164042` 및 교육일지 PDF 2건이 있으면 TT 시드와 연결.

---

## 0. 우선순위

```text
P0  TT-01 ~ TT-08     FE mock 001~008 1:1 (공통정보 매트릭스)
P1  TT-A-01 ~ A-03    기관 신청 대기/승인/반려 (TT-01 또는 TT-05에 스코프)
P1  TT-J-01 ~ J-02    교육일지 메타 + 파일(가능하면 PDF)
P2  TT-P-01           performance-summary 숫자 스트립
```

title 접두어: `[TT더미]`

---

## 1. P0 — 프로그램 8건 (FE id 유지 권장)

| CASE | FE `programId` | 구조 | 회차 | 핵심 플래그 (FE case) |
|------|----------------|------|------|----------------------|
| **TT-01** | `trained-teachers-prog-001` | curriculum | single | 교육연수 ON · 교육일지 ON · 기간선택 |
| **TT-02** | `trained-teachers-prog-002` | curriculum | multi | 과제 설정 · 교육일지 ON · 날짜지정 |
| **TT-03** | `trained-teachers-prog-003` | curriculum | single | IPS 차시별 상이 · **교육일지 OFF** |
| **TT-04** | `trained-teachers-prog-004` | curriculum | multi | 교육형태+IPS 회차별 상이 |
| **TT-05** | `trained-teachers-prog-005` | schedule | single | 진행그룹 A/B · 교육일지 ON · 날짜지정 |
| **TT-06** | `trained-teachers-prog-006` | schedule | multi | 행사일정별 진행+과제 (일정설정 섹션 비노출) |
| **TT-07** | `trained-teachers-prog-007` | schedule | single | 그룹 구분 없음 · 기간선택 |
| **TT-08** | `trained-teachers-prog-008` | schedule | multi | 교육형태·IPS 일정별 상이 · 교육연수 ON |

### FE mock title 목록

1. `2026년 신한은행 - JA Korea 청소년 경제금융교육프로그램`
2. `2026 SAP-함께 성장하니JA! 하계 고등학생 모집 안내`
3. `2026 JA Korea 초등 교사 경제교육 직무연수`
4. `2026 JA Korea 중등 교사 디지털 금융교육 연수`
5. `2026 JA Korea 교사 경제교육 심화 과정`
6. `2026 JA Korea 학교 금융교육 리더 교사 과정`
7. `2026 JA Korea 진로·경제교육 교사 워크숍`
8. `2026 JA Korea 교육받은 교사 프로그램 성과 공유회`

### 공통 KPI / 모집 (FE 스크린샷 기준)

```json
{
  "programType": "TRAINED_TEACHER",
  "educatedTeachers": 80,
  "kpi": {
    "finalParticipants": 30,
    "instructorCount": 0,
    "volunteerCount": 0,
    "finalSchools": 100,
    "finalClasses": 100
  },
  "participantRecruitment": {
    "announcementPublished": true,
    "preEducationNoticeRequired": true,
    "maxAssignableInstructors": 2,
    "maxClassCount": 4,
    "maxScheduleCount": 3,
    "maxSessionsPerDay": 8,
    "operationPeriodLabel": "2026. 04. 03(금) ~ 2026. 11. 20(금)",
    "recruitmentPeriodLabel": "2025. 12. 08(월) ~ 2026. 01. 16(금)",
    "finalAnnouncementLabel": "2026. 01. 26 (금) | 홈페이지 공지 및 담당교사 개별 안내",
    "contactOrganizationName": "JA Korea"
  }
}
```

상세 `generalCommonInfo` / `trained-teacher/detail` JSON은 FE `TRAINED_TEACHERS_COMMON_INFO_CASES` 의 001~008을 **그대로** 이식.  
커리큘럼 1·2차시 설명 문구도 FE와 동일:

- 1차시: 채용 공고 읽기, 이력서 작성하기…
- 2차시: 올바른 면접 태도… 면접 체험…

**검증 API**

- `GET/PATCH /api/admin/programs/{id}/trained-teacher/detail`
- 목록 `programType=TRAINED_TEACHER`

---

## 2. P1 — 기관 신청 · 교육일지

| CASE | 내용 | API |
|------|------|-----|
| TT-A-01 | 검토대기 1 | `…/trained-teacher/organization-applications` |
| TT-A-02 | 승인 1 → 진행 목록에 노출 | 공통 approve |
| TT-A-03 | 반려 1 | reject + 사유 |
| TT-J-01 | 교육일지 메타 1건 (제목·일자·업로더) | `…/education-journals` |
| TT-J-02 | 다운로드 가능한 파일 1건 (PDF 권장) | download / bulk-download |

승인 기관은 TT-01 또는 TT-05에 스코프.  
교육일지 ON인 TT-01/02/05/08에 journals 연결.

---

## 3. P2 — 실적 요약

| CASE | 내용 |
|------|------|
| TT-P-01 | `GET …/trained-teacher/performance-summary` 가 비어 있지 않게 숫자 채움 (학교/일지/참여자 등 FE strip과 유사) |

---

## 4. 검증 체크리스트

- [ ] TT-01~08 목록·상세 공통정보 분기(커리큘럼/일정·일지·IPS) 확인
- [ ] 기관 신청 3상태 + 승인 후 진행 탭
- [ ] 교육일지 list/download
- [ ] performance-summary strip
- [ ] 강사/봉사 LNB가 **없음**

**Last updated:** 2026-07-30
