---
priority: high
always_include: false
category: process
---

# Sponsor deletion policy

- **Cannot delete** a sponsor that still sponsors **at least one in-progress program**.
- If the user clicks delete while any program is in progress, show an **ineligibility** dialog first (not the destructive confirm flow).  
  Copy intent: there are active programs; remove the sponsor from those programs or end/delete the programs first.
- Only when **no** in-progress programs remain, proceed to delete confirmation (including typed confirmation if required).
- On delete, remove sponsor profile, contacts, and mappings. **Retain** settlement, statistics, and performance aggregates (hard vs soft delete does not change this guarantee).
- Apply the same rules in API contracts.

**Last updated:** 2026-04-21
