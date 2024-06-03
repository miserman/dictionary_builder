import '@this-dot/cypress-indexeddb'

describe('new named dictionary', () => {
  beforeEach(() => cy.visit('/'))
  it('imports and exports', () => {
    cy.get('button[aria-label="open dictionary menu"]', {timeout: 20000}).click()
    cy.contains('New').click()
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('input').first().type('generic')
      cy.get('textarea').type('%\n1\tcat\n%\nword\t1\nterm*\t1')
      cy.get('button').contains('Add').click()
    })
    cy.get('button[aria-label="close dictionary menu"]').click()

    cy.get('.MuiAppBar-root input').type('manual{enter}')
    cy.get('button[aria-label="add category"]').click()
    cy.get('.MuiDialogContent-root').within(() => cy.get('input').type('cat2{enter}'))
    cy.get('.MuiDialogContent-root').within(() => {
      cy.get('label').contains('Show Empty').click()
      cy.get('div[data-rowindex="1"]').children('div[data-colindex="1"]').dblclick().type('1{enter}')
      cy.get('div[data-rowindex="2"]').children('div[data-colindex="1"]').dblclick().type('1{enter}')
    })
    cy.get('button[aria-label="close category editor"]').click()
    cy.get('button[aria-label="open dictionary menu"]').click()
    cy.get('button[aria-label="undo"]').click()

    cy.contains('Export').click()
    cy.get('textarea').should('have.text', '%\n1\tcat\n2\tcat2\n%\nword\t1\nterm*\t1\t2\nmanual')
  })
})
