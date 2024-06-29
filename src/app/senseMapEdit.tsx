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
import {type CoarseSenseMap, ResourceContext, SenseMapSetter, type Synset, type SenseMapSetterFun} from './resources'
import {AddSenseMapPair} from './senseMapAddPair'
import {extractMatches} from './processTerms'
import {globToRegex, special, wildcards} from './lib/utils'

export function SenseSelector({
  selected,
  setSelected,
  multi,
  useNLTK,
  editCell,
  params,
}: {
  selected: string[]
  setSelected: (values: string[]) => void
  multi: boolean
  useNLTK: boolean
  editCell?: (params: any) => void
  params?: GridRenderEditCellParams
}) {
  const {synsetInfo, SenseLookup, collapsedSenses, NLTKLookup, collapsedNLTK} = useContext(ResourceContext)
  const [suggested, setSuggested] = useState<string[]>([])

  const [input, setInput] = useState('')
  const lookup = useNLTK ? NLTKLookup : SenseLookup

  return synsetInfo ? (
    <Autocomplete
      componentsProps={{popper: {className: 'synset-select'}}}
      multiple={multi}
      autoSelect
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
          const newValue = 'string' === typeof value ? [value] : [...value]
          editCell && params && editCell({...params, newValue})
          setSelected(newValue)
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
          label="Fine Senses"
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
            <MenuItem {...props} value={key} key={key}>
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
function parseMapId(id: string, map: CoarseSenseMap) {
  const idParts = id.split('||')
  const fine = idParts[0]
  const newMap = {...map}
  const coarses = newMap[fine]
  if (coarses.length === 1) {
    delete newMap[fine]
  } else {
    coarses.splice(+idParts[2], 1)
    newMap[fine] = [...coarses]
  }
  return {newMap, fine: idParts[0], coarse: idParts[1], index: idParts[2]}
}
function CoarseLabelEdit({
  params,
  labels,
  senseMap,
  senseMapStore,
  updateSenseMap,
}: {
  params: GridRenderEditCellParams
  labels: readonly string[]
  senseMap: CoarseSenseMap
  senseMapStore: boolean
  updateSenseMap: SenseMapSetterFun
}) {
  const [newValue, setNewValue] = useState('')
  return (
    <Autocomplete
      componentsProps={{popper: {className: 'synset-select'}}}
      disableCloseOnSelect
      options={labels}
      value={params.value}
      onChange={(_, value) => {
        const {newMap, fine} = parseMapId(params.id as string, senseMap)
        if (fine in newMap) {
          newMap[fine].push(value)
        } else {
          newMap[fine] = [value]
        }
        updateSenseMap(newMap, {store: senseMapStore})
        params.api.setEditCellValue({...params, value})
      }}
      inputValue={newValue}
      onInputChange={(_, value) => setNewValue(value)}
      renderInput={params => <TextField {...params} size="small" label="Coarse Senses"></TextField>}
      filterSelectedOptions
      selectOnFocus
      clearOnEscape
      handleHomeEndKeys
      fullWidth
      freeSolo
    ></Autocomplete>
  )
}
export function EditSenseMap() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const {senseMap, senseMapOptions, synsetInfo, SenseLookup} = useContext(ResourceContext)
  const mapOptions = {store: senseMapOptions.store}
  const setSenseMap = useContext(SenseMapSetter)
  const coarseLabels = useMemo(() => {
    const out: Set<string> = new Set()
    Object.values(senseMap).forEach(coarses => coarses.forEach(l => l && out.add(l)))
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
                const {newMap} = parseMapId(params.id as string, senseMap)
                setSenseMap(newMap, mapOptions)
              }}
            >
              <RemoveCircleOutline sx={{fontSize: '.9em'}} />
            </IconButton>
          )
        },
      },
      {
        field: 'fine',
        headerName: 'Fine',
        width: 180,
        hideable: false,
        editable: true,
        renderEditCell: (params: GridRenderEditCellParams) => {
          return (
            <SenseSelector
              selected={[params.value]}
              setSelected={selected => {
                const {newMap, coarse} = parseMapId(params.id as string, senseMap)
                const newFine = selected[0]
                if (newFine in newMap) {
                  newMap[newFine].push(coarse)
                } else {
                  newMap[newFine] = [coarse]
                }
                setSenseMap(newMap, mapOptions)
              }}
              multi={false}
              useNLTK={useNLTK}
              editCell={params.api.setEditCellValue}
              params={params}
            />
          )
        },
      },
      {
        field: 'coarse',
        headerName: 'Coarse',
        width: 125,
        hideable: false,
        editable: true,
        renderEditCell: (params: GridRenderEditCellParams) => {
          return (
            <CoarseLabelEdit
              params={params}
              labels={coarseLabels}
              senseMap={senseMap}
              senseMapStore={senseMapOptions.store}
              updateSenseMap={setSenseMap}
            />
          )
        },
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
        if (info) {
          coarses.forEach(coarse => {
            out.push({
              id: fine + '||' + coarse + '||' + index,
              fine: useNLTK ? info.nltk_id : fine,
              definition: info.definition,
              coarse,
              info,
            })
          })
        }
      })
    }
    return out
  }, [senseMap, synsetInfo, useNLTK])
  return (
    <>
      <Button variant="outlined" aria-label="edit coarse sense map" onClick={toggleMenu}>
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
              slots={{toolbar: () => <GridToolbarQuickFilter />}}
            />
            <AddSenseMapPair coarseLabels={coarseLabels} useNLTK={useNLTK} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}
