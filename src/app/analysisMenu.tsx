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
}
export type PlotOptions = {
  use_gl: boolean
  layout: 'none' | 'force' | 'circular'
  size_by_value: boolean
  hide_zeros: boolean
  label_threshold: number
}
const plotOptions: PlotOptions = {
  use_gl: false,
  layout: 'force',
  size_by_value: true,
  hide_zeros: false,
  label_threshold: 0,
}
const processOptions: ProcessOptions = {
  include_fuzzy: false,
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
                <Stack>
                  <Tooltip title="Include all matches to fuzzy terms in the comparison." placement="right">
                    <FormControlLabel
                      label="Fuzzy Matches"
                      labelPlacement="start"
                      control={
                        <Switch
                          checked={procOpts.include_fuzzy}
                          onChange={() => setProcOpts({key: 'include_fuzzy', value: !procOpts.include_fuzzy})}
                        />
                      }
                    />
                  </Tooltip>
                </Stack>
                <Typography variant="h6">Plot Options</Typography>
                <Stack>
                  <Tooltip
                    title="Use the Web Graphics Library for plotting; can better handle many terms at the cost of some functionality."
                    placement="right"
                  >
                    <FormControlLabel
                      label="WebGL"
                      labelPlacement="start"
                      control={
                        <Switch
                          checked={plotOpts.use_gl}
                          onChange={() => setPlotOpts({key: 'use_gl', value: !plotOpts.use_gl})}
                        />
                      }
                    />
                  </Tooltip>
                  <FormControlLabel
                    label="Hide Zeros"
                    labelPlacement="start"
                    control={
                      <Switch
                        checked={plotOpts.hide_zeros}
                        onChange={() => setPlotOpts({key: 'hide_zeros', value: !plotOpts.hide_zeros})}
                      />
                    }
                  />
                  <Tooltip title="Will not show labels for nodes with values lower than this." placement="right">
                    <TextField
                      value={plotOpts.label_threshold}
                      type="number"
                      size="small"
                      label="Label Threshold Value"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setPlotOpts({key: 'label_threshold', value: e.target.value})
                      }
                    ></TextField>
                  </Tooltip>
                  <FormControlLabel
                    label="Size By Value"
                    labelPlacement="start"
                    control={
                      <Switch
                        checked={plotOpts.size_by_value}
                        onChange={() => setPlotOpts({key: 'size_by_value', value: !plotOpts.size_by_value})}
                      />
                    }
                  />
                  {plotOpts.use_gl ? (
                    <></>
                  ) : (
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
                        <MenuItem value="none">Connections * Random</MenuItem>
                        <MenuItem value="force">Force</MenuItem>
                        <MenuItem value="circular">Circular</MenuItem>
                      </Select>
                    </FormControl>
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
