import {Box, Container, IconButton, Typography} from '@mui/material'
import {type KeyboardEvent, useCallback, useContext, useMemo, useState} from 'react'
import {RemoveCircleOutline} from '@mui/icons-material'
import {type FixedTerm, type FuzzyTerm, TermLink, TermSenseEdit} from './term'
import {ResourceContext, type TermResources} from './resources'
import {Nav} from './nav'
import {
  AllCategories,
  BuildContext,
  BuildEditContext,
  type Dict,
  type DictEntry,
  Processed,
  processTerm,
} from './building'
import {
  DataGrid,
  GridColDef,
  GridRenderEditCellParams,
  GridCellParams,
  GridToolbarQuickFilter,
  useGridApiRef,
} from '@mui/x-data-grid'
import {relativeFrequency} from './utils'
import {TermEditor} from './termEditor'
import {INFO_DRAWER_HEIGHT, TERM_EDITOR_WIDTH} from './settingsMenu'

export type SortOptions = 'term' | 'time'

export type GridRow = {
  [index: string]: number | string | FixedTerm | FuzzyTerm | DictEntry
  dictEntry: DictEntry
  id: string
  sense: string
  matches: number
} & (
  | {processed: FuzzyTerm}
  | {
      processed: FixedTerm
      sense: string
      frequency: string
      senses: number
      related: number
    }
)
function makeRowData(term: string, termSet: {[index: string]: FixedTerm | FuzzyTerm}, Data: TermResources, Dict: Dict) {
  if (!(term in termSet)) {
    termSet[term] = processTerm(Dict[term].type === 'regex' ? new RegExp(term) : term, Data)
  }
  const processed = termSet[term]
  const dictEntry = Dict[term]
  const row: GridRow =
    processed.type === 'fixed'
      ? {
          processed,
          dictEntry,
          id: term,
          sense: dictEntry.sense,
          matches: processed.recognized ? 1 : 0,
          frequency: relativeFrequency(processed.index, Data.terms && Data.terms.length),
          senses: processed.synsets.length,
          related: processed.related.length,
        }
      : {
          processed,
          dictEntry,
          id: term,
          sense: dictEntry.sense,
          matches: processed.matches.length,
        }
  if (dictEntry.categories) {
    const cats = dictEntry.categories
    Object.keys(cats).forEach(cat => {
      row['category_' + cat] = cats[cat]
    })
  }
  return row
}

function byTime(a: GridRow, b: GridRow) {
  return b.dictEntry.added - a.dictEntry.added
}
const categoryPrefix = /^category_/
export default function AddedTerms({drawerOpen}: {drawerOpen: boolean}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const Cats = useContext(AllCategories)
  const termSet = useContext(Processed)
  const editDictionary = useContext(BuildEditContext)
  const isInDict = (term: string) => term in Dict
  const addedTerms = Object.keys(Dict).reverse()
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
  const gridApi = useGridApiRef()
  const cols: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: '',
        headerName: '',
        width: 1,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderEditCellParams) => {
          return (
            <IconButton
              sx={{opacity: 0.4, cursor: 'not-allowed'}}
              size="small"
              aria-label="remove term"
              onClick={() => {
                editDictionary({type: 'remove', term: params.id as string})
              }}
            >
              <RemoveCircleOutline sx={{fontSize: '.9em'}} />
            </IconButton>
          )
        },
      },
      {
        field: 'id',
        headerName: 'Term',
        renderCell: (params: GridRenderEditCellParams) => {
          return <TermLink term={params.value} />
        },
      },
      {
        field: 'sense',
        headerName: 'Sense',
        editable: true,
        renderEditCell: (params: GridRenderEditCellParams) => {
          return (
            <TermSenseEdit
              id={params.id as string}
              field={params.field}
              processed={params.row.processed}
              gridApi={gridApi}
            />
          )
        },
      },
      {field: 'frequency', headerName: 'Frequency'},
      {field: 'matches', headerName: 'Matches'},
      {field: 'senses', headerName: 'Senses'},
      {field: 'related', headerName: 'Related'},
    ]
    Cats.forEach(cat =>
      cols.push({
        field: 'category_' + cat,
        headerName: cat,
        editable: true,
        valueParser: (value: any, params?: GridCellParams) => {
          const parsed = +value || ''
          if (params) {
            editFromEvent(parsed, params)
          }
          return parsed
        },
      })
    )
    return cols
  }, [Cats, editDictionary, editFromEvent, gridApi])
  const rows = useMemo(() => {
    const out: GridRow[] = new Array(addedTerms.length)
    if (Data.termAssociations && Data.synsetInfo) {
      addedTerms.forEach((term, index) => (out[index] = makeRowData(term, termSet, Data, Dict)))
    }
    return out.sort(byTime)
  }, [addedTerms, Data, Dict, termSet])
  const bottomMargin = drawerOpen ? INFO_DRAWER_HEIGHT : 0
  const [editorTerm, setEditorTerm] = useState('')
  if (editorTerm && (!(editorTerm in termSet) || !(editorTerm in Dict))) setEditorTerm('')
  return (
    <Container>
      <Nav
        terms={Data.terms}
        exists={isInDict}
        add={(term: string | RegExp, type: string) => {
          editDictionary({type: 'add', term: term, term_type: type})
        }}
      />
      <TermEditor
        term={editorTerm}
        processedTerms={termSet}
        dict={Dict}
        close={setEditorTerm}
        categories={Cats}
        editor={editFromEvent}
        bottomMargin={bottomMargin}
      />
      <Box
        component="main"
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: editorTerm ? TERM_EDITOR_WIDTH : 0,
          overflowY: 'auto',
          mt: '3em',
          mb: bottomMargin,
        }}
      >
        {!addedTerms.length ? (
          <Typography align="center">Add terms, or import an existing dictionary.</Typography>
        ) : (
          <DataGrid
            rows={rows}
            columns={cols}
            showCellVerticalBorder
            disableDensitySelector
            pageSizeOptions={[100]}
            density="compact"
            slots={{toolbar: GridToolbarQuickFilter}}
            onCellKeyDown={(params: GridCellParams, e: KeyboardEvent) => {
              if (e.key === 'Delete' || e.key === 'Backspace') {
                editFromEvent(0, params)
              }
            }}
            onRowClick={({row}: {row: GridRow}) => {
              setEditorTerm(row.id)
            }}
          />
        )}
      </Box>
    </Container>
  )
}
