# Coding Guidelines

## Clean Code — Robert C. Martin

### 1. Function Size — One Thing Per Function
Functions must do **one thing**. If you can extract a meaningful sub-operation, the function is too large.
- Max ~20 lines per function (excluding comments and docstrings).
- If a function has nested `if`/`for`/`with` blocks deeper than 2 levels, extract.
- Functions should be one level of abstraction below their callers.

### 2. Function Names — Say What They Do
Names must reveal intent. `d()` is unacceptable. `compute_similarity()` is acceptable.
- Use verbs: `create`, `fetch`, `validate`, `process`, `send`.
- Use nouns for classes: `AgentRegistry`, `MemoryService`.
- If you need a comment to explain what a function does, rename the function.

### 3. Arguments — Zero or One (Rarely Two)
More than two arguments signals the function is doing too much.
- Use keyword arguments for optional parameters.
- Use a config/dataclass for three or more arguments.
- Booleans as arguments are almost always wrong — extract a function.

### 4. Comments — Explain Why, Not What
Good code explains itself. Comments are for **why**, not **what**.
- Bad: `# Increment counter` (the code says that).
- Good: `# This timeout is based on the SLA from the upstream API team.`
- Never comment out dead code. Delete it (git remembers).
- TODOs must include the issue number or rationale.

### 5. Error Handling — Don't Swallow Exceptions
- No bare `except:`, no `except Exception: pass`.
- Catch specific exceptions. If you can't, log and re-raise or return a meaningful error.
- Use `logging` — never `print` in production code.
- Return `Result` types or raise domain exceptions for business logic failures.

### 6. DRY — Don't Repeat Yourself
- Extract repeated code into functions.
- Extract repeated configurations into constants or settings.
- If you copy-paste more than once, refactor.

### 7. SRP — One Module, One Reason to Change
- A module (file) should have a single responsibility.
- If a module changes for multiple reasons, split it.
- `app/main.py` should not mix HTTP routes, WebSocket handlers, and utility functions.

### 8. Globals — Avoid Module-Level State
- Module-level globals (`_pool`, `registry`, `engine`) are hard to test and hard to reason about.
- Use dependency injection: pass dependencies as constructor arguments.
- Singletons should be explicit, not accidental.

### 9. Abstraction — Keep It Consistent
- If you have a `create_room()` function, don't mix it with `room_context.append()` in the same flow.
- All functions at the same level of abstraction should be about the same thing.

### 10. Dead Code — Delete It
- Unused imports, unused parameters, commented-out blocks — remove them.
- Git is your backup. Don't preserve dead code "just in case."

### 11. Tests — Ship Code That Passes
Tests are a primary deliverable, not an afterthought. Every piece of functionality ships with its tests.
- New feature → add tests alongside the implementation, not after.
- Bug fix → add a regression test before or alongside the fix.
- Refactor → update existing tests; if no tests exist, add them.
- No test coverage is not "we'll come back to it." It means the feature isn't done.
- If a bug was found in production, the fix must include a test that would have caught it.

### 12. One Class Per File
One logical unit per file. A `describe` block (JS/TS) or a test class (Python) maps to exactly one file.
- JS/TS: one `describe("Xxx")` per `Xxx.test.ts` file.
- Python: one `class XxxTests` per `xxx_tests.py` file.
- If a concept has multiple distinct classes or behaviors, split across files — don't crowd one file.
- This makes navigation, git blame, and coverage reports predictable.

## SOLID Principles

### S — Single Responsibility Principle
Each class and function should have one reason to change.

### O — Open/Closed Principle
Open for extension, closed for modification. Use interfaces and composition.

### L — Liskov Substitution Principle
Subclasses must not break the contract of their parent.

### I — Interface Segregation Principle
Small, focused interfaces are better than fat ones.

### D — Dependency Inversion Principle
Depend on abstractions, not concretions. Use constructor injection.

## Additional Principles

### KISS — Keep It Simple
Prefer simple solutions. Complexity is the enemy.

### YAGNI — You Aren't Gonna Need It
Don't build for future requirements. Build for what you need now.

### Composition Over Inheritance
Prefer composing objects from smaller pieces over deep inheritance hierarchies.

## Refactoring

For the full refactoring protocol — when, how, and what to do when the codebase gets messy — see `docs/reference/refactoring.md`.

The coding guidelines define the daily standard. The refactoring protocol defines how to reach that standard when the code has degraded. Both are necessary. Neither is optional.

## Python-Specific Rules

### Type Hints
- Every function signature must have complete type hints.
- Every class attribute must have a type annotation.
- Use `typing.Sequence`, `typing.Mapping`, `typing.Optional` where appropriate.
- `mypy --strict` must pass.

### Pydantic v2
- Use Pydantic v2 models for all request/response schemas and data transfer.
- Use `pydantic-settings` for environment configuration.
- Never pass raw dicts into business logic — wrap them in models.
- Use `model_validate(entity)` with `model_config = {"from_attributes": True}` to convert SQLAlchemy entities to response models. No manual field mapping.
- Pydantic models handle coercion: `str(entity.uuid)` happens automatically via Pydantic's type adapter.

### Model Layer Architecture

The project uses a **four-layer** model separation. Each layer has a distinct responsibility:

```
API Request → Pydantic Schema (requests/) → Service Parameters (parameters/) → SQLAlchemy ORM (entity/) → DB
                                                                                         ↓
API Response ← Pydantic Schema (responses/) ← Response DTO ← SQLAlchemy ORM ← DB
```

| Layer | Directory | Purpose | Example | Rules |
|-------|-----------|---------|---------|-------|
| **Request Schema** | `models/requests/` | Validate/parse raw JSON from client | `AgentCreate` | Only input fields. No DB-owned fields (PK, timestamps). |
| **Service Parameters** | `models/parameters/` | Convert schema → ORM-insertable params | `AgentCreateParameters` | Strips DB-owned fields. Handles type conversions (e.g., `list[float]` → pgvector string). |
| **SQLAlchemy Entity** | `models/entity/` | Strictly-typed mapped class | `AgentEntity` | Pure data. No methods. `Mapped[T]` annotation *is* the column mapping. |
| **Response Schema** | `models/responses/` | Thin API contract shape | `AgentResponse` | Only fields the client needs. `model_config = {"from_attributes": True}` for entity conversion. |

**Strict separation rule:** `AgentCreate` ≠ `AgentCreateParameters` ≠ `AgentEntity` ≠ `AgentResponse`. Never mix layers.

The DTO layer lives in `server/app/models/` with 4 subdirectories:
- `requests/` — input validation (client → server). No PK, no timestamps.
- `parameters/` — schema → ORM params. Strips DB-owned fields.
- `entity/` — SQLAlchemy mapped classes. Pure data. No methods.
- `responses/` — output shape (server → client). Thin contract.

**Converting entity → response:** `ModelResponse.model_validate(entity)` with `model_config = {"from_attributes": True}`. Never manual field mapping.

**Creating an entity for a table without one:** Query `information_schema.columns` for the schema, create `app/models/entity/<table>_entity.py`, map with `Mapped[T]`, then use `model_validate()` in callers. Never use `dict[str, Any]` or any `Any`-based mapping as your data shape. The anti-pattern is not a specific function name — it's any `dict[str, Any]`, `dict[uuid, object]`, or `Mapping[str, Any]` that carries untyped data between layers. Use concrete Pydantic response models or `model_validate()` instead.

### SQLAlchemy Entity Rules

- One class per file, matching the filename (e.g., `agent_entity.py` → `AgentEntity`).
- Use SQLAlchemy 2.0 syntax: `Mapped[T] = mapped_column(...)`.
- `Mapped[T]` annotation tells SQLAlchemy the Python ↔ SQL type mapping.
- DB-generated fields have `server_default` (UUIDs via `gen_random_uuid()`, timestamps via `now()`).
- **Never set UUIDs or timestamps in Python.** Request schemas for CREATE must NOT include PK fields. Parameters must NOT include PK/timestamp fields.
- Keep entities as pure data — no `to_response()` methods, no business logic (SRP).
- JSONB columns: define a specific entity model for the JSONB content. It must match the JSONB structure.
  - `meta: Mapped[RoomMeta] = mapped_column(JSONB, name="metadata")`
  - Pydantic models are still the right choice for API boundary validation (request/response schemas).
- The `metadata` SQLAlchemy reserved attribute → use `meta` as the Python field name, `name="metadata"` for the column.

### Creating New Entities

**Never use `_row_to_dict()`. If a table exists without an entity, create one.** This is the primary reason `_row_to_dict()` appears — the agent saw raw SQL with no entity to validate against, so it invented a dict-based workaround.

**Steps:**

1. **Find the table schema.** Query `information_schema.columns` or `pg_attribute` to get column names, types, and nullability.
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'vector_operation_history'
   ORDER BY ordinal_position;
   ```
2. **Create the entity file** in `app/models/entity/` following the one-class-per-file naming convention.
3. **Map each column** with `Mapped[T]`. Use `JSONB` for JSONB columns — don't fall back to `dict[str, Any]`.
4. **Use `model_validate(entity)`** in the caller to convert the ORM object to a response shape. Never manual field extraction.

**Example — from raw SQL to entity + model_validate:**

```python
# BEFORE (anti-pattern — no entity, manual parsing):
row = await db.execute(text("SELECT created_at, operation_target FROM vector_operation_history"))
data = _row_to_dict(row)  # Loses all type info
timestamp = data["created_at"].isoformat()  # Runtime guesswork

# AFTER (entity + model_validate):
row = await db.scalar(
    select(VectorOperationHistoryEntity)
    .where(VectorOperationHistoryEntity.operation_type == "purge")
    .order_by(VectorOperationHistoryEntity.created_at.desc())
    .limit(1)
)
entry = PurgeHistoryEntry.model_validate(row.model_dump())  # Type-safe, explicit
```

### UUID / Timestamp Enforcement Rule

The database schema has `server_default` constraints on every PK and timestamp column:

| Column | DB Constraint |
|--------|---------------|
| `agent_id`, `room_id`, `message_id`, `memory_id`, `participant_id`, `user_id`, `api_key_id` | `gen_random_uuid()` |
| `created_date_utc`, `last_activity_date_utc`, `joined_date_utc`, `last_seen_date_utc`, `created_at`, `expires_at_utc` | `now()` |

**Rule:** NO service layer code should ever generate UUIDs or timestamps.

### ORM Query Patterns

**NEVER use `db.execute(text(...))` for simple CRUD.** Use ORM methods:

| Operation | Pattern |
|-----------|--------|
| Get by PK | `await db.get(Entity, id)` |
| Single result | `await db.scalars(select(Entity).where(...)).first()` |
| Multiple results | `await db.scalars(select(Entity).where(...)).all()` |
| Insert | `db.add(entity)` → `await db.commit()` → `await db.refresh(entity)` |
| Update | Modify entity attrs → `await db.commit()` |
| Delete | `await db.delete(entity)` → `await db.commit()` |
| Count | `await db.scalar(select(func.count()).where(...))` |

**Complex queries** (pgvector `<->`, FTS ranking, stored procedures) may use `text()` but map to DTOs via `Model.model_validate(row)` — never via `_row_to_dict()`.

### Model Anti-Patterns

| Anti-Pattern | Why It Breaks | Fix |
|-------------|---------------|-----|
| `dict[str, Any]`, `dict[uuid, object]`, or any `Any`-based mapping as data shape | Loses all type info (UUIDs, timestamps, ints become strings). No layer enforcement. Same problem as `_row_to_dict()`. | Use concrete Pydantic response models (`Model.model_validate(row)`) or `model_validate(entity)` for ORM objects |
| `_entity_to_dict(entity)` | Manual field-by-field mapping, duplicate logic | `ModelResponse.model_validate(entity)` |
| `text(...)` for simple CRUD | Unnecessary raw SQL when ORM handles it | `select(Entity).where(...)` |
| `from_row()` custom constructors | Redundant — `model_validate()` handles raw rows | Remove, use `model_validate()` directly |
| `type: ignore` / `noqa` | Masks real type errors, degrades DX | Fix the root cause |
| Setting UUIDs/timestamps in Python | Breaks `server_default` contract | Let the DB generate them |

### Response Model Rules

- POST endpoints return ID-only response (not the full object).
- PUT/PATCH endpoints return 204 No Content (no response body).
- GET endpoints return thin `*_response` models (only fields the client asked for).
- Never assume what the client wants — the response model mirrors the API contract, not the entity.
- Use `model_validate(entity).model_dump()` for entity → response conversion.
- Use `model_validate(data)` for dict → schema conversion (replaces manual `dict.get()` chains).

### Async
- All I/O must be async. Never block the event loop.
- Use `async with`, `async for`, `await` consistently.
- Wrap sync I/O in `run_in_executor` if unavoidable.

### Logging
- Use `logging.getLogger(__name__)` in every module.
- Use structured log format with timestamps, levels, and names.
- Never use `print()` in production code.

### File Organization
- Max ~200 lines per file. If you exceed it, split.
- Group imports: stdlib, third-party, local (in that order).
- One logical concept per module.
- **All imports must be at the top of the file.** Move imports from inside functions to the top. Lazy imports (PLC0415) are only justified when they affect startup time significantly (e.g., optional features). One-shot CLI scripts and test files should have all imports at the top. IDEs typically allow collapsing import blocks, so this has no practical readability cost.

### Constants
- Named constants for magic numbers and strings.
- Use `Final` from `typing` or `enum.Enum` for configuration values.
- Never hardcode URLs, ports, or model names — use settings.

### Testing
- Tests are a first-class deliverable. Feature code without tests is not done.
- Test service logic, not framework wiring.
- Mock external dependencies (DB, APIs).
- Bug fixes require regression tests — a test that would have caught the bug.
- Test names follow GivenWhenThen: `create_message_saves_to_db_and_returns_id`.

## Linting — Ruff

This project uses `ruff` with the following rules: E, F, I, N, W, UP, B, SIM, TID, C9, RUF, ANN, PT, S, PL, RET, TRY.

**See `docs/reference/python-lint-fixes.md` for all common ruff/mypy error fixes.** The coding guidelines define the daily standard. The lint fixes document provides concrete patterns for resolving specific error codes.

### Ruff Rules

This project uses the following ruff rules: E, F, I, N, W, UP, B, SIM, TID, C9, RUF, ANN, PT, S, PL, RET, TRY.
- **No new `noqa` comments.** If a rule is genuinely unfixable, explain why instead of suppressing it.
- **No re-adding rule ignores to `pyproject.toml`.** Zero suppression.
- **Test file per-file-ignores** are configured once in `pyproject.toml` for rules that are inherently inappropriate for tests: S101 (`assert` is the point of testing), PLR2004 (test assertions compare against magic numbers), B017 (assert with pytest.raises is the correct pattern), PT011 (pytest's own assert rewrite conflicts with ruff). These are defined once in config, not as scattered `noqa` comments.
- **Use Zed's built-in ruff diagnostics** (inline) to verify edits — use the `diagnostics` tool when you need a snapshot. Only run `ruff check` from the shell when explicitly asked.
- **TRY003 requires zero arguments.** The only reliable fix is `raise CustomException` with no message at all — not even a short string.
- **Prefer parameterized queries.** Never interpolate f-strings into SQL. Use `$1, $2` bound params for all values. Dynamic column names must come from a hardcoded whitelist — this is acceptable but ruff will flag S608. When that happens, the fix is to migrate to an ORM (not suppress the rule).
- **Replace `typing.Any` on connections with the real type.** asyncpg provides `asyncpg.Connection` and `asyncpg.Pool` — use them instead of `Any` (ANN401).
- **Move imports to top level.** Lazy imports inside functions (PLC0415) are only justified when they affect startup time significantly (e.g., optional features). One-shot CLI scripts do not benefit from lazy loading.
- **Remove unused variables.** Unused locals (F841) and unused unpacked variables (RUF059) should be removed or renamed to `_`.
- **Modernize redundant patterns.** Use bare `open(path)` instead of `open(path, "r")` (UP015), remove explicit `return None` at end of functions (RET501). `datetime.UTC` works fine in Python 3.12+ — use whichever is cleaner.
