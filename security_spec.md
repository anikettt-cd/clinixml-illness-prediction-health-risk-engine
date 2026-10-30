# Security Specification & Threat Model

## Application: Symptoms Based Disease Detection System

### Phase 0: Data Invariants
1. **Ownership & Tenant Invariant**: Every document (`users/{userId}`, `users/{userId}/patients/{patientId}`, `users/{userId}/records/{recordId}`) is strictly confined to the owning authenticated user. No user can read, list, create, update, or delete another user's patient profiles, check-in history, or user profile.
2. **Identity Integrity**: `userId` field inside child documents must strictly equal `request.auth.uid`.
3. **Immutability of Core Identifiers**: `id`, `userId`, and `createdAt` cannot be modified during updates.
4. **Valid Document IDs**: All document IDs must adhere to `^[a-zA-Z0-9_\-]+$` and be <= 128 characters.
5. **PII and Sensitive Health Data Isolation**: All patient health metrics and reported symptoms are isolated inside the user's private namespace (`/users/{userId}/...`). Blanket reads are forbidden.
6. **Data Boundaries**: String sizes, numeric ranges (e.g. weight, height, age > 0), and array lengths are strictly guarded against wallet-draining injections.

---

### The Dirty Dozen Payloads (Designed to Fail with PERMISSION_DENIED)

1. **Unauthenticated Read**: Attempting to read `/users/user123` with `request.auth == null`.
2. **Cross-Tenant Patient Read**: Authenticated user `user_attacker` querying `/users/user_victim/patients/pat_1`.
3. **Cross-Tenant Patient List**: Authenticated user `user_attacker` listing `/users/user_victim/patients`.
4. **Identity Spoofing on Patient Creation**: User `user1` attempting to create `/users/user1/patients/pat_1` with payload `{ userId: 'user2', name: 'John' }`.
5. **Path / ID Hijack**: User `user1` attempting to write to `/users/user2/patients/pat_1` even with valid payload.
6. **Shadow Field Injection on Patient Update**: User `user1` updating patient with injected field `{ role: 'admin', isVerified: true }`.
7. **Negative or Absurd Value Injection**: User `user1` submitting patient with `{ weightKg: -50, heightCm: 9999 }`.
8. **Record Identity Tampering**: User `user1` attempting to update `record.userId` or `record.patientId` to target another user.
9. **Unbounded Payload / Denial of Wallet Attack**: Submitting reportedSymptoms array with 500 oversized malicious items.
10. **Malicious Document ID**: Attempting to create document with path ID containing path traversal characters like `../../admin`.
11. **Immutability Breach**: Attempting to modify `createdAt` timestamp on an existing patient record.
12. **Blanket Query Scrape**: Attempting a collectionGroup query across all users' records without a userId filter.
