# JA Korea Project Context

Cursor / agents: **Notion MCP로 전체 워크스페이스를 검색하지 말 것.**  
필요 시 아래 URL·ID로 `notion-fetch` / `notion-query-database-view` 만 호출한다.

## Notion

| 역할 | 제목 | URL | ID |
|---|---|---|---|
| Project page | 🌐 JA코리아 | https://app.notion.com/p/tintolab/JA-2a3f3e2a77d0803fa1daff2aada4b499 | `2a3f3e2a-77d0-803f-a1da-ff2aada4b499` |
| CMS specs (entry) | 1️⃣ CMS 어드민 기능정의서 | https://app.notion.com/p/tintolab/CMS-33af3e2a77d080748112df7c8b1adfe0 | `33af3e2a-77d0-8074-8112-df7c8b1adfe0` |

## Notion databases (under JA코리아)

| Name | Database URL | Data source ID |
|---|---|---|
| R&R | https://app.notion.com/p/2a3f3e2a77d08154bb79f9327b9f9a5b | `collection://2a3f3e2a-77d0-8187-962f-000b90be2687` |
| 회의록 | https://app.notion.com/p/2a3f3e2a77d0815886ccecde2b5c6c1a | `collection://2a3f3e2a-77d0-81a0-bbca-000bddcf563b` |
| 메모 | https://app.notion.com/p/2aaf3e2a77d080e1a38fe12ac7f09019 | `collection://2aaf3e2a-77d0-817a-b635-000b4a7f50d2` |
| 자료 | https://app.notion.com/p/2a3f3e2a77d08153a5eecec4bfb1f016 | `collection://2a3f3e2a-77d0-818c-adae-000b02be8065` |
| 프로젝트 일정 | https://app.notion.com/p/2a3f3e2a77d081be88b7ca4e193f474b | `collection://2a3f3e2a-77d0-8114-8b16-000baac96ae2` |
| 고객사 공유용 회의록 아카이브 | https://app.notion.com/p/390f3e2a77d0805e8cfad48024815e38 | `collection://364f3e2a-77d0-8310-86f9-87e101d50064` |
| CMS 어드민 기능정의서 (DB) | https://app.notion.com/p/33af3e2a77d08150a11af3311f10c641 | `collection://33af3e2a-77d0-8153-a119-000b7b801259` |

### Scope hints

- **CMS** 기능·화면·스펙 → CMS entry page / CMS DB만 사용.  
  상세 규칙: `apps/cms/.cursor/rules/process/notion-mcp-cms.mdc`
- **프로젝트 일정·회의·자료·R&R** → 해당 DB만 사용.
- 유저가 다른 Notion URL을 준 경우에만 그 URL을 직접 fetch.

## Workflow

1. Read the related Notion specification (by mapped URL/ID above).
2. Inspect the current implementation.
3. Compare planning and code.
4. Produce a change plan.
5. Implement only after scope confirmation.
6. Run validation and tests.
7. Report unresolved differences.

## Status policy

- Notion planning status and actual code implementation must be verified separately.
- Development complete does not mean QA complete.
- QA complete does not mean deployed.

## Notion write policy

- Read-only by default.
- Do not create/update/delete Notion pages, properties, statuses, or comments without explicit user approval.
