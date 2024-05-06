import '@this-dot/cypress-indexeddb'

describe('single terms are processed', () => {
  before(() => {
    cy.clearIndexedDb('dictionary_builder_building')
    cy.clearIndexedDb('dictionary_builder_coarse_sense_map')
  })
  beforeEach(() => cy.visit('/'))
  it('can add and terms of all types and edit senses', () => {
    cy.get('.MuiAppBar-root input', {timeout: 20000}).type('fixed{enter}glob*{enter}')
    // data ids start at 1 when running in dev due to double runs
    cy.get('div[data-id="glob*1"]').should('have.text', 'glob*990')
    cy.get('div[data-id="fixed1"]').should('have.text', 'fixed98.451450')

    cy.get('button[aria-label="toggle regular expression"]', {timeout: 15000}).click()
    cy.get('.MuiAppBar-root input').type('reg.*s{enter}')
    cy.get('div[data-id="reg.*s1"]').should('have.text', 'reg.*s870')

    cy.get('div[data-colindex="2"]').last().dblclick().click()
    cy.get('.MuiAutocomplete-popper')
      .should(
        'have.text',
        'no category(0.01) fixed%5:00:00:determinate:01 12(0.00) fixed%3:00:00:: 2(0.00)' +
          ' set%5:00:00:nonmoving:00 1(0.00) frozen%5:00:00:unchangeable:00'
      )
      .within(() => {
        cy.contains('fixed%5:00:00:determinate:01').click()
      })
  })
  it('can change coarse sense map', () => {
    cy.get('button[aria-label="toggle settings menu"]', {timeout: 15000}).click()
    cy.get('button[aria-label="edit coarse sense map"]').click()
    const dialog = cy.contains('Sense Map Editor').parent()
    dialog.within(() => cy.contains('New Pairs').click())
    cy.contains('Sense Mappings')
      .parent()
      .within(() => {
        cy.contains('Fine Senses')
          .parent()
          .within(() => cy.get('input').type('fixed%5:00:00:determinate:01{downArrow}{enter}'))
        cy.contains('Coarse Senses')
          .parent()
          .within(() => cy.get('input').type('number_related{enter}'))
        cy.contains('Add').click()
      })
    dialog.within(() => {
      cy.contains('NLTK-Style Labels').click()
      cy.contains('fixed.s.01')
      cy.get('button[aria-label="close sense map editor"]').click()
    })
    cy.contains('Mapped senses: 1')
    cy.get('button').contains('Export').click()
    cy.get('textarea').should(
      'have.text',
      '"fine_sense","coarse_sense"\n"fixed%5:00:00:determinate:01","number_related"'
    )
    cy.get('button[aria-label="close export menu"]').click()
    cy.get('button[aria-label="close settings menu"]').click()
    cy.get('div[data-id="fixed1"]').click()
    cy.get('label').contains('Sense').parent().click()
    cy.get('.MuiAutocomplete-popper')
      .should(
        'have.text',
        'number_related(0.01) fixed%5:00:00:determinate:01 12no category(0.00) fixed%3:00:00:: 2(0.00)' +
          ' set%5:00:00:nonmoving:00 1(0.00) frozen%5:00:00:unchangeable:00'
      )
      .within(() => {
        cy.contains('number_related').click()
      })
    cy.get('button[aria-label="Close term editor"]').click()
    cy.get('[aria-label="open dictionary menu"]').click()
    cy.get('.MuiDrawer-paper').within(() => {
      cy.get('.MuiCardContent-root input').type('baseWeight{enter}')
      cy.contains('baseWeight').click()
    })
    cy.contains('Category Editor')
      .parent()
      .within(() => cy.contains('Fill Weights').click())
    cy.contains('Category Weight Filler')
      .parent()
      .within(() => {
        cy.contains('Similarity-based').click()
        cy.get('button').contains('Fill').click()
      })
    cy.get('button[aria-label="close category editor"]').click()
    cy.get('.MuiDrawer-paper').within(() => cy.get('button').contains('Export').click())
    cy.get('textarea').should('have.text', '%\n1\tbaseWeight\n%\nfixed\t1\nglob*\t1\nreg.*s\t1')
  })
})
