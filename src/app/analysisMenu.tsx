import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {type ChangeEvent, useContext, useEffect, useMemo, useReducer, useState} from 'react'
import {AllCategories, BuildContext, type NumberObject} from './building'
import {Results} from './analysisResults'
import type {FixedTerm} from './term'

export type TermEntry = {host?: string; term: string; categories: {[index: string]: number}; processed: FixedTerm}

export type ProcessOptions = {
  include_fuzzy: boolean
  dense: boolean
  min_sim: number
}
export type PlotOptions = {
  type: 'graph' | 'scatter' | 'distribution'
  layout: 'none' | 'force' | 'forceAtlas2' | 'circular'
  size_by_value: boolean
  hide_zeros: boolean
  label_threshold: number
  repulsion: number
  gravity: number
  edge_length: number
}
const plotOptions: PlotOptions = {
  type: 'graph',
  layout: 'force',
  size_by_value: true,
  hide_zeros: false,
  label_threshold: 0,
  repulsion: 100,
  gravity: 0.1,
  edge_length: 40,
}
const processOptions: ProcessOptions = {
  include_fuzzy: false,
  dense: false,
  min_sim: 0.001,
}
function updateOptions<T>(state: T, action: {key: keyof T; value: boolean | string | number}) {
  const newState = {...state}
  const original = state[action.key]
  newState[action.key] = action.value as typeof original
  return newState
}
export function AnalyzeMenu() {
  const dict = useContext(BuildContext)
  const allCategories = useContext(AllCategories)
  const categories = useMemo(() => {
    const out = [...allCategories]
    if (!out.includes('no categories')) out.push('no categories')
    return out
  }, [allCategories])

  const [plotOpts, setPlotOpts] = useReducer(updateOptions<PlotOptions>, plotOptions)
  const [procOpts, setProcOpts] = useReducer(updateOptions<ProcessOptions>, processOptions)

  const [selected, setSelected] = useState<string[]>([])
  useEffect(() => {
    setSelected(selected.filter(cat => categories.includes(cat)))
  }, [categories])
  const {allTerms, catCounts} = useMemo(() => {
    const catCounts: NumberObject = {}
    const allTerms = new Map(
      Object.keys(dict).map(term => {
        const termCats = Object.keys(dict[term].categories)
        ;(termCats.length ? termCats : ['no categories']).forEach(cat => {
          if (cat in catCounts) {
            catCounts[cat]++
          } else {
            catCounts[cat] = 1
          }
        })
        return [term, dict[term]]
      })
    )
    return {catCounts, allTerms}
  }, [dict])
  return (
    <Stack direction="row" sx={{height: '100%'}}>
      <Box
        sx={{
          height: '100%',
          minWidth: '250px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{pl: 1, pr: 1, height: '100%'}}>
          <Box sx={{maxHeight: '60%', overflowY: 'auto'}}>
            <Typography variant="h6">Terms</Typography>
            <List dense sx={{overflowY: 'auto', maxHeight: '300px', p: 0}}>
              {Object.keys(catCounts).map(cat => (
                <ListItem key={cat} disablePadding disableGutters>
                  <ListItemButton
                    disableGutters
                    aria-label="toggle category"
                    onClick={() => {
                      const newSelection = [...selected]
                      const index = newSelection.indexOf(cat)
                      if (index === -1) {
                        newSelection.push(cat)
                      } else {
                        newSelection.splice(index, 1)
                      }
                      setSelected(newSelection)
                    }}
                  >
                    <ListItemIcon sx={{minWidth: '35px'}}>
                      <Checkbox sx={{p: 0}} checked={selected.includes(cat)} />
                    </ListItemIcon>
                    <ListItemText sx={{m: 0}} primary={cat} secondary={catCounts[cat] + ' terms'}></ListItemText>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Toolbar sx={{justifyContent: 'space-between'}} variant="dense" disableGutters>
              <Stack direction="row">
                <Button
                  size="small"
                  sx={{minWidth: '1px'}}
                  onClick={() => {
                    setSelected([...categories])
                  }}
                >
                  All
                </Button>
                <Button
                  size="small"
                  sx={{minWidth: '1px'}}
                  onClick={() => {
                    setSelected([])
                  }}
                >
                  None
                </Button>
              </Stack>
              <Typography sx={{pr: 1, whiteSpace: 'nowrap'}}>
                {selected.length + ' / ' + categories.length + ' selected'}
              </Typography>
            </Toolbar>
            <Stack spacing={2}>
              <Tooltip title="Include all matches to fuzzy terms in the comparison." placement="right">
                <FormControlLabel
                  label="Fuzzy Matches"
                  labelPlacement="start"
                  control={
                    <Switch
                      size="small"
                      checked={procOpts.include_fuzzy}
                      onChange={() => setProcOpts({key: 'include_fuzzy', value: !procOpts.include_fuzzy})}
                    />
                  }
                />
              </Tooltip>
              <Tooltip
                title="Include second-order term relationships in similarity calculations, resulting in a denser network."
                placement="right"
              >
                <FormControlLabel
                  label="Secondary Connections"
                  labelPlacement="start"
                  control={
                    <Switch
                      size="small"
                      checked={procOpts.dense}
                      onChange={() => setProcOpts({key: 'dense', value: !procOpts.dense})}
                    />
                  }
                />
              </Tooltip>
              <Tooltip
                title="Will consider nodes with similarity equal to or less than this as unconnected."
                placement="right"
              >
                <TextField
                  value={procOpts.min_sim}
                  type="number"
                  size="small"
                  label="Similarity Threshold"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setProcOpts({key: 'min_sim', value: e.target.value})}
                ></TextField>
              </Tooltip>
            </Stack>
          </Box>
          <Box sx={{maxHeight: '40%', overflowY: 'auto'}}>
            <Typography variant="h6" sx={{mt: 2}}>
              Plot Options
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                label="Hide Zeros"
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={plotOpts.hide_zeros}
                    onChange={() => setPlotOpts({key: 'hide_zeros', value: !plotOpts.hide_zeros})}
                  />
                }
              />
              <FormControlLabel
                label="Size By Value"
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={plotOpts.size_by_value}
                    onChange={() => setPlotOpts({key: 'size_by_value', value: !plotOpts.size_by_value})}
                  />
                }
              />
              <Tooltip title="Will not show labels for nodes with values lower than this." placement="right">
                <TextField
                  value={plotOpts.label_threshold}
                  type="number"
                  size="small"
                  label="Label Threshold"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPlotOpts({key: 'label_threshold', value: e.target.value})
                  }
                ></TextField>
              </Tooltip>
              {/* <FormControl fullWidth>
                      <InputLabel id="plot_type_select">Type</InputLabel>
                      <Select
                        labelId="plot_type_select"
                        label="Type"
                        size="small"
                        value={plotOpts.type || 'graph'}
                        onChange={(e: SelectChangeEvent) => {
                          setPlotOpts({key: 'type', value: e.target.value})
                        }}
                      >
                        <MenuItem value="graph">Graph</MenuItem>
                        <MenuItem value="distribution">Distribution</MenuItem>
                      </Select>
                    </FormControl> */}
              {plotOpts.type === 'graph' ? (
                <>
                  <FormControl fullWidth>
                    <InputLabel id="graph_layout_select">Layout</InputLabel>
                    <Select
                      labelId="graph_layout_select"
                      label="Layout"
                      size="small"
                      value={plotOpts.layout || 'force'}
                      onChange={(e: SelectChangeEvent) => {
                        setPlotOpts({key: 'layout', value: e.target.value})
                      }}
                    >
                      <ListSubheader>Canvas</ListSubheader>
                      <MenuItem value="none">Random</MenuItem>
                      <MenuItem value="circular">Circular</MenuItem>
                      <MenuItem value="force">Force</MenuItem>
                      <ListSubheader>WebGL</ListSubheader>
                      <MenuItem value="forceAtlas2">ForceAtlas2</MenuItem>
                    </Select>
                  </FormControl>
                  {plotOpts.layout === 'force' ? (
                    <>
                      <Tooltip title="Repulsion factor between nodes." placement="right">
                        <TextField
                          value={plotOpts.repulsion}
                          type="number"
                          size="small"
                          label="Repulsion"
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setPlotOpts({key: 'repulsion', value: e.target.value})
                          }
                        ></TextField>
                      </Tooltip>
                      <Tooltip title="Nodes' strength of attraction to the center." placement="right">
                        <TextField
                          value={plotOpts.gravity}
                          type="number"
                          size="small"
                          label="Gravity"
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setPlotOpts({key: 'gravity', value: e.target.value})
                          }
                        ></TextField>
                      </Tooltip>
                      <Tooltip title="Base distance between nodes." placement="right">
                        <TextField
                          value={plotOpts.edge_length}
                          type="number"
                          size="small"
                          label="Edge Length"
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setPlotOpts({key: 'edge_length', value: e.target.value})
                          }
                        ></TextField>
                      </Tooltip>
                    </>
                  ) : (
                    <></>
                  )}
                </>
              ) : (
                <></>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
      <Results
        allTerms={allTerms}
        catCounts={catCounts}
        selectedCategories={selected}
        options={procOpts}
        plotOptions={plotOpts}
      />
    </Stack>
  )
}
