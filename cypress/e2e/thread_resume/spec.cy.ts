import { submitMessage } from '../../support/testUtils';

const login = (user: 'alice' | 'bob') => {
  cy.visit('/');
  cy.location('pathname').should('eq', '/login');

  cy.get("input[name='email']").clear();
  cy.get("input[name='email']").type(user);
  cy.get("input[name='password']").clear();
  cy.get("input[name='password']").type(user === 'alice' ? 'a' : 'b');

  cy.intercept('POST', '/login').as('loginReq');
  cy.intercept('GET', '/user').as('userReq');

  cy.get("button[type='submit']").click();

  cy.location('pathname', { timeout: 10000 }).should('eq', '/');
};

describe('Thread resume (author)', () => {
  it('resumes own thread, composer visible, can continue chatting', () => {
    login('alice');

    // Start a thread and let the first turn finish before reloading
    submitMessage('hi');
    cy.location('pathname').should('match', /\/thread\//);
    cy.get("[data-step-type='assistant_message']").should(
      'contain',
      'Echo: hi'
    );

    // Reload to trigger resume
    cy.reload();

    // Composer present and no read-only banner
    cy.get('#message-composer').should('be.visible');
    cy.get('[data-testid="read-only-banner"]').should('not.exist');

    // `#message-composer` turns visible before the thread has finished
    // hydrating. Wait for the `@cl.on_chat_resume` message to land and for the
    // task to end (the composer shows a stop button while one is running),
    // otherwise the send button re-renders under the click.
    cy.get("[data-step-type='assistant_message']").should(
      'contain',
      'Resumed:'
    );
    cy.get('#stop-button').should('not.exist');

    // Continue chatting
    submitMessage('still here');
    cy.get("[data-step-type='assistant_message']").contains('Echo: still here');
  });
});
