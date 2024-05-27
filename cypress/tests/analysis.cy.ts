import '@this-dot/cypress-indexeddb'

describe('basic analysis works', () => {
  beforeEach(() => cy.visit('/'))
  it('graphs expected terms', () => {
    cy.get('[aria-label="open dictionary menu"]', {timeout: 20000}).click()
    cy.get('.MuiDrawer-paper').within(() => cy.contains('New').click())
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('input').first().type('western_exotic')
      cy.get('textarea').type('%\n1\twestern\n2\texotic\n%\ncowboy*\t1\nhorse*\t1\nmonkey*\t2\ntiger*\t2')
      cy.get('button').contains('Add').click()
    })
    cy.get('button[aria-label="close dictionary menu"]').click()
    cy.get('button').contains('Analyze').click()
    cy.get('button').contains('All').click()
    cy.get('label').contains('Fuzzy Matches').click()
    cy.get('label').contains('Secondary Connections').click()
  })
})
