import {Close} from '@mui/icons-material'
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  IconButton,
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
import {ChangeEvent, useContext, useEffect, useMemo, useReducer, useState} from 'react'
import {AllCategories, BuildContext, NumberObject} from './building'
import {Results} from './analysisResults'
import type {FixedTerm} from './term'
import {timers} from './addedTerms'

export type TermEntry = {host?: string; term: string; categories: {[index: string]: number}; processed: FixedTerm}

export type ProcessOptions = {
  include_fuzzy: boolean
  dense: boolean
  min_sim: number
}
export type PlotOptions = {
  graph: boolean
  layout: 'none' | 'force' | 'forceAtlas2' | 'circular'
  size_by_value: boolean
  hide_zeros: boolean
  label_threshold: number
  repulsion: number
  gravity: number
  edge_length: number
}
const plotOptions: PlotOptions = {
  graph: true,
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
  const categories = useContext(AllCategories)

  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => {
    clearTimeout(timers.comparisons)
    setMenuOpen(!menuOpen)
  }
  const [plotOpts, setPlotOpts] = useReducer(updateOptions<PlotOptions>, plotOptions)
  const [procOpts, setProcOpts] = useReducer(updateOptions<ProcessOptions>, processOptions)

  const [selected, setSelected] = useState<string[]>([])
  useEffect(() => {
    setSelected(selected.filter(cat => categories.includes(cat)))
  }, [categories])
  const nCats = categories.length
  const catCount = useMemo(() => {
    const counts: NumberObject = {}
    Object.values(dict).forEach(entry => {
      Object.keys(entry.categories).forEach(cat => {
        if (cat in counts) {
          counts[cat]++
        } else {
          counts[cat] = 1
        }
      })
    })
    return counts
  }, [dict])
  return (
    <>
      <Button variant="outlined" onClick={toggleMenu}>
        Analyze
      </Button>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={toggleMenu} fullScreen>
          <IconButton
            aria-label="close analysis menu"
            onClick={toggleMenu}
            sx={{
              position: 'absolute',
              right: 8,
              top: 12,
              zIndex: 1,
            }}
            className="close-button"
          >
            <Close />
          </IconButton>
          <Stack direction="row" sx={{height: '100%'}}>
            <Card
              sx={{p: 0, minWidth: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}
            >
              <CardContent sx={{p: 1}}>
                <Typography variant="h6">Process Options</Typography>
                <Typography>Categories</Typography>
                {nCats ? (
                  <>
                    <List dense sx={{overflowY: 'auto', maxHeight: '300px'}}>
                      {categories.map(cat => (
                        <ListItem key={cat} disablePadding disableGutters>
                          <ListItemButton
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
                            <ListItemText primary={cat} secondary={catCount[cat] + ' terms'}></ListItemText>
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
                        {selected.length + ' / ' + nCats + ' selected'}
                      </Typography>
                    </Toolbar>
                  </>
                ) : (
                  <Typography textAlign="center">None</Typography>
                )}
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
                      label="Include Secondary"
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProcOpts({key: 'min_sim', value: e.target.value})
                      }
                    ></TextField>
                  </Tooltip>
                </Stack>
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
                  {/* <Tooltip title="Visualize as a connected graph, rather than a scatter plot." placement="right">
                    <FormControlLabel
                      label="As Graph"
                      labelPlacement="start"
                      control={
                        <Switch
                          size="small"
                          checked={plotOpts.graph}
                          onChange={() => setPlotOpts({key: 'graph', value: !plotOpts.graph})}
                        />
                      }
                    />
                  </Tooltip> */}
                  {plotOpts.graph ? (
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
                          <MenuItem value="none">Connections * Random</MenuItem>
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
              </CardContent>
            </Card>
            <Results selectedCategories={selected} options={procOpts} plotOptions={plotOpts} />
          </Stack>
        </Dialog>
      )}
    </>
  )
}
