# DevPort Agent Instructions

## Project

DevPort is a developer platform for managing, documenting,
synchronizing, and exposing information about software projects.

## Source of Truth

Product requirements:
@docs/product/functional-requirements.md

Product overview:
@docs/product/product-overview.md

Business rules:
@docs/product/business-rules.md

System architecture:
@docs/architecture/system-architecture.md

## Before Implementing

Before implementing a non-trivial feature:

1. Understand the relevant product requirements.
2. Inspect the existing implementation.
3. Check the system architecture.
4. Identify affected modules.
5. Explain the implementation plan.
6. Implement only after the requirements are understood.

## Product Integrity

- Do not invent undocumented product behavior.
- Do not remove existing functionality without explicit instruction.
- Do not change business rules without explicit approval.
- If requirements conflict, stop and ask for clarification.

## Engineering

- Follow the project's established architecture.
- Prefer existing abstractions over creating duplicates.
- Do not introduce dependencies without justification.
- Keep modules cohesive.
- Validate changes with appropriate tests.

## Documentation

When a feature changes product behavior, update the
relevant documentation.