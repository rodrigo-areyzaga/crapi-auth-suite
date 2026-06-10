const ALICE_VEHICLE_UUID = 'e723d757-eaca-4830-b7a3-b1cc21a97fe2';
const BOB_VEHICLE_UUID = 'a07828f3-edcf-4535-a59e-6afda15e91ce';

describe('crAPI vehicle ownership boundary checks', () => {
  // Validates that Alice can access the vehicle list assigned to her authenticated account.
  it('Alice can retrieve her own vehicle list from GET /identity/api/v2/vehicle/vehicles', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        cy.request({
          method: 'GET',
          url: '/identity/api/v2/vehicle/vehicles',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an('array');
        });
      });
    });
  });

  // Validates that Bob can access the vehicle list assigned to his authenticated account.
  it('Bob can retrieve his own vehicle list from GET /identity/api/v2/vehicle/vehicles', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.bob.email, users.bob.password).then((token) => {
        cy.request({
          method: 'GET',
          url: '/identity/api/v2/vehicle/vehicles',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.be.an('array');
        });
      });
    });
  });

  // Validates that Alice can access the location for a vehicle she owns.
  it("Alice can retrieve her own vehicle location from GET /identity/api/v2/vehicle/{alice_uuid}/location", () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        cy.request({
          method: 'GET',
          url: `/identity/api/v2/vehicle/${ALICE_VEHICLE_UUID}/location`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });

  // Validates whether Bob is blocked from accessing Alice's vehicle location.
  // If the response is 200 and contains vehicle data, this is a confirmed BOLA/IDOR finding.
  // If the response is 403, the ownership boundary is enforced.
  it("Bob attempts to access Alice's vehicle location using Bob's token", () => {
    cy.fixture('users').then((users) => {
      cy.login(users.bob.email, users.bob.password).then((token) => {
        cy.request({
          method: 'GET',
          url: `/identity/api/v2/vehicle/${ALICE_VEHICLE_UUID}/location`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          cy.log(`crAPI returned status ${response.status} for Bob accessing Alice's vehicle location`);

          expect(response.status).to.be.oneOf([200, 403]);

          if (response.status === 200) {
            expect(response.body).to.exist;
            cy.log('Confirmed BOLA/IDOR finding: Bob can access Alice vehicle location data.');
          }

          if (response.status === 403) {
            cy.log('Ownership boundary enforced: Bob cannot access Alice vehicle location data.');
          }
        });
      });
    });
  });

  // Validates whether Alice is blocked from accessing Bob's vehicle location.
  // If the response is 200 and contains vehicle data, this is a confirmed BOLA/IDOR finding.
  // If the response is 403, the ownership boundary is enforced.
  it("Alice attempts to access Bob's vehicle location using Alice's token", () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        cy.request({
          method: 'GET',
          url: `/identity/api/v2/vehicle/${BOB_VEHICLE_UUID}/location`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          cy.log(`crAPI returned status ${response.status} for Alice accessing Bob's vehicle location`);

          expect(response.status).to.be.oneOf([200, 403]);

          if (response.status === 200) {
            expect(response.body).to.exist;
            cy.log('Confirmed BOLA/IDOR finding: Alice can access Bob vehicle location data.');
          }

          if (response.status === 403) {
            cy.log('Ownership boundary enforced: Alice cannot access Bob vehicle location data.');
          }
        });
      });
    });
  });

  // Validates that the vehicle list endpoint does not allow unauthenticated access.
  it('An unauthenticated request to GET /identity/api/v2/vehicle/vehicles returns a non-200 status', () => {
    cy.request({
      method: 'GET',
      url: '/identity/api/v2/vehicle/vehicles',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });
});