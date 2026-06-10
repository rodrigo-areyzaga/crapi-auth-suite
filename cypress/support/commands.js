Cypress.Commands.add('login', (email, password) => {
  return cy
    .request({
      method: 'POST',
      url: '/identity/api/auth/login',
      body: {
        email,
        password,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');

      const token = response.body.token;

      Cypress.env('token', token);

      return token;
    });
});