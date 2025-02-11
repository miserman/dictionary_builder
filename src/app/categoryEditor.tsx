import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import {DataGrid, type GridCellParams, type GridColDef, GridToolbarQuickFilter} from '@mui/x-data-grid'
import {type ChangeEvent, type KeyboardEvent, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {AllCategories, BuildContext, BuildEditContext, CategoryEditContext, type NumberObject} from './building'
import type {FixedTerm, FuzzyTerm} from './term'
import {getProcessedTerm} from './processTerms'
import {ResourceContext} from './resources'
import {CategoryWeights} from './categoryWeights'
import type {DictEntry} from './storage'
import type {GridCell, GridRow} from './table'

export function CategoryEditor({category, onClose}: {category: string; onClose: () => void}) {
  const [showEmptyTerms, setShowEmptyTerms] = useState(false)

  const categories = useContext(AllCategories)
  const data = useContext(ResourceContext)
  const dict = useContext(BuildContext)
  const editCategories = useContext(CategoryEditContext)
  const [newName, setNewName] = useState(category)
  const [lastViewed, setLastViewed] = useState(category)
  useEffect(() => {
    setLastViewed(category)
  }, [category, setLastViewed])
  useEffect(() => {
    setNewName(lastViewed)
  }, [lastViewed, setNewName])
  const editDictionary = useContext(BuildEditContext)
  const editFromEvent = useCallback(
    (value: string | number, row: GridCell) => {
      const {field, processed, dictEntry} = row
      if (field) {
        const cats = {...dictEntry.categories}
        if (category in cats && !value) {
          delete cats[category]
        } else if (value) {
          cats[category] = +value
        }
        editDictionary({
          type: 'update',
          term_id: row.id as string,
          term: processed.term,
          term_type: processed.term_type,
          categories: cats,
        })
      }
    },
    [editDictionary, category]
  )
  const ids = useMemo(() => new Map(Object.keys(dict).map((term, index) => [index, term])), [dict])
  const catWeights = useMemo(() => {
    const weights: NumberObject = {}
    ids.forEach(id => {
      const {categories} = dict[id]
      if (category in categories) weights[id] = categories[category]
    })
    return weights
  }, [dict, ids, category])
  const rows = useMemo(() => {
    const out: {
      id: string
      term: string
      weight: string | number
      dictEntry: DictEntry
      processed: FixedTerm | FuzzyTerm
    }[] = []
    ids.forEach(id => {
      if (showEmptyTerms || id in catWeights) {
        const entry = dict[id]
        out.push({
          id,
          term: entry.term ? (entry.sense && id !== entry.term ? entry.term + '@' + entry.sense : entry.term) : id,
          weight: catWeights[id] || '',
          dictEntry: entry,
          processed: getProcessedTerm(id, data, dict),
        })
      }
    })
    return out
  }, [data, dict, ids, showEmptyTerms, catWeights])
  if (!category || !categories.includes(category)) return <></>
  const cols: GridColDef[] = [
    {field: 'term', headerName: 'Term'},
    {
      field: 'weight',
      headerName: 'Weight',
      editable: true,
      hideable: false,
      valueParser: (value: any, row: GridRow, params) => {
        const parsed = +value || ''
        if (params) {
          editFromEvent(parsed, {...row, field: params.field})
        }
        return parsed
      },
    },
  ]
  return (
    <Dialog open={!!category} onClose={onClose}>
      <DialogTitle>Category Editor</DialogTitle>
      <IconButton
        aria-label="close category editor"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 12,
        }}
        className="close-button"
      >
        <Close />
      </IconButton>
      <DialogContent sx={{p: 1, width: '400px', maxWidth: '100%', height: '500px'}}>
        <Stack sx={{height: '100%'}}>
          <Stack direction="row">
            <TextField
              label="Name"
              fullWidth
              value={newName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              size="small"
            />
            {newName !== category && (
              <Button
                variant="contained"
                onClick={() => {
                  editDictionary({type: 'rename_category', name: category, newName: newName})
                }}
              >
                Rename
              </Button>
            )}
          </Stack>
          <Stack direction="column" spacing={1} sx={{mt: 2, height: '100%'}}>
            <Typography fontWeight="bold">Term Weights</Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showEmptyTerms}
                  onChange={() => setShowEmptyTerms(!showEmptyTerms)}
                ></Switch>
              }
              label={<Typography variant="caption">Show Empty</Typography>}
              labelPlacement="start"
            />
            <DataGrid
              className="bottom-search datagrid-vertical"
              rows={rows}
              columns={cols}
              disableRowSelectionOnClick
              disableDensitySelector
              disableColumnMenu
              pageSizeOptions={[100]}
              density="compact"
              slots={{toolbar: () => <GridToolbarQuickFilter sx={{width: '200px'}} />}}
              onCellKeyDown={(params: GridCellParams, e: KeyboardEvent) => {
                if ((e.key === 'Delete' || e.key === 'Backspace') && params.cellMode === 'view') {
                  editFromEvent(0, {...params.row, field: params.field})
                }
              }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" sx={{justifyContent: 'space-between', width: '100%'}}>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              editDictionary({type: 'remove_category', name: category})
              editCategories({type: 'remove', cat: category})
              onClose()
            }}
          >
            Delete
          </Button>
          <CategoryWeights name={category} current={catWeights} edit={editDictionary} />
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
