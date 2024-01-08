import {Close} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Dialog,
  FormControlLabel,
  IconButton,
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
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {useContext, useEffect, useReducer, useState} from 'react'
import {AllCategories, BuildContext} from './building'
import {getProcessedTerm} from './processTerms'
import {ResourceContext} from './resources'
import {Results} from './analysisResults'
import type {FixedTerm} from './term'

export type TermEntry = {host?: string; term: string; categories: {[index: string]: number}; processed: FixedTerm}

export type ProcessOptions = {
  include_fuzzy: boolean
}
export type PlotOptions = {
  use_gl: boolean
  layout: 'none' | 'force' | 'circular'
}
const plotOptions: PlotOptions = {
  use_gl: false,
  layout: 'force',
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
  const data = useContext(ResourceContext)
  const dict = useContext(BuildContext)
  const categories = useContext(AllCategories)

  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [plotOpts, setPlotOpts] = useReducer(updateOptions<PlotOptions>, plotOptions)
  const [procOpts, setProcOpts] = useReducer(updateOptions<ProcessOptions>, processOptions)

  const [selected, setSelected] = useState<string[]>([])
  useEffect(() => {
    setSelected(selected.filter(cat => categories.includes(cat)))
  }, [categories])
  const [presentCats, setPresentCats] = useState<string[]>([])
  const [termEntries, setTermEntries] = useState<TermEntry[]>([])
  const nCats = categories.length
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
                    <List dense sx={{overflowY: 'auto', maxHeight: '200px'}}>
                      {categories.map(cat => (
                        <ListItem key={cat} disablePadding disableGutters>
                          <ListItemButton
                            aria-label="delete category"
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
                            <ListItemText primary={cat}></ListItemText>
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
                  <Tooltip title="Use WebGL for plotting." placement="right">
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
                  {plotOpts.use_gl ? (
                    <></>
                  ) : (
                    <Select
                      value={plotOpts.layout || 'force'}
                      onChange={(e: SelectChangeEvent) => {
                        setPlotOpts({key: 'layout', value: e.target.value})
                      }}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="force">Force</MenuItem>
                      <MenuItem value="circular">Circular</MenuItem>
                    </Select>
                  )}
                </Stack>
              </CardContent>
              <CardActions sx={{justifyContent: 'space-between'}}>
                <Button onClick={toggleMenu}>Close</Button>
                <Button
                  sx={{ml: 'auto'}}
                  variant="contained"
                  disabled={!!nCats && !selected.length}
                  onClick={() => {
                    const presentCategories: Set<string> = new Set()
                    const entries: TermEntry[] = []
                    const entered: {[index: string]: boolean} = {}
                    Object.keys(dict).forEach(term => {
                      let ncats = 0
                      const categories: {[index: string]: number} = {}
                      const fullCats = dict[term].categories
                      Object.keys(fullCats).forEach(cat => {
                        if (selected.includes(cat)) {
                          categories[cat] = fullCats[cat]
                          ncats++
                          presentCategories.add(cat)
                        }
                      })
                      if (!nCats || ncats) {
                        const processed = getProcessedTerm(term, data, dict)
                        if (processed.type === 'fixed') {
                          if (!(term in entered)) {
                            entered[term] = true
                            entries.push({term, categories, processed})
                          }
                        } else if (procOpts.include_fuzzy) {
                          processed.matches.forEach(match => {
                            if (!(match in dict) && !(match in entered)) {
                              entered[match] = true
                              entries.push({
                                host: term,
                                term: match,
                                categories,
                                processed: getProcessedTerm(match, data) as FixedTerm,
                              })
                            }
                          })
                        }
                      }
                    })
                    setPresentCats(Array.from(presentCategories))
                    setTermEntries(entries)
                  }}
                >
                  Process
                </Button>
              </CardActions>
            </Card>
            <Results terms={termEntries} categories={presentCats} options={procOpts} plotOptions={plotOpts} />
          </Stack>
        </Dialog>
      )}
    </>
  )
}
