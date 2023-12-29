import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import {Close} from '@mui/icons-material'
import {type FixedTerm, type FuzzyTerm, TermLink, TermSenseEdit} from './term'
import {TERM_EDITOR_WIDTH} from './settingsMenu'
import {KeyboardEvent, useState} from 'react'
import {DataGrid, GridCellParams, type GridColDef} from '@mui/x-data-grid'
import type {Dict, DictEntry} from './building'

export function TermEditor({
  term,
  processedTerms,
  dict,
  close,
  categories,
  editor,
  bottomMargin,
}: {
  term: string
  processedTerms: {[index: string]: FixedTerm | FuzzyTerm}
  dict: Dict
  close: (term: string) => void
  categories: string[]
  editor: (value: string | number, params: GridCellParams) => void
  bottomMargin: number | string
}) {
  const [showEmptyCategories, setShowEmptyCategories] = useState(false)
  if (!term) return <></>
  const processed = processedTerms[term]
  const dictEntry = dict[term]
  if (!processed || !dictEntry) return <></>
  const cols: GridColDef[] = [
    {field: 'id', headerName: 'Name', width: 110},
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
  ]
  const weights = dictEntry.categories
  const rows: {
    id: string
    from_term_editor: string | number
    dictEntry: DictEntry
    processed: FixedTerm | FuzzyTerm
  }[] = []
  categories.forEach(cat => {
    if (showEmptyCategories || cat in weights)
      rows.push({id: cat, from_term_editor: weights[cat] || '', dictEntry, processed})
  })
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: TERM_EDITOR_WIDTH,
        mt: '3em',
        mb: bottomMargin,
      }}
    >
      <Card sx={{height: '100%', pb: '2.5em'}} elevation={1}>
        <CardHeader
          action={
            <IconButton aria-label="Close term editor" onClick={() => close('')}>
              <Close />
            </IconButton>
          }
          title={
            <Typography>
              <TermLink term={processed.term} />
            </Typography>
          }
        />
        <CardContent sx={{p: 0.5, height: '100%'}}>
          <Stack direction="column" sx={{height: '100%'}}>
            <FormControl sx={{mb: 3}}>
              {processed.type === 'fuzzy' || !processed.synsets.length ? (
                <></>
              ) : (
                <InputLabel sx={{mt: '-7px'}}>Sense</InputLabel>
              )}
              <TermSenseEdit label="Sense" id="" field="" processed={processed} />
            </FormControl>
            <Stack direction="column" spacing={1} sx={{height: '100%'}}>
              <Typography>Category Weights</Typography>
              <FormControlLabel
                sx={{width: '100%'}}
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
                sx={{
                  '& .MuiToolbar-root': {p: 0},
                  '& .MuiDataGrid-main': {height: 0},
                  '& .MuiTablePagination-displayedRows': {m: 0},
                  '& .MuiTablePagination-actions': {m: 0},
                }}
                rows={rows}
                columns={cols}
                disableRowSelectionOnClick
                disableDensitySelector
                disableColumnMenu
                pageSizeOptions={[100]}
                density="compact"
                onCellKeyDown={(params: GridCellParams, e: KeyboardEvent) => {
                  if (e.key === 'Delete' || e.key === 'Backspace') {
                    editor(0, params)
                  }
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
