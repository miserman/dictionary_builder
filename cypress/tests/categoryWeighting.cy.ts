import '@this-dot/cypress-indexeddb'

describe('weights are applied to terms', () => {
  it('fills weights', () => {
    cy.clearIndexedDb('dictionary_builder_building')
    cy.visit('/')
    cy.get('.MuiAppBar-root input', {timeout: 20000}).type('a{enter}b{enter}')
    cy.get('button[aria-label="add category"]').click()
    cy.get('#category_adder_input').type('c{enter}')

    cy.contains('button', 'Fill Weights').click()
    cy.get('div[aria-label="category weight core terms"]').within(() => cy.get('input').type('c{enter}{esc}'))
    cy.contains('button', /^Fill$/).click()
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('.MuiDataGrid-virtualScrollerContent').should('have.text', 'a0.0001b1')
    })

    cy.contains('button', 'Fill Weights').click()
    cy.contains('label', 'Similarity-based').click()
    cy.get('#category_weight_filler_value').clear().type('.5')
    cy.contains('button', /^Fill$/).click()
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('.MuiDataGrid-virtualScrollerContent').should('have.text', 'a0.5b0.5')
    })
  })
})
