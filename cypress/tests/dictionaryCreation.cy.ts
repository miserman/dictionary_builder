import '@this-dot/cypress-indexeddb'

function dictionaryMenu() {
  cy.get('[aria-label="open dictionary menu"]', {timeout: 7000}).click()
  return cy.get('.MuiDrawer-paper')
}

describe('new default dictionary', () => {
  before(() => {
    cy.clearIndexedDb('dictionary_builder_building')
    cy.clearIndexedDb('dictionary_builder_coarse_sense_map')
  })
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
  it('copies dictionary', () => {
    dictionaryMenu().within(() => cy.get('button').contains('New').click())
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('button').contains('Copy').click()
      cy.get('.MuiListItemButton-root').contains('default').click()
      cy.get('button').contains('Add').click()
    })
    cy.get('.MuiDataGrid-main').should('contain.text', 'frog').should('contain.text', 'ants*')
  })
})

describe('new named dictionary', () => {
  it('imports, exports, and decrypts', () => {
    cy.visit('/')
    dictionaryMenu().within(() => cy.contains('New').click())
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('input').first().type('generic')
      cy.get('textarea').type('%\n1\tcat\n%\nword\t1\nterm*\t1')
      cy.get('.MuiSwitch-input').last().click()
      cy.get('input[type="password"]').type('123')
      cy.get('button').contains('Add').click()
    })
    cy.get('.MuiList-root').first().should('have.text', 'cat')
    cy.get('.MuiSelect-select').click()
    cy.get('.MuiMenu-list').should('have.text', 'defaultgeneric')
    cy.get('li').contains('generic').click()
    cy.contains('Export').click()
    cy.get('textarea').should('have.text', '%\n1\tcat\n%\nword\t1\nterm*\t1')
    // decrypts from IndexedDB
    cy.visit('/')
    cy.get('input[type="password"]', {timeout: 20000}).type('123')
    cy.get('button').contains('Decrypt').click()
    cy.get('button[aria-label="toggle settings menu"]').click()
    cy.get('label').contains('IndexedDB').click()
    cy.get('button[aria-label="close settings menu"]').click()
    cy.get('.MuiAppBar-root input').type('words{enter}')
    // decrypts from LocalStorage
    cy.visit('/')
    cy.get('input[type="password"]', {timeout: 20000}).type('123')
    cy.get('button').contains('Decrypt').click()
    dictionaryMenu().within(() => cy.contains('Delete').click())
    cy.get('.MuiDialog-paper').within(() => {
      cy.get('button').contains('Delete').click()
    })
    cy.get('div[aria-labelledby="dictionary_select"]').should('contain', 'default')
  })
})
