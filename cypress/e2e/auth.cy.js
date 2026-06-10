describe('crAPI authorization boundary checks', () => {
  // Validates that Alice can cross the authentication boundary with valid credentials.
  it('Alice can log in successfully and receives a token', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        expect(token).to.be.a('string');
        expect(token.length).to.be.greaterThan(0);
        expect(Cypress.env('token')).to.eq(token);
      });
    });
  });

  // Validates that Bob can cross the authentication boundary with valid credentials.
  it('Bob can log in successfully and receives a token', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.bob.email, users.bob.password).then((token) => {
        expect(token).to.be.a('string');
        expect(token.length).to.be.greaterThan(0);
        expect(Cypress.env('token')).to.eq(token);
      });
    });
  });

  // Validates that unauthenticated requests are rejected with a non-200 status.
  // Observed behavior: crAPI returns 404 instead of 401 for this endpoint without a valid token.
  // This test documents non-200 rejection, not ideal API semantics.
  it('An unauthenticated request to GET /identity/api/v2/user/dashboard returns 404', () => {
    cy.request({
      method: 'GET',
      url: '/identity/api/v2/user/dashboard',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404);
    });
  });

  // Validates that Alice's authenticated token is sufficient to access her dashboard.
  it("Alice's token grants access to GET /identity/api/v2/user/dashboard", () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        cy.request({
          method: 'GET',
          url: '/identity/api/v2/user/dashboard',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });

  // Validates that malformed tokens are rejected with a non-200 status.
  // Observed behavior: crAPI may return 404 rather than 401/403 for malformed tokens on this endpoint.
  // Acceptable values documented as 401, 403, or 404 based on observed crAPI behavior.
  it('A request to GET /identity/api/v2/user/dashboard with a malformed token returns 401, 403, or 404', () => {
    cy.request({
      method: 'GET',
      url: '/identity/api/v2/user/dashboard',
      headers: {
        Authorization: 'Bearer malformed-token',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect([401, 403, 404]).to.include(response.status);
    });
  });
});
