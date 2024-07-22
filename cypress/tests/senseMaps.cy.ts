import '@this-dot/cypress-indexeddb'

function settingsMenu() {
  cy.get('[aria-label="toggle settings menu"]', {timeout: 20000}).click()
  return cy.get('.MuiDrawer-paper')
}

describe('import and export works', () => {
  before(() => {
    cy.clearIndexedDb('dictionary_builder_building')
    cy.clearIndexedDb('dictionary_builder_coarse_sense_map')
  })
  it('imports, is editable, and exports', () => {
    cy.visit('/')
    settingsMenu().within(() => cy.get('button').contains('Import').click())
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('.MuiSwitch-input').last().click()
      cy.get('input[type="password"]').type('123', {force: true})
      cy.get('input[type="file"]').selectFile('cypress/tests/testSenseMap.csv', {force: true})
      cy.get('button').contains('Set').click()
    })
    cy.contains('Mapped senses: 9')

    cy.get('button').contains('Edit').click()
    cy.get('.MuiDialog-paper').within(() => {
      cy.contains('limit%1:15:02::')
      cy.get('button').contains('New Pairs').click()
    })
    cy.contains('h2', 'Sense Mappings')
      .parent()
      .within(() => {
        cy.get('input').first().type('limited%3:00:00::{enter}{downArrow}{enter}')
        cy.get('input').last().type('limit_imposed{enter}{esc}')
        cy.get('button').contains('Add').click()
      })
    cy.contains(/^limit$/)
      .dblclick()
      .dblclick()
      .type('limit_specific{enter}')
    cy.get('button[aria-label="close sense map editor"]').click()
    cy.get('button[aria-label="close settings menu"]').click()
    cy.get('input').first().type('limit')
    cy.contains('button', 'View').click()
    cy.contains('limit_action')
    cy.contains('limit_specific')
    cy.get('button[aria-label="Close info drawer"]').click()
    settingsMenu().within(() => cy.get('button').contains('Export').click())
    cy.get('textarea').should(
      'contain.text',
      'fine,coarse,note\nlimit.n.03,limit_specific,1\nlimit.n.06,limit_specific,2\n' +
        'terminus_ad_quem.n.01,limit_specific,2\nlimit.n.04,limit_specific,3\n' +
        'limit.n.05,limit_specific,3\nspecify.v.02,limit_action,4\nrestrict.v.03,limit_action,5\n' +
        'limit.v.02,limit_action,5\nlimited.a.01,limit_imposed,\nlimit.n.01,limit_specific,'
    )
  })
})
