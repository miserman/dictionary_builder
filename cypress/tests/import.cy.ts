import {fileBaseName} from '../../src/app/lib/utils'
import '@this-dot/cypress-indexeddb'

const dict_files = ['dict.json', 'dict_weighted.json', 'dict.csv', 'dict.dic', 'dict.tsv']

describe('import works', () => {
  it('imports different formats', () => {
    dict_files.forEach(file => {
      const notWeighted = ['dict.dic', 'dict.json'].includes(fileBaseName(file))
      cy.clearIndexedDb('dictionary_builder_building')
      cy.visit('/')
      cy.contains('button', 'Import', {timeout: 20000}).click()
      cy.get('.MuiDialog-paper').within(() => {
        cy.get('.MuiSwitch-input').first().click()
        cy.get('input[type="file"]').selectFile('cypress/tests/test_dictionaries/' + file, {force: true})
        cy.contains('button', 'Add').click()
      })
      cy.get('div[data-id="term1"]').should('have.text', 'term10.000001' + (notWeighted ? '1' : '0.5'))
      cy.get('div[data-id="term2"]').should('have.text', 'term20.000001' + (notWeighted ? '1' : '0.5'))
      cy.get('div[data-id="term\\\\d"]').should('have.text', 'term\\d02' + (notWeighted ? '11' : '0.50.5'))
    })
  })
})
