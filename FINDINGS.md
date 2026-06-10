# Findings

## FINDING-01: BOLA/IDOR — Vehicle Location Endpoint Exposes Cross-User Data

**Severity:** HIGH
**Spec:** `idor-vehicles.cy.js` — tests 4 and 5
**Endpoint:** `GET /identity/api/v2/vehicle/{uuid}/location`
**Classification:** OWASP A01 — Broken Access Control (BOLA/IDOR)

### Description

The vehicle location endpoint does not enforce ownership boundaries. An authenticated user can supply another user's vehicle UUID and receive a 200 response containing the vehicle owner's name, email address, and GPS coordinates.

### Reproduction

Authenticate as Bob. Request Alice's vehicle location using Alice's vehicle UUID with Bob's token:

```http
GET /identity/api/v2/vehicle/e723d757-eaca-4830-b7a3-b1cc21a97fe2/location
Authorization: Bearer <bob_token>
```

### Observed Response

```json
{
  "carId": "e723d757-eaca-4830-b7a3-b1cc21a97fe2",
  "vehicleLocation": {
    "id": 4,
    "latitude": "38.206348",
    "longitude": "-84.270172"
  },
  "fullName": "Alice",
  "email": "alice@crapi.local"
}
```

### Expected Behavior

The endpoint should return 403 Forbidden when the requesting user does not own the vehicle identified by the UUID.

### Impact

Any authenticated user can enumerate vehicle UUIDs and retrieve the real-time GPS location, full name, and email of any other user. This constitutes a complete ownership boundary failure on a user-identifying resource.

---

## FINDING-02: Information Disclosure — Community Posts Expose Author Email and Vehicle ID

**Severity:** MEDIUM
**Spec:** `community-disclosure.cy.js` — test 4
**Endpoint:** `GET /community/api/v2/community/posts/recent`
**Classification:** OWASP A01 — Broken Access Control (Excessive Data Exposure)

### Description

The recent posts endpoint returns `author.email` and `author.vehicleid` for every post in the response, including posts authored by other users. Any authenticated user receives personally identifying information and vehicle identifiers belonging to users they have no relationship with.

### Reproduction

Authenticate as Bob. Request recent posts:

```http
GET /community/api/v2/community/posts/recent
Authorization: Bearer <bob_token>
```

### Observed Response

Each post object in the `posts` array contains:

```json
"author": {
  "email": "alice@crapi.local",
  "vehicleid": "e723d757-eaca-4830-b7a3-b1cc21a97fe2"
}
```

### Expected Behavior

Author identity fields beyond a display name or anonymized identifier should not be included in community feed responses visible to other users.

### Impact

Any authenticated user can harvest email addresses and vehicle UUIDs for all users who have posted to the community feed. Combined with FINDING-01, the vehicle UUID can be used to retrieve GPS location, full name, and email via the vehicle location endpoint.
