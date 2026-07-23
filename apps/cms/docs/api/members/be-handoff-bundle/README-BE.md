# CMS 회원 관리 API — 백엔드 전달 패키지

JaKorea **CMS** (`회원 관리` LNB) 프론트 연동 기준으로 정리한 요청·계약 문서입니다.  
백엔드는 본 monorepo를 보지 않으므로, **이 폴더(또는 동일 내용 zip)** 만 전달하면 됩니다.

| 항목 | 값 |
|------|-----|
| **패키지 생성** | CMS FE — `pnpm --filter cms package:members-be-handoff` |
| **OpenAPI (FE 기준 snapshot)** | `--openapi` 옵션 시 `openapi/members.openapi.json` 포함 |
| **문의** | CMS FE (회원 목록·등록 모달·E2E) |

---

## 읽는 순서 (권장)

1. **`members-api-backend-handoff-2026-07-23.md`** — **필수** · P0~P2 · 체크리스트 · 등록·상세 **path 분리(B안)** · **마스킹 §M-P1-5** · `admin-accounts` 분리  
2. **`e2e-members-pre-register-handoff-2026-07-23.md`** — **권장 첨부** · M1/M2 · pre-register·kind 목록 증상  
3. **`members-api-integration-2026-07-23.md`** — (`--full` 시) FE가 호출하는 path·등록 필드 매핑  
4. **`members-api-backend-gaps-2026-07-23.md`** · **`members-api-detail-missing-endpoints-handoff-2026-06-26.md`** — (`--full` 시) 레거시 갭 참고 (2026-06 일부 outdated)

---

## 정책 요약 (2026-07-23)

- **관리자 신규 등록:** `POST /api/admin/admin-accounts` (`createAdmin`) — pre-register **아님**  
- **개인·학교·강사:** 단일 `POST /api/admin/users/pre-register`는 **임시** · canonical은 **역할별 등록 path + 상세 GET path/DTO** (handoff §M-P0-1)  
- 단일 pre-register에 **`role` 필드만 추가(A안)** 은 canonical **아님**
- **회원 정보 마스킹:** 회원명·성별 미마스킹 · 전화·이메일·자택 주소(블러)·계좌·학력 학교명·1365 ID — **handoff §M-P1-5** · 기관 주소는 마스킹 없음

---

## 문서 안의 FE 코드 경로

handoff §5 등 `apps/cms/src/...` 경로는 **CMS 저장소 내 구현 위치** 안내입니다.  
백엔드 작업에는 **§2 요청·§3 체크리스트·OpenAPI** 만 필요합니다.

---

## FE E2E 재현 (CMS 측)

```bash
pnpm --filter cms test:e2e:members
```

재현·traceId는 E2E pre-register 문서 참고. 백엔드 단독 검증은 OpenAPI·스테이징 API로 진행하면 됩니다.

**Last updated:** 2026-07-23
