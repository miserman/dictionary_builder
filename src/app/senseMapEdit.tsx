import {Close, RemoveCircleOutline} from '@mui/icons-material'
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {DataGrid, type GridColDef, GridToolbarQuickFilter, GridRenderEditCellParams} from '@mui/x-data-grid'
import {type KeyboardEvent, useContext, useMemo, useState, ChangeEvent} from 'react'
import {ResourceContext, SenseMapSetter, Synset} from './resources'
import {AddSenseMapPair} from './senseMapAddPair'
import {extractMatches} from './processTerms'
import {globToRegex, special, wildcards} from './utils'

export function SenseSelector({
  selected,
  setSelected,
  multi,
  useNLTK,
}: {
  selected: string[]
  setSelected: (values: string[]) => void
  multi: boolean
  useNLTK: boolean
}) {
  const {synsetInfo, SenseLookup, collapsedSenses, NLTKLookup, collapsedNLTK} = useContext(ResourceContext)
  const [suggested, setSuggested] = useState<string[]>([])

  const [input, setInput] = useState('')
  const lookup = useNLTK ? NLTKLookup : SenseLookup

  return synsetInfo ? (
    <Autocomplete
      multiple={multi}
      disableCloseOnSelect
      options={suggested}
      onKeyUp={(e: KeyboardEvent<HTMLDivElement>) => {
        const inputValue = ('value' in e.target ? (e.target.value as string) : '').toLowerCase()
        const suggestions: string[] = []
        if (inputValue) {
          let ex: RegExp | undefined
          try {
            ex = new RegExp(wildcards.test(inputValue) ? globToRegex(inputValue) : ';' + inputValue + '[^;]*;', 'g')
          } catch {
            ex = new RegExp(';' + inputValue.replace(special, '\\%&') + ';', 'g')
          }
          extractMatches('', ex, {all: useNLTK ? collapsedNLTK : collapsedSenses}, suggestions, 100)
        }
        selected.forEach(term => {
          if (!suggestions.includes(term)) suggestions.push(term)
        })
        setSuggested(suggestions)
      }}
      value={multi ? selected : selected[0]}
      onChange={(e, value) => {
        if (value) {
          if (Math.abs(value.length - selected.length) === 1) {
            setSelected([...value])
          }
        }
      }}
      renderTags={(value: readonly string[], getTagProps) => {
        return value.map((option: string, index: number) => (
          <Chip label={option} {...getTagProps({index})} key={option} />
        ))
      }}
      renderInput={params => (
        <TextField
          {...params}
          size="small"
          label="Core Terms"
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (!selected.includes(e.target.value)) setInput(e.target.value)
          }}
        ></TextField>
      )}
      renderOption={(props, key) => {
        if (key in lookup) {
          delete (props as unknown as any).key
          const {definition} = synsetInfo[(useNLTK ? NLTKLookup : SenseLookup)[key]]
          return (
            <MenuItem key={key} value={key} {...props}>
              <Tooltip title={definition} placement="right">
                <Typography sx={{width: '100%'}}>{key}</Typography>
              </Tooltip>
            </MenuItem>
          )
        }
      }}
      noOptionsText="No matches"
      filterSelectedOptions
      selectOnFocus
      clearOnBlur
      clearOnEscape
      handleHomeEndKeys
      fullWidth
    ></Autocomplete>
  ) : (
    <></>
  )
}

type rowSpec = {
  id: string
  fine: string
  coarse: string
  definition: string
  info: Synset
}
export function EditSenseMap() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const {senseMap, sense_keys, synsetInfo, SenseLookup, NLTKLookup} = useContext(ResourceContext)
  const setSenseMap = useContext(SenseMapSetter)
  const coarseLabels = useMemo(() => {
    const out: Set<string> = new Set()
    Object.values(senseMap).forEach(coarses => coarses.forEach(l => out.add(l)))
    return Object.freeze(Array.from(out))
  }, [senseMap])
  const [useNLTK, setUseNLTK] = useState(false)

  const cols: GridColDef[] = useMemo(() => {
    return [
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
                const idParts = (params.id as string).split('||')
                const fine = idParts[0]
                const newMap = {...senseMap}
                const coarses = newMap[fine]
                if (coarses.length === 1) {
                  delete newMap[fine]
                } else {
                  coarses.splice(+idParts[2], 1)
                  newMap[fine] = [...coarses]
                }
                setSenseMap(newMap)
              }}
            >
              <RemoveCircleOutline sx={{fontSize: '.9em'}} />
            </IconButton>
          )
        },
      },
      {field: 'fine', headerName: 'Fine', width: 180, hideable: false},
      {
        field: 'coarse',
        headerName: 'Coarse',
        width: 125,
        hideable: false,
      },
      {
        field: 'definition',
        headerName: 'Fine Definition',
        width: 210,
      },
    ]
  }, [senseMap])
  const rows = useMemo(() => {
    const out: rowSpec[] = []
    if (synsetInfo) {
      Object.keys(senseMap).forEach((fine, index) => {
        const coarses = senseMap[fine]
        const info = synsetInfo[SenseLookup[fine]]
        coarses.forEach(coarse => {
          out.push({
            id: fine + '||' + coarse + '||' + index,
            fine: useNLTK ? info.nltk_id : fine,
            definition: info.definition,
            coarse,
            info,
          })
        })
      })
    }
    return out
  }, [senseMap, synsetInfo, useNLTK])
  return (
    <>
      <Button variant="outlined" onClick={toggleMenu}>
        Edit
      </Button>
      <Dialog open={menuOpen} onClose={toggleMenu}>
        <DialogTitle>Sense Map Editor</DialogTitle>
        <IconButton
          aria-label="close sense map editor"
          onClick={toggleMenu}
          sx={{
            position: 'absolute',
            right: 8,
            top: 12,
          }}
          className="close-button"
        >
          <Close />
        </IconButton>
        <DialogContent sx={{p: 1}}>
          <Stack sx={{height: '500px'}} spacing={1}>
            <FormControlLabel
              control={<Switch size="small" checked={useNLTK} onChange={() => setUseNLTK(!useNLTK)}></Switch>}
              label={<Typography variant="caption">NLTK-Style Labels</Typography>}
              labelPlacement="start"
            />
            <DataGrid
              className="datagrid-vertical"
              rows={rows}
              columns={cols}
              disableRowSelectionOnClick
              disableDensitySelector
              disableColumnSelector
              pageSizeOptions={[100]}
              density="compact"
              editMode="row"
              slots={{toolbar: GridToolbarQuickFilter}}
            />
            <AddSenseMapPair coarseLabels={coarseLabels} useNLTK={useNLTK} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}
