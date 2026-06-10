# crapi-auth-suite

Authorization-boundary test suite for [crAPI](https://github.com/OWASP/crAPI) (Completely Ridiculous API), built with Cypress.

The focus is not whether the UI appears to work — it's whether the application enforces **who can see whose data**. Every test in this suite is designed to answer one question: does this protected resource respect ownership boundaries, or does it return data it shouldn't?

Cypress is used here as the executable test harness: to manage authenticated user contexts, drive browser/API interactions, assert expected authorization behavior, and document reproducible failures.

---

## What this tests

crAPI is an intentionally vulnerable application maintained by OWASP. It ships with known authorization flaws — specifically BOLA/IDOR patterns under [OWASP A01: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/).

This suite validates those boundaries systematically across three areas:

| Spec file | What it covers |
|---|---|
| `auth.cy.js` | Login, logout, and unauthenticated access attempts — baseline session enforcement |
| `idor-vehicles.cy.js` | Can user A access user B's vehicle data? Ownership-boundary tests across vehicle endpoints |
| `idor-community.cy.js` | Ownership-boundary tests for community posts and related endpoints |

Initial planned scope: ~15–20 tests across 3 spec files.

---

## Why this framing matters

Many Cypress suites focus on whether user flows work. This suite focuses on whether access-control expectations hold.

That distinction matters in security-adjacent QA: a feature can pass functional testing and still expose data it should not return. These tests are written to surface that class of failure specifically.

Findings are documented with the protected resource tested, the user context used, the expected behavior, and the actual response — the same reproduction standard applied in professional defect reporting.

---

## Test model

The tests use at least two authenticated user contexts:

- **User A** owns or can legitimately access a resource.
- **User B** should not be able to access that same resource unless crAPI explicitly allows it.

Each ownership-boundary test follows the same pattern:

1. Authenticate as User A and identify a user-owned resource.
2. Attempt to access that resource from User B's context.
3. Assert the expected authorization behavior.
4. Document any mismatch between expected and actual behavior as a finding.

A passing test means the tested boundary behaved as expected. A failed test means the response did not match the authorization expectation for that scenario.

Because crAPI is intentionally vulnerable, some tests are expected to expose broken authorization behavior. In this suite, a failed assertion is treated as evidence of a documented finding, not merely a broken test.

---

## Scope boundaries

This suite is intentionally narrow. It does not attempt to scan crAPI for every vulnerability class. It focuses on authorization-boundary behavior across known user-owned resources.

Out of scope:

- SQL injection, XSS, SSRF, command injection, and other non-authorization vulnerability classes
- Performance, load, and availability testing
- Full UI regression coverage
- Proving exploitability beyond the specific request/response behavior under test

The goal is repeatable authorization validation, not broad vulnerability scanning.

---

## Target application

**crAPI** running locally via Docker.

Setup: follow the [official crAPI Docker instructions](https://github.com/OWASP/crAPI#running-locally-with-docker-compose). Default base URL assumed: `http://localhost:8888`.

---

## Running the tests

```bash
# Install dependencies
npm install

# Run all specs headlessly
npx cypress run

# Open Cypress Test Runner interactively
npx cypress open
```

---

## Test structure

```
cypress/
  e2e/
    auth.cy.js
    idor-vehicles.cy.js
    idor-community.cy.js
  fixtures/
    users.example.json  # committed template for Alice/Bob credentials
    users.json          # local credentials, gitignored
  support/
    commands.js         # custom login command, token helpers
    e2e.js
cypress.config.js
package.json
```

---

## Role & methodology

I designed and directed the development of this suite: defining the authorization boundaries to test, scoping the user-to-user access scenarios, writing the test descriptions and acceptance criteria, and reviewing generated implementation for correctness and intent alignment.

Implementation was AI-assisted using Claude and ChatGPT. My role was to define the security testing model, validate the generated code against that model, and keep the suite scoped around repeatable authorization-boundary checks.

---

## Related work

**[accguard](https://github.com/rodrigo-areyzaga/accguard)** — a companion authorization regression testing tool that detects BOLA/IDOR failures at the API layer using a session-aware HTTP proxy and SHA-256 comparison of normalized authenticated responses.

Where accguard detects confirmed unauthorized data replay by observing real authenticated HTTP traffic at the proxy layer, crapi-auth-suite defines explicit authorization expectations as Cypress test cases.

The two projects are complementary: accguard is detection-oriented, crapi-auth-suite is expectation-oriented.

Together, both projects target OWASP A01 Broken Access Control from complementary testing vantage points: proxy-based replay detection and test-suite-driven authorization validation.

---

## Status

> Work in progress. Tests are being added incrementally. Each spec file will include a findings section once validation against crAPI is complete.
