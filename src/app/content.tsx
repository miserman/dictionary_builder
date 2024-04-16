import {Box, Container} from '@mui/material'
import {useCallback, useContext, useState} from 'react'
import {ResourceContext} from './resources'
import {AllCategories, BuildContext, BuildEditContext, SettingsContext, type TermTypes} from './building'
import {InfoDrawer, InfoDrawerContext} from './infoDrawer'
import AddedTerms from './addedTerms'
import {EditorTerm, TermEditor} from './termEditor'
import {Nav} from './nav'
import type {GridCellParams} from '@mui/x-data-grid'
import {PasswordPrompt} from './passwordPrompt'
import AnalyzeMenu from './analysisMenu'

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
      const fromEditor = field === 'from_term_editor'
      if (field && (fromEditor || field.startsWith('category_'))) {
        const cats = {...dictEntry.categories}
        const cat = fromEditor ? row.id : field.replace(categoryPrefix, '')
        if (cat in cats && !value) {
          delete cats[cat]
        } else if (value) {
          cats[cat] = value
        }
        editDictionary({
          type: 'update',
          term_id: row[fromEditor ? 'term_id' : 'id'],
          term: processed.term,
          term_type: processed.term_type,
          categories: cats,
          sense: dictEntry.sense,
        })
      }
    },
    [editDictionary]
  )
  const editorTerm = useContext(EditorTerm)
  const infoDrawerState = useContext(InfoDrawerContext)
  const showTermEditor = editorTerm in dict
  const settings = useContext(SettingsContext)
  const [infoDrawerHeight, setInfoDrawerHeight] = useState(settings.info_drawer_height || 30)
  const bottomMargin = infoDrawerState.length ? infoDrawerHeight : 0
  return (
    <Container>
      <Nav
        terms={terms}
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
          right: (showTermEditor ? settings.term_editor_width || 200 : 0) + 'px',
          mt: '3em',
          mb: bottomMargin + 'vh',
        }}
      >
        {asTable ? <AddedTerms editFromEvent={editFromEvent} /> : <AnalyzeMenu />}
        {showTermEditor && (
          <TermEditor categories={Cats} editor={editFromEvent} width={settings.term_editor_width || 200} />
        )}
        <InfoDrawer height={infoDrawerHeight} setHeight={setInfoDrawerHeight} />
      </Box>
      <PasswordPrompt />
    </Container>
  )
}
