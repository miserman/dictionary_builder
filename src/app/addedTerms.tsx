import {Backdrop, Box, IconButton, LinearProgress, Stack, Typography} from '@mui/material'
import {type KeyboardEvent, useContext, useMemo, useState, useEffect} from 'react'
import {RemoveCircleOutline} from '@mui/icons-material'
import {type FixedTerm, type FuzzyTerm, TermLink, TermSenseEdit} from './term'
import {ResourceContext} from './resources'
import {AllCategories, BuildContext, BuildEditContext, type DictEntry} from './building'
import {DataGrid, GridColDef, GridRenderEditCellParams, GridCellParams, GridToolbarQuickFilter} from '@mui/x-data-grid'
import {EditorTermSetter} from './termEditor'
import {makeRows} from './processTerms'

export type SortOptions = 'term' | 'time'

export type GridRow = {
  [index: string]: number | string | FixedTerm | FuzzyTerm | DictEntry
  dictEntry: DictEntry
  id: string
  sense: string
  matches: number
  ncats: number
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

export const timers: {dictionary: number | NodeJS.Timeout; comparisons: number | NodeJS.Timeout} = {
  dictionary: 0,
  comparisons: 0,
}
function byTime(a: GridRow, b: GridRow) {
  return b.dictEntry.added - a.dictEntry.added
}
export default function AddedTerms({
  editFromEvent,
}: {
  editFromEvent: (value: number | string, params: GridCellParams) => void
}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const Cats = useContext(AllCategories)
  const editDictionary = useContext(BuildEditContext)
  const dictTerms = useMemo(() => Object.freeze(Object.keys(Dict).sort()), [Dict])
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
        description: 'assigned sense key',
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
      {
        field: 'frequency',
        headerName: 'Frequency',
        description:
          'relative frequency; 100 - index / n terms * 100; terms are loosely sorted by frequency and space coverage',
      },
      {field: 'matches', headerName: 'Matches', description: 'number of matches found in the full term list'},
      {field: 'senses', headerName: 'Senses', description: 'number of directly associated senses'},
      {
        field: 'related',
        headerName: 'Related',
        description: 'number of similar terms on record, based on agreement between embeddings spaces',
      },
      {
        field: 'ncats',
        headerName: 'Categories',
        description: 'number of categories the term has weight in',
      },
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
  }, [Cats, editFromEvent])
  const [rows, setRows] = useState<GridRow[]>([])
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (Data.termAssociations && Data.synsetInfo) {
      makeRows(Dict, Data, setProgress).then(res => {
        setRows(res.sort(byTime))
        setProgress(0)
      })
    }
  }, [Dict, Data])
  const processing = useMemo(() => {
    if (dictTerms.length < 1000) return false
    const rowTerms = rows.map(({id}) => id).sort()
    return Math.abs(rowTerms.length - dictTerms.length) < 2 ? false : rowTerms.join() !== dictTerms.join()
  }, [rows, dictTerms])
  const setEditorTerm = useContext(EditorTermSetter)
  return (
    <Box component="main" sx={{height: '100%'}}>
      {!dictTerms.length ? (
        <Typography align="center">Add terms, or import an existing dictionary.</Typography>
      ) : processing ? (
        <Backdrop open={true}>
          <Stack direction="column" sx={{textAlign: 'center'}}>
            <Typography variant="h4">Processing Dictionary</Typography>
            <LinearProgress variant="determinate" value={progress * 100} />
            <Typography variant="caption">{progress ? Math.round(progress * 100) + '%' : 'preparing...'}</Typography>
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
  )
}
