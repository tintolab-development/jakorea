# Cursor prompt — 봉사자 자유 작성 4문항 마스킹 제거 (JABACK)

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 계약과 재현만** 사용하라.

이 문서는 프론트 레포 경로:

`apps/cms/docs/api/volunteer-application-essay-unmasked-backend-cursor-prompt-2026-10-07.md`

> **긴급도: 높음 (심사 불가).**
> 기획 결정: **봉사자 신청서 자유 작성 4문항은 마스킹 대상이 아니다.** 담당자는 서류 심사에서 본문 전체를 읽어야 한다.
> 지금은 4문항이 마스킹되어, 숫자가 섞인 답이 `****2312`처럼 보이고 심사 근거가 사라진다.
>
> 이 문서는 아래 두 문서의 **마스킹 항목만 대체**한다. 나머지 계약(필드명, 추출 규칙, null 규칙)은 그대로다.
> - `volunteer-application-list-essay-fields-backend-cursor-prompt-2026-10-07.md` §3 마스킹
> - `volunteer-application-general-projection-backend-cursor-prompt-2026-10-07.md` §2 마스킹

---

## 대상 필드

| 응답 | 필드 |
| --- | --- |
| `GET /api/admin/programs/{programId}/volunteer-applications` → `items[]` | `essayIntro`, `essayEducationExperience`, `essayNecessity`, `essayJaExperience` |
| `GET /api/admin/volunteer-applications/{id}` → `application.general` | 위 4개 |
| `POST /api/admin/volunteer-applications/{id}/privacy/unmask` → `application.general` | 위 4개 (이미 원문, 변경 없음) |

## 재현 (로컬, 2026-10-07)

- 프로그램 `186050`, 신청 `1691347`. 원문은 `12321312312312` 등 숫자 문자열이다.
- 목록 응답: `essayIntro: "****2312"`.
- CMS 「1차 서류 심사」 표와 상세 화면 모두 `****2312`로 보인다.

## 현재 마스킹 위치

- `VolunteerApplicationQueryService` 목록 매핑(약 257~260행): `PrivacyMaskingSupport.maskFreeText(rs.getString("essay_*"))`.
- `VolunteerApplicationAdminService.generalProjection`(약 476행): `freeText(essays.get(...), unmasked)` → 마스킹 상세에서 `maskFreeText`.

## 요구 사항

1. 위 두 곳에서 4문항은 **trim한 원문**을 그대로 내려라. `maskFreeText`를 적용하지 마라.
2. null 규칙은 그대로다: 없음·공백·`notApplicable: true` → `null`.
3. 같은 응답의 다른 필드 마스킹은 바꾸지 마라: `memberName`, `contact`, `email`, `profile.*`, 1365 ID, `applicationRouteOther` 등.
4. 4문항 열람은 기존처럼 감사 로그 대상이 아니다. 목록·상세 조회 로그 정책을 바꾸지 마라.
5. Swagger: 4개 필드 `@Schema` 설명의 "마스킹" 문구를 "원문(마스킹하지 않음)"으로 고쳐라.
6. 테스트 기대값을 원문으로 바꿔라. 이메일·전화번호·8자리 이상 숫자가 들어 있는 본문도 원문 그대로 오는지 확인하는 케이스를 하나 추가하라.

### UJAT 봉사자 (같은 4문항)

- `application.ujat.essayIntro` 등 UJAT 상세의 4문항도 같은 문항이다. **같은 정책(원문)을 적용하라.**
- 단, UJAT 쪽 변경은 별도 커밋으로 분리하고 완료 보고에 따로 적어라. 프론트 확인 결과에 따라 되돌릴 수 있어야 한다.

## 완료 조건

- `GET /api/admin/programs/186050/volunteer-applications` → 1691347 행 `essayIntro = "12321312312312"`.
- `GET /api/admin/volunteer-applications/1691347` → `application.general.essayIntro = "12321312312312"`.
- 연락처·이메일·성명은 여전히 마스킹.

## 프론트 상태 (참고, 백엔드 작업 아님)

- CMS는 목록 `essay*`와 상세 `application.general.essay*`를 받은 그대로 표시한다. 백엔드 반영만으로 화면이 바뀐다. 프론트 추가 작업은 없다.
