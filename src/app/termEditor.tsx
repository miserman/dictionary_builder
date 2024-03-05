import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import {Close} from '@mui/icons-material'
import {type FixedTerm, type FuzzyTerm, TermLink, TermSenseEdit} from './term'
import {type KeyboardEvent, useState, useContext, createContext, useMemo} from 'react'
import {DataGrid, type GridCellParams, type GridColDef} from '@mui/x-data-grid'
import {BuildContext, BuildEditContext} from './building'
import {getProcessedTerm} from './processTerms'
import {ResourceContext} from './resources'
import type {DictEntry} from './storage'

export const EditorTerm = createContext('')
export const EditorTermSetter = createContext((term: string, fromGraph?: boolean) => {})

export function TermEditor({
  categories,
  editor,
  width,
}: {
  categories: string[]
  editor: (value: string | number, params: GridCellParams) => void
  width: number
}) {
  const data = useContext(ResourceContext)
  const dict = useContext(BuildContext)
  const id = useContext(EditorTerm)
  const setTerm = useContext(EditorTermSetter)
  const editDictionary = useContext(BuildEditContext)
  const [showEmptyCategories, setShowEmptyCategories] = useState(false)
  if (!id || !(id in dict)) return <></>
  const processed = getProcessedTerm(id, data, dict)
  const dictEntry = dict[id]
  const cols: GridColDef[] = useMemo(
    () => [
      {field: 'id', headerName: 'Name', width: 108},
      {
        field: 'from_term_editor',
        headerName: 'Weight',
        width: 65,
        editable: true,
        hideable: false,
        valueParser: (value: any, params?: GridCellParams) => {
          const parsed = +value || ''
          if (params) {
            editor(parsed, params)
          }
          return parsed
        },
      },
    ],
    []
  )
  const weights = dictEntry.categories
  const rows: {
    id: string
    term_id: string
    from_term_editor: string | number
    dictEntry: DictEntry
    processed: FixedTerm | FuzzyTerm
  }[] = []
  categories.forEach(cat => {
    if (showEmptyCategories || cat in weights)
      rows.push({id: cat, term_id: id, from_term_editor: weights[cat] || '', dictEntry, processed})
  })
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: '-' + width + 'px',
        height: '100%',
        width: width + 'px',
      }}
    >
      <Card sx={{height: '100%', pb: '1em'}} elevation={1}>
        <CardHeader
          sx={{p: 0.5}}
          action={
            <IconButton aria-label="Close term editor" onClick={() => setTerm('')} className="close-button">
              <Close />
            </IconButton>
          }
          title={
            <Typography sx={{whiteSpace: 'nowrap', '& .MuiButtonBase-root': {fontWeight: 'bold', fontSize: '1.1em'}}}>
              <TermLink term={processed.term} />
            </Typography>
          }
        />
        <CardContent sx={{p: 0.5, height: '100%'}}>
          <Stack direction="column" sx={{pb: 1, pt: 1, height: '100%', overflowY: 'auto'}} spacing={2}>
            <TermSenseEdit label="Sense" id={id} field="" processed={processed} />
            <Stack direction="column" spacing={1} sx={{height: '100%'}}>
              <Typography fontWeight="bold">Category Weights</Typography>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showEmptyCategories}
                    onChange={() => setShowEmptyCategories(!showEmptyCategories)}
                  ></Switch>
                }
                label={<Typography variant="caption">Show Empty</Typography>}
                labelPlacement="start"
              />
              <DataGrid
                sx={{minHeight: '140px'}}
                className="bottom-search datagrid-vertical"
                rows={rows}
                columns={cols}
                disableRowSelectionOnClick
                disableDensitySelector
                disableColumnMenu
                pageSizeOptions={[100]}
                density="compact"
                onCellKeyDown={(params: GridCellParams, e: KeyboardEvent) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    const stringValue = '' + params.value
                    const newValue = params.cellMode === 'view' ? 0 : +stringValue.substring(0, stringValue.length - 1)
                    editor(newValue, params)
                    if (!newValue) e.preventDefault()
                  }
                }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  editDictionary({
                    type: 'add',
                    term: dictEntry.term || id,
                    term_type: dictEntry.type,
                    sense: dictEntry.sense,
                    categories: {...dictEntry.categories},
                    added: dictEntry.added,
                  })
                }}
              >
                Duplicate
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
