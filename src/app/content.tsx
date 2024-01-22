import {Box, Container} from '@mui/material'
import {useCallback, useContext, useState} from 'react'
import {ResourceContext} from './resources'
import {AllCategories, BuildContext, BuildEditContext, type TermTypes} from './building'
import {InfoDrawer, InfoDrawerContext} from './infoDrawer'
import AddedTerms from './addedTerms'
import {EditorTerm, TermEditor} from './termEditor'
import {AnalyzeMenu} from './analysisMenu'
import {Nav} from './nav'
import type {GridCellParams} from '@mui/x-data-grid'
import {INFO_DRAWER_HEIGHT, TERM_EDITOR_WIDTH} from './settingsMenu'

const categoryPrefix = /^category_/
export function Content() {
  const [asTable, setAsTable] = useState(true)
  const dict = useContext(BuildContext)
  const Cats = useContext(AllCategories)
  const {terms} = useContext(ResourceContext)
  const editDictionary = useContext(BuildEditContext)
  const editFromEvent = useCallback(
    (value: string | number, params: GridCellParams) => {
      const {field, row} = params
      const {processed, dictEntry} = row
      if (field && (field === 'from_term_editor' || field.startsWith('category_'))) {
        const cats = {...dictEntry.categories}
        const cat = field === 'from_term_editor' ? row.id : field.replace(categoryPrefix, '')
        if (cat in cats && !value) {
          delete cats[cat]
        } else if (value) {
          cats[cat] = value
        }
        editDictionary({
          type: 'update',
          term: processed.term,
          term_type: processed.term_type,
          categories: cats,
        })
      }
    },
    [editDictionary]
  )
  const editorTerm = useContext(EditorTerm)
  const infoDrawerState = useContext(InfoDrawerContext)
  const showTermEditor = editorTerm in dict
  const bottomMargin = infoDrawerState.length ? INFO_DRAWER_HEIGHT : 0
  return (
    <Container>
      <Nav
        terms={terms}
        exists={(term: string) => term in dict}
        asTable={asTable}
        setAsTable={setAsTable}
        add={(term: string | RegExp, type: TermTypes) => {
          editDictionary({type: 'add', term: term, term_type: type})
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: showTermEditor ? TERM_EDITOR_WIDTH : 0,
          mt: '3em',
          mb: bottomMargin,
        }}
      >
        {asTable ? <AddedTerms editFromEvent={editFromEvent} /> : <AnalyzeMenu />}
        {showTermEditor ? <TermEditor categories={Cats} editor={editFromEvent} /> : <></>}
        <InfoDrawer />
      </Box>
    </Container>
  )
}
