import {defineConfig} from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000/dictionary_builder',
    specPattern: 'cypress/tests/**/*.cy.ts',
    supportFile: false,
    setupNodeEvents(on, config) {},
  },
})
