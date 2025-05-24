import {Backdrop, Box, IconButton, LinearProgress, Stack, Typography} from '@mui/material'
import {useContext, useMemo, useState, useEffect, useCallback} from 'react'
import {RemoveCircleOutline} from '@mui/icons-material'
import {TermLink, TermSenseEdit} from './term'
import {ResourceContext} from './resources'
import {AllCategories, BuildContext, BuildEditContext} from './building'
import type {GridColDef, GridRenderEditCellParams} from '@mui/x-data-grid'
import {makeRows} from './processTerms'
import {CategoryEditor} from './categoryEditor'
import {type GridRow, Table, type GridCell} from './table'
import {ImportMenu} from './import'

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
  editFromEvent: (value: number | string, params: GridCell) => void
}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const Cats = useContext(AllCategories)
  const isCategory = useCallback((name: string) => Cats.includes(name), [Cats])
  const editDictionary = useContext(BuildEditContext)
  const dictTerms = useMemo(
    () =>
      Object.freeze(
        Object.keys(Dict)
          .map(id => Dict[id].term || id)
          .sort()
      ),
    [Dict]
  )
  const cols = useMemo(() => {
    const out: GridColDef[] = [
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
                editDictionary({type: 'remove', term_id: params.id as string})
              }}
            >
              <RemoveCircleOutline sx={{fontSize: '.9em'}} />
            </IconButton>
          )
        },
      },
      {
        field: 'term',
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
      out.push({
        field: 'category_' + cat,
        headerName: cat,
        editable: true,
        valueParser: (value: string | number, row: GridRow, params) => {
          const parsed = +value || ''
          if (params) {
            editFromEvent(parsed, {...row, field: params.field})
          }
          return parsed
        },
      })
    )
    return out
  }, [Cats, editFromEvent, editDictionary])
  const [rows, setRows] = useState<GridRow[]>([])
  const [progress, setProgress] = useState(0)
  const processing = useMemo(() => {
    if (dictTerms.length < 1000) return false
    const rowTerms = rows.map(({id}) => id).sort()
    return Math.abs(rowTerms.length - dictTerms.length) < 2 ? false : rowTerms.join() !== dictTerms.join()
  }, [rows, dictTerms])
  useEffect(() => {
    if (Data.termAssociations && Data.synsetInfo) {
      makeRows(Dict, Data, processing ? setProgress : undefined).then(res => {
        setRows(res.sort(byTime))
        if (processing) setProgress(0)
      })
    }
  }, [Dict, Data, processing])
  const [editCategory, setEditCategory] = useState('')
  return (
    <Box component="main" sx={{height: '100%'}}>
      {!dictTerms.length || (!processing && !rows.length) ? (
        <Stack sx={{p: 3}}>
          <Typography align="center">Add terms, or import an existing dictionary.</Typography>
          <Box sx={{m: 'auto', p: 1}}>
            <ImportMenu>Import</ImportMenu>
          </Box>
        </Stack>
      ) : processing ? (
        <Backdrop open={processing} sx={{alignItems: 'baseline'}}>
          <Stack sx={{textAlign: 'center', mt: 12}}>
            <Typography variant="h4">Processing Dictionary</Typography>
            <LinearProgress variant="determinate" value={progress * 100} />
            <Typography variant="caption">{progress ? Math.round(progress * 100) + '%' : 'preparing...'}</Typography>
          </Stack>
        </Backdrop>
      ) : (
        <Table
          rows={rows}
          columns={cols}
          isCategory={isCategory}
          setEditCategory={setEditCategory}
          editFromEvent={editFromEvent}
        />
      )}
      <CategoryEditor category={editCategory} onClose={() => setEditCategory('')} />
    </Box>
  )
}
