import {Backdrop, Box, CircularProgress, Container, IconButton, Stack, Typography} from '@mui/material'
import {type KeyboardEvent, useCallback, useContext, useMemo, useState, useEffect} from 'react'
import {RemoveCircleOutline} from '@mui/icons-material'
import {type FixedTerm, type FuzzyTerm, TermLink, TermSenseEdit} from './term'
import {ResourceContext} from './resources'
import {Nav} from './nav'
import {AllCategories, BuildContext, BuildEditContext, type DictEntry} from './building'
import {DataGrid, GridColDef, GridRenderEditCellParams, GridCellParams, GridToolbarQuickFilter} from '@mui/x-data-grid'
import {TermEditor} from './termEditor'
import {INFO_DRAWER_HEIGHT, TERM_EDITOR_WIDTH} from './settingsMenu'
import {makeRows} from './processTerms'

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

function byTime(a: GridRow, b: GridRow) {
  return b.dictEntry.added - a.dictEntry.added
}
const categoryPrefix = /^category_/
export default function AddedTerms({drawerOpen}: {drawerOpen: boolean}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const Cats = useContext(AllCategories)
  const editDictionary = useContext(BuildEditContext)
  const isInDict = (term: string) => term in Dict
  const dictTerms = useMemo(() => Object.freeze(Object.keys(Dict).sort()), [Dict])
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
  const cols: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: 'remove',
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
              editCell={params.api.setEditCellValue}
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
  }, [Cats, editDictionary, editFromEvent])
  const [rows, setRows] = useState<GridRow[]>([])
  useEffect(() => {
    if (Data.termAssociations && Data.synsetInfo) {
      makeRows(Dict, Data).then(res => {
        setRows(res.sort(byTime))
      })
    }
  }, [Dict, Data])
  const processing = useMemo(() => {
    if (dictTerms.length < 1000) return false
    const rowTerms = rows.map(({id}) => id).sort()
    return Math.abs(rowTerms.length - dictTerms.length) < 2 ? false : rowTerms.join() !== dictTerms.join()
  }, [rows, dictTerms])
  const bottomMargin = drawerOpen ? INFO_DRAWER_HEIGHT : 0
  const [editorTerm, setEditorTerm] = useState('')
  if (editorTerm && !(editorTerm in Dict)) setEditorTerm('')
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
          right: editorTerm ? TERM_EDITOR_WIDTH : 0,
          bottom: 0,
          left: 0,
          overflowY: 'auto',
          mt: '3em',
          mb: bottomMargin,
        }}
      >
        {!dictTerms.length ? (
          <Typography align="center">Add terms, or import an existing dictionary.</Typography>
        ) : processing ? (
          <Backdrop open={processing}>
            <Stack direction="column">
              <Typography variant="h4" sx={{mb: 4}}>
                Processing Dictionary
              </Typography>
              <CircularProgress sx={{m: 'auto'}} />
            </Stack>
          </Backdrop>
        ) : (
          <DataGrid
            sx={{
              '& .MuiFormControl-root': {
                position: 'absolute',
                bottom: '4px',
                left: '12px',
              },
            }}
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
