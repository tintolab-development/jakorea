# 일반 프로그램 — 학교·기관 신청 폼 ↔ 모집 설정 연동

**Code:** `institution-application-program-bridge.ts`, 모집 `applicant-recruit-participant-info-paragraph.tsx`, 신청 `institution-*-paragraph.tsx`, 등록 `education-schedule-settings-paragraph.tsx`

## 브리지 스토어

등록 마법사·모집 양식 편집·상세 모집 정보 수정이 `patchInstitutionApplicationProgramBridge`로 동일 상태를 갱신한다. 참여자 신청(학교·기관) 템플릿은 `useInstitutionApplicationProgramBridge`로 구독한다.

| 필드 | 출처 | 신청 폼 영향 |
|------|------|----------------|
| `preEducationNoticeRequired` | 모집 「사전 안내 사항 작성」 | `false` → **안내 사항** 단락 숨김 |
| `maxClassCount` | 모집 「신청 가능 최대 학급 수」 | 학급 수 선택 상한 |
| `maxScheduleCount` | 모집 「신청 가능 최대 일정 수」 | 희망 일정(지망) 블록 최대 개수 |
| `maxSessionsPerDay` | 모집 「1일 최대 차시 수」 | **일정 1개당** 차시 선택 상한 |
| `educationStructure` / `sessionRound` | 등록 유형 설정 | 일정 UI 노출 조건 |
| `educationScheduleMode` | 등록 「교육 진행 일정」 `date`·`period` | `period` = 기획 「날짜 선택(기간)」 |

## 희망 일정 UI 노출

`educationScheduleMode === 'period'` 일 때만 아래 조합에서 **희망 일정** 본문(지망 블록) 표시. 그 외는 기존 안내 힌트 단락.

**최대 일정 수 적용 유형**

- 커리큘럼형 + 단일 회차 + 기간 지정
- 커리큘럼형 + 복수 회차 + 기간 지정
- 일정형 + 단일 회차 + 기간 지정

**1일 최대 차시(일정당) 적용 유형**

- 커리큘럼형 + 복수 회차 + 기간 지정

**진행 희망 교육 일정 단락 숨김**

- 일정형 + 복수 회차 → 단락 카드·본문·안내 힌트 모두 미노출

## 검증 체크리스트

- [ ] 사전 안내 「불필요」 → 신청 폼 좌측·본문에서 안내 사항 단락 없음
- [ ] 최대 학급 N → 학급 드롭다운 1~N
- [ ] 기간 지정 + 해당 유형 → 지망 추가 최대 일정 수
- [ ] 커리큘럼 복수 + 기간 지정 → 차시 2 선택 시 2차시 시간 행
- [ ] 등록 유형·일정 모드 변경 시 신청 폼 미리보기 즉시 반영
- [ ] 일정형 + 복수 회차 → 진행 희망 교육 일정 단락 없음
