# Code Complete — Practical Construction Rules

## Based on Steve McConnell's Code Complete

This is the construction manual. Not philosophy (that's `coding-guidelines.md`), not recovery protocol (that's `refactoring.md`). These are the practical rules for building code that doesn't suck.

## Naming

### General Rules
- **Names reveal intent.** `days_until_expiration` not `days_left` not `d`.
- **Use pronounceable names.** `calculate_total_price` not `calcTtlPrce`.
- **Use searchable names.** `MIN_RETRY_COUNT` is searchable; `1` is not.
- **Avoid disinformation.** Don't use `accountList` for a `set`. Don't use `handle` for anything that isn't a file handle.
- **Don't add redundant context.** `Customer customer` is redundant. `Customer customer_name` is redundant.
- **One word per concept.** Don't use `fetch`, `get`, `retrieve`, and `load` interchangeably — pick one and stick with it.

### Naming Conventions (Python)
```python
# Variables — lowercase with underscores
user_id = "abc123"
is_authenticated = True
max_retries = 3

# Constants — UPPER_SNAKE_CASE
MAX_CONNECTIONS = 100
DEFAULT_TIMEOUT = 30.0

# Functions — lowercase with underscores
def calculate_total_price():
    pass

# Classes — PascalCase
class UserRegistry:
    pass

# Modules — lowercase_with_underscores
from app.models.user import User

# Private members — single underscore
def _internal_helper():
    pass

# Magic numbers — named constants
MAX_RETRIES = 3
# not: for _ in range(3):
```

## Variable Declarations

- **Declare variables close to first use.** Don't declare `result` at the top of a 50-line function.
- **Initialize variables at declaration.** `count = 0` not `count` then `count = 0` ten lines later.
- **Use meaningful defaults.** `timeout: float = 30.0` not `timeout: float = 0` (which is ambiguous).
- **One variable per declaration.** `user_id, session_id, room_id = ...` — pick one per line for readability.

## Control Structures

### If/Else
- **Prefer guard clauses over nested ifs.**
```python
# Do this
if not user.is_authenticated:
    return unauthorized()
if not user.has_permission():
    return forbidden()
# happy path

# Not this
if user.is_authenticated:
    if user.has_permission():
        # happy path
    else:
        return forbidden()
else:
    return unauthorized()
```

- **Keep conditionals simple.** Extract complex conditions into named booleans.
```python
# Do this
is_expired = date < today - timedelta(days=30)
is_suspended = user.status == "suspended"
if is_expired and is_suspended:
    return deactivated()

# Not this
if date < today - timedelta(days=30) and user.status == "suspended":
    return deactivated()
```

### Loops
- **Prefer `for` over `while`.** `for item in items:` not `i = 0; while i < len(items):`
- **Prefer list comprehensions for simple transformations.**
```python
# Do this
active_users = [u for u in users if u.is_active]

# Not this
active_users = []
for u in users:
    if u.is_active:
        active_users.append(u)
```

- **Use `enumerate` for index access.** `for i, item in enumerate(items):` not manual counter.

### Match/Case (Python 3.10+)
- **Use match/case for type/structure dispatch.** It's cleaner than if/elif chains on type checks.
```python
match message_type:
    case "text":
        handle_text(message)
    case "image":
        handle_image(message)
    case _:
        log_unknown(message)
```

## Modularity

### Function Design
- **One function, one job.** If you can extract a meaningful sub-operation, extract it.
- **Functions should be one level of abstraction below their callers.**
- **Limit function depth.** Max ~20 lines per function. Max 2 levels of nesting.
- **Use keyword arguments for optional parameters.** `create_room(name, description, max_agents=10, rules=None)` not positional for everything.

### Module Design
- **Max ~200 lines per file.** If you exceed it, split.
- **One logical concept per module.** `user.py` has user models. `room.py` has room models. Not both.
- **Group imports in order:** stdlib → third-party → local. Blank line between groups.

## Error Handling

### Do This
```python
# Specific exceptions
try:
    result = await db.execute(query)
except asyncpg.UniqueViolationError:
    raise ConflictError("User already exists")
except asyncpg.PostgresError as e:
    logger.error(f"DB error: {e}")
    raise ServiceUnavailableError("Database error")

# Assertions for internal invariants
assert isinstance(data, dict), "data must be a dict"
assert "user" in data, "data must contain 'user'"
```

### Don't Do This
```python
# No bare excepts
try:
    result = await db.execute(query)
except Exception:  # NEVER
    pass

# No swallowed errors
try:
    result = await db.execute(query)
except Exception as e:
    print(e)  # NEVER — use logging
```

## Code Tuning

### Performance First, Readability Always
- **Optimize after measuring.** Don't guess. Profile.
- **Prefer readable code over clever code.** A simple loop beats a one-liner that no one understands.
- **Cache expensive operations.** `@lru_cache` for pure functions with repeated calls.
- **Batch DB queries.** Don't query the DB in a loop. Use `WHERE id IN (...)`.

### Memory
- **Use generators for large sequences.** `yield` not `return list_of_100k_items`.
- **Avoid circular references.** They prevent garbage collection.
- **Use `__slots__` for frequently instantiated classes.** If you're creating millions of objects.

## Design Techniques

### Top-Down Design
- **Start with the interface.** Define what the function/class does before implementing it.
- **Work from the top down.** Main flow → sub-functions → implementation details.
- **Design before coding.** Sketch the structure. Then implement.

### Structured Programming
- **No goto.** (We don't have goto in Python anyway, but the principle stands.)
- **Single entry, single exit.** One path in, one path out (or clear early returns).
- **Avoid global state.** Pass dependencies explicitly.

### Defensive Programming
- **Validate inputs at boundaries.** API layer, DB layer, service layer boundaries.
- **Fail fast.** Check preconditions before doing work.
- **Use type hints.** They're not just for mypy — they document intent.

## Documentation

### Code Comments
- **Explain why, not what.** The code says what it does. Comments explain why.
- **Bad:** `# Increment counter` (the code says that)
- **Good:** `# Timeout based on upstream API SLA — 30s max wait`

### Docstrings
- **Every function has a docstring.** Even short ones.
- **Use Google style or NumPy style.** Be consistent.
```python
async def create_user(name: str, email: str) -> User:
    """Create a new user.
    
    Args:
        name: Display name for the user.
        email: Email address (must be unique).
    
    Returns:
        The created User object.
    
    Raises:
        ConflictError: If email already exists.
    """
```

## Testing

### Test Structure
- **Given/When/Then naming.** `test_create_message_saves_to_db_and_returns_id`
- **Test behavior, not implementation.** Don't test that the function calls `db.insert()` — test that the message is saved.
- **Mock external dependencies.** DB, APIs, filesystem — mock them all.

### Test Coverage
- **Test service logic, not framework wiring.** FastAPI routes are thin — test the service layer.
- **Test edge cases.** Empty inputs, null values, boundary conditions.
- **Integration tests for DB interactions.** Use test database, not mocks.

## Practical Rules Summary

1. **Names matter.** Spend time on names. They're the most-used words in code.
2. **Keep it simple.** Complexity is the enemy.
3. **One thing per function.** If you can extract it, extract it.
4. **Fail fast.** Check preconditions early.
5. **Validate at boundaries.** API in, DB out, service in between.
6. **Test before refactor.** Green bar first, then change.
7. **Measure before optimize.** Don't guess performance problems.
8. **Document intent, not implementation.** Code says what it does. Comments explain why.
9. **Keep modules small.** Max ~200 lines. Max ~300 lines if you're feeling brave.
10. **Refactor continuously.** Don't let the debt accumulate.
