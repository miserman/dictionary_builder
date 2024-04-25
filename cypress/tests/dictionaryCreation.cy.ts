import '@this-dot/cypress-indexeddb'

function dictionaryMenu() {
  cy.get('[aria-label="open dictionary menu"]', {timeout: 7000}).click()
  return cy.get('.MuiDrawer-paper')
}

describe('new default dictionary', () => {
  before(() => cy.clearIndexedDb('dictionary_builder_building'))
  beforeEach(() => cy.visit('/'))
  it('adds terms', () => {
    cy.get('.MuiAppBar-root input', {timeout: 20000}).type('frog{enter}ants*{enter}')
    cy.get('.MuiDataGrid-main').should('contain.text', 'frog').should('contain.text', 'ants*')
  })
  it('shows info', () => {
    cy.get('.MuiDataGrid-main', {timeout: 1e4}).contains('frog').click()
    cy.get('.MuiDrawer-root').should('contain.text', 'frog%1:06:00::')
    cy.get('.MuiDataGrid-main').contains('ants*').click()
    cy.get('.MuiDrawer-root').should('contain.text', 'antsy')
  })
  it('adds a category', () => {
    dictionaryMenu().within(() => cy.get('.MuiCardContent-root input').type('animal{enter}{esc}'))
    cy.get('[data-colindex="8"]').first().dblclick().type('1{enter}')
    cy.get('[data-colindex="8"]', {timeout: 7000}).last().dblclick().type('1{enter}')
  })
  it('exports', () => {
    dictionaryMenu().within(() => cy.contains('Export').click())
    cy.get('textarea').should('have.text', '%\n1\tanimal\n%\nfrog\t1\nants*\t1')
  })
})

describe('new named dictionary', () => {
  beforeEach(() => cy.visit('/'))
  it('imports and exports', () => {
    dictionaryMenu().within(() => cy.contains('New').click())
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('input').first().type('generic')
      cy.get('textarea').type('%\n1\tcat\n%\nword\t1\nterm*\t1')
      cy.get('button').contains('Add').click()
    })
    cy.get('.MuiList-root').first().should('have.text', 'cat')
    cy.get('.MuiSelect-select').click()
    cy.get('.MuiMenu-list').should('have.text', 'defaultgeneric')
    cy.get('li').contains('generic').click()
    cy.contains('Export').click()
    cy.get('textarea').should('have.text', '%\n1\tcat\n%\nword\t1\nterm*\t1')
  })
})
