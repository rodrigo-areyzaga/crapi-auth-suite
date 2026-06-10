// This suite documents authorization-boundary behavior on the crAPI community endpoints.
// The primary finding is information disclosure: the recent posts endpoint exposes
// author email and vehicle ID for all users in every authenticated response.
// This is not a classic IDOR — write-time ownership is correctly enforced.
// See FINDINGS.md for full documentation.

const ALICE_POST_ID = 'ycm6TWNd8U6hRcMfanmD6d';

const BOB_EMAIL = 'bob@crapi.local';

describe('crAPI community disclosure boundary checks', () => {
  // Validates that Alice can access the authenticated recent posts feed.
  it('Alice can retrieve recent posts from GET /community/api/v2/community/posts/recent', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        cy.request({
          method: 'GET',
          url: '/community/api/v2/community/posts/recent',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('posts');
          expect(response.body.posts).to.be.an('array');
        });
      });
    });
  });

  // Validates that Bob can access the authenticated recent posts feed.
  it('Bob can retrieve recent posts from GET /community/api/v2/community/posts/recent', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.bob.email, users.bob.password).then((token) => {
        cy.request({
          method: 'GET',
          url: '/community/api/v2/community/posts/recent',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('posts');
          expect(response.body.posts).to.be.an('array');
        });
      });
    });
  });

  // Validates that unauthenticated users cannot retrieve the recent posts feed.
  it('Unauthenticated request to GET /community/api/v2/community/posts/recent returns non-200', () => {
    cy.request({
      method: 'GET',
      url: '/community/api/v2/community/posts/recent',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });

  // Validates the information disclosure finding: Bob receives author email and vehicle ID values for users other than himself.
  it("When Bob retrieves recent posts, the response exposes another author's email and vehicleid", () => {
    cy.fixture('users').then((users) => {
      cy.login(users.bob.email, users.bob.password).then((token) => {
        cy.request({
          method: 'GET',
          url: '/community/api/v2/community/posts/recent',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.have.property('posts');
          expect(response.body.posts).to.be.an('array');

          const postsFromOtherUsers = response.body.posts.filter((post) => {
            return post.author && post.author.email !== BOB_EMAIL;
          });

          expect(postsFromOtherUsers.length).to.be.greaterThan(0);

          const disclosedPost = postsFromOtherUsers.find((post) => {
            return (
              post.author.email &&
              post.author.email.length > 0 &&
              post.author.vehicleid &&
              post.author.vehicleid.length > 0
            );
          });

          expect(disclosedPost).to.exist;
          expect(disclosedPost.author.email).to.be.a('string').and.not.be.empty;
          expect(disclosedPost.author.vehicleid).to.be.a('string').and.not.be.empty;

          cy.log(
            `Information disclosure finding: Bob received author.email=${disclosedPost.author.email} and author.vehicleid=${disclosedPost.author.vehicleid} for another user.`
          );
        });
      });
    });
  });

  // Validates that Alice can access a specific community post by ID.
  it('Alice can access a specific post by ID using GET /community/api/v2/community/posts/ycm6TWNd8U6hRcMfanmD6d', () => {
    cy.fixture('users').then((users) => {
      cy.login(users.alice.email, users.alice.password).then((token) => {
        cy.request({
          method: 'GET',
          url: `/community/api/v2/community/posts/${ALICE_POST_ID}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });

  // Validates that Bob can read Alice's specific community post.
  // This is expected community behavior, not a finding, unless the application's intended policy restricts post visibility.
  it("Bob can access Alice's specific post by ID using Bob's token", () => {
    cy.fixture('users').then((users) => {
      cy.login(users.bob.email, users.bob.password).then((token) => {
        cy.request({
          method: 'GET',
          url: `/community/api/v2/community/posts/${ALICE_POST_ID}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
        });
      });
    });
  });
});