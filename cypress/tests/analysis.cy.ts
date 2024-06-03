import '@this-dot/cypress-indexeddb'

function setInputFromLabel(label: string, value: string) {
  cy.get('label')
    .contains(label)
    .parent()
    .within(() => {
      cy.get('input')
        .clear()
        .type(value + '{enter}')
    })
}

function selectOption(label: string, option: string) {
  cy.get('label')
    .contains(label)
    .parent()
    .within(() => {
      cy.get('label')
        .contains(label)
        .parent()
        .within(() => cy.get('.MuiSelect-select').click())
    })
  cy.get('li').contains(option).click()
}

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
    cy.get('span').contains('exotic').click()
    setInputFromLabel('Similarity Threshold', '0.01')
    cy.get('label').contains('Hide Zeros').click()
    cy.get('label').contains('Size By Value').click()
    setInputFromLabel('Label Threshold', '1')
    selectOption('Layout', 'Circular')
    selectOption('Layout', 'Force')
    setInputFromLabel('Repulsion', '50')
    setInputFromLabel('Gravity', '.2')
    setInputFromLabel('Edge Length', '20')
  })
})
