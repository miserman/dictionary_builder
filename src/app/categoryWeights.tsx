import {Close} from '@mui/icons-material'
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {type ChangeEvent, type KeyboardEvent, useContext, useMemo, useState} from 'react'
import {BuildContext, type DictionaryActions, type NumberObject} from './building'
import {ResourceContext} from './resources'
import {globToRegex, special, wildcards} from './utils'
import {extractMatches, getProcessedTerm} from './processTerms'
import {getIntersects} from './analysisResults'
import type {FixedTerm, NetworkLookup} from './term'

export function CategoryWeights({
  name,
  current,
  edit,
}: {
  name: string
  current: NumberObject
  edit: (action: DictionaryActions) => void
}) {
  const data = useContext(ResourceContext)
  const {terms, collapsedTerms, termLookup} = data
  const dict = useContext(BuildContext)
  const dictTerms = useMemo(() => {
    const out: {[index: string]: boolean} = {}
    Object.keys(dict).forEach(id => (out[dict[id].term || id] = true))
    return out
  }, [dict])
  const dictTermsCollapsed = useMemo(() => {
    return {all: ';;' + Object.keys(dictTerms).join(';;') + ';;'}
  }, [dictTerms])

  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const [toAllTerms, setToAllTerms] = useState(true)
  const [similarityBased, setSimilarityBased] = useState(true)
  const [scale, setScale] = useState(true)
  const [anyTerms, setAnyTerms] = useState(true)
  const [value, setValue] = useState(1)
  const [inputTerm, setInputTerm] = useState('')
  const [termSuggestions, setTermSuggestions] = useState<string[]>([])
  const [coreTerms, setCoreTerms] = useState<string[]>([])
  const isValidTerm = anyTerms
    ? (term: string) => termLookup && term in termLookup
    : (term: string) => term in dictTerms
  const addCore = (term: string) => {
    if (term && !coreTerms.includes(term) && isValidTerm(term)) {
      setCoreTerms([...coreTerms, term])
    }
  }
  return (
    <>
      <Button onClick={toggleMenu} fullWidth>
        Fill Weights
      </Button>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={toggleMenu}>
          <DialogTitle>Category Weight Filler</DialogTitle>
          <IconButton
            aria-label="close category weight filler"
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
          <DialogContent sx={{minWidth: '300px', minHeight: '300px', p: 1}}>
            <Stack spacing={2}>
              <Tooltip
                title={
                  similarityBased
                    ? 'Weights will be similarity to the specified core terms'
                    : 'Will use the specified value as the weight of all terms'
                }
                placement="right"
              >
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={similarityBased}
                      onChange={() => setSimilarityBased(!similarityBased)}
                    ></Switch>
                  }
                  label={<Typography variant="caption">Similarity-based</Typography>}
                  labelPlacement="start"
                />
              </Tooltip>
              {similarityBased && terms ? (
                <Stack>
                  <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={termSuggestions}
                    onKeyUp={(e: KeyboardEvent<HTMLDivElement>) => {
                      const inputValue = 'value' in e.target ? (e.target.value as string) : ''
                      if (e.code === 'Enter' && inputTerm && (!inputValue || inputValue === inputTerm)) {
                        addCore(inputValue)
                        return
                      }
                      if (terms) {
                        const suggestions: string[] = []
                        if (inputValue && collapsedTerms) {
                          let ex: RegExp | undefined
                          try {
                            ex = new RegExp(
                              wildcards.test(inputValue) ? globToRegex(inputValue) : ';' + inputValue + '[^;]*;',
                              'g'
                            )
                          } catch {
                            ex = new RegExp(';' + inputValue.replace(special, '\\%&') + ';', 'g')
                          }
                          extractMatches('', ex, anyTerms ? collapsedTerms : dictTermsCollapsed, suggestions, 100)
                        }
                        coreTerms.forEach(term => {
                          if (!suggestions.includes(term)) suggestions.push(term)
                        })
                        setTermSuggestions(suggestions)
                      }
                    }}
                    value={coreTerms}
                    onChange={(e, value) => {
                      if (Math.abs(value.length - coreTerms.length) === 1) {
                        setCoreTerms([...value])
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
                        value={inputTerm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          if (!coreTerms.includes(e.target.value)) setInputTerm(e.target.value)
                        }}
                      ></TextField>
                    )}
                    filterOptions={x => x}
                    noOptionsText="No matches"
                    filterSelectedOptions
                    selectOnFocus
                    clearOnBlur
                    clearOnEscape
                    handleHomeEndKeys
                    fullWidth
                  ></Autocomplete>
                  <Toolbar sx={{m: 0, justifyContent: 'space-between'}}>
                    <Button
                      onClick={() => {
                        setTermSuggestions([])
                        setCoreTerms([])
                      }}
                    >
                      Clear
                    </Button>
                    <Tooltip
                      title={
                        anyTerms
                          ? 'Allowing any terms from the full list on record'
                          : 'Allowing only terms included in the category'
                      }
                      placement="top"
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={anyTerms}
                            onChange={() => {
                              setTermSuggestions([])
                              setAnyTerms(!anyTerms)
                            }}
                          ></Switch>
                        }
                        label={<Typography variant="caption">Allow any terms</Typography>}
                        labelPlacement="top"
                      />
                    </Tooltip>
                    <Tooltip
                      title={
                        scale
                          ? 'Will rescaling similarities to be between 0 and 1'
                          : 'Will display raw similarity values'
                      }
                      placement="top"
                    >
                      <FormControlLabel
                        control={<Switch size="small" checked={scale} onChange={() => setScale(!scale)}></Switch>}
                        label={<Typography variant="caption">Scale</Typography>}
                        labelPlacement="top"
                      />
                    </Tooltip>
                  </Toolbar>
                </Stack>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label="Value"
                  value={value}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(+e.target.value)}
                />
              )}
              <Tooltip
                title={
                  toAllTerms
                    ? 'Will apply weight to all terms in the dictionary'
                    : 'Will apply weight only to terms with weight in the current category'
                }
                placement="right"
              >
                <FormControlLabel
                  control={
                    <Switch size="small" checked={toAllTerms} onChange={() => setToAllTerms(!toAllTerms)}></Switch>
                  }
                  label={<Typography variant="caption">Apply to all terms</Typography>}
                  labelPlacement="start"
                />
              </Tooltip>
            </Stack>
          </DialogContent>
          <DialogActions sx={{justifyContent: 'space-between'}}>
            <Button onClick={toggleMenu}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                const reWeighted: NumberObject = {}
                if (similarityBased) {
                  const processedCores: Map<string, NetworkLookup> = new Map()
                  coreTerms.forEach(term => {
                    const processed = getProcessedTerm(term, data, dict, true)
                    if (processed.type === 'fixed') {
                      processedCores.set(term, processed.lookup)
                    } else {
                      processed.matches.forEach(match => {
                        processedCores.set(match, (getProcessedTerm(match, data, dict, true) as FixedTerm).lookup)
                      })
                    }
                  })
                  const range = [Infinity, -Infinity]
                  Object.keys(toAllTerms ? dictTerms : current).forEach(term => {
                    let totalSim = 0
                    processedCores.forEach(processedCoreTerm => {
                      const processed = getProcessedTerm(term, data, dict)
                      if (processed.type === 'fixed') {
                        const sim = getIntersects(term, processedCoreTerm)
                        totalSim +=
                          1 * (sim.lemma || sim.related || sim.synset) +
                          0.1 * (sim.lemma_related || sim.lemma_synset) +
                          0.01 * (sim.related_lemma || sim.related_related || sim.related_synset) +
                          0.001 * (sim.synset_lemma || sim.synset_related || sim.synset_synset)
                      } else {
                        processed.matches.forEach(match => {
                          const sim = getIntersects(match, processedCoreTerm)
                          totalSim +=
                            1 * (sim.lemma || sim.related || sim.synset) +
                            0.1 * (sim.lemma_related || sim.lemma_synset) +
                            0.01 * (sim.related_lemma || sim.related_related || sim.related_synset) +
                            0.001 * (sim.synset_lemma || sim.synset_related || sim.synset_synset)
                        })
                      }
                    })
                    if (scale) {
                      if (range[0] > totalSim) range[0] = totalSim
                      if (range[1] < totalSim) range[1] = totalSim
                    }
                    reWeighted[term] = totalSim
                  })
                  if (scale)
                    Object.keys(reWeighted).forEach(
                      term => (reWeighted[term] = (reWeighted[term] - range[0]) / (range[1] - range[0]))
                    )
                } else {
                  if (toAllTerms) {
                    Object.keys(dict).forEach(term => (reWeighted[term] = value))
                  } else {
                    Object.keys(current).forEach(term => {
                      if (current[term]) reWeighted[term] = value
                    })
                  }
                }
                const subset = toAllTerms ? dict : current
                const appliedWeights: NumberObject = {}
                Object.keys(subset).forEach(id => {
                  const term = dict[id].term || id
                  if (term in reWeighted) appliedWeights[id] = reWeighted[term]
                })
                edit({type: 'reweight_category', name, weights: appliedWeights})
                toggleMenu()
              }}
            >
              Fill
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
