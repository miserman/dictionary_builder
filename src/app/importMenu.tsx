import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  styled,
  useTheme,
} from '@mui/material'
import {type ChangeEvent, type DragEvent, type KeyboardEvent, useContext, useState} from 'react'
import {type Dict, ManageDictionaries, type NumberObject} from './building'
import {fileBaseName, newline} from './utils'
import {CopyDictionary} from './copyDictionary'

const HiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const tab = /\t/
const dat = /\s\s/
const padding = /^\s+|\s+$/g
const quote_padding = /^["\s]+|["\s]+$/g
const dic_seps = /\s{2,}|\t+/g
const regex_open = /[[({]/
const regex_close = /[\])}]/
const regex_special = /([\[\]\(\)?^$.+])/
const senseSep = '@'
function containsRegex(term: string) {
  if (!regex_special.test(term)) return false
  const open = regex_open.test(term)
  const close = regex_close.test(term)
  return (open && close) || (!open && !close)
}
function makeDictEntry(term: string, cats: NumberObject, sense: string, detectRegex?: boolean) {
  return {
    added: Date.now(),
    type: (detectRegex && containsRegex(term) ? 'regex' : 'fixed') as 'fixed' | 'regex',
    categories: cats,
    sense: sense || '',
  }
}
function parseDict(raw: string, detectRegex: boolean) {
  let parsed: Dict = {}
  if (raw) {
    try {
      if (raw[0] === '%') {
        // assumed to be dic format
        const lines = raw.split(newline)
        const categories: {[index: string]: string} = {}
        const n = lines.length
        if (n > 1) {
          let i = 1
          for (i = 1; i < n; i++) {
            const line = lines[i].replace(padding, '')
            if (line === '%') break
            const parts = line.split(dic_seps)
            if (parts.length > 1 && parts[1]) {
              categories[parts[0]] = parts[1]
            }
          }
          for (i++; i < n; i++) {
            const line = lines[i].replace(padding, '')
            const parts = line.split(dic_seps)
            if (parts.length > 1) {
              const fullterm = parts.splice(0, 1)[0].toLowerCase()
              if (fullterm) {
                const cats: NumberObject = {}
                parts.forEach(index => {
                  if (index in categories) cats[categories[index]] = 1
                })
                const [term, sense] = fullterm.split(senseSep)
                parsed[term] = makeDictEntry(term, cats, sense, detectRegex)
              }
            }
          }
        }
      } else if (raw[0] === '{') {
        // assumed to be JSON
        const initial = JSON.parse(raw)
        const keys = Object.keys(initial)
        if (keys.length && 'type' in initial[keys[0]] && 'string' === typeof initial[keys[0]].type) {
          // assumed to be a full export
          return initial
        }
        keys.forEach(cat => {
          if (cat) {
            const terms = initial[cat]
            if (Array.isArray(terms)) {
              terms.forEach(fullterm => {
                if (fullterm) {
                  if (fullterm in parsed) {
                    parsed[fullterm].categories[cat] = 1
                  } else {
                    const [term, sense] = fullterm.toLowerCase().split(senseSep)
                    parsed[fullterm] = makeDictEntry(term, {[cat]: 1}, sense, detectRegex)
                  }
                }
              })
            } else {
              Object.keys(terms).forEach(fullterm => {
                if (fullterm) {
                  if (fullterm in parsed) {
                    parsed[fullterm].categories[cat] = terms[fullterm]
                  } else {
                    const [term, sense] = fullterm.toLowerCase().split(senseSep)
                    parsed[fullterm] = makeDictEntry(term, {[cat]: terms[term]}, sense, detectRegex)
                  }
                }
              })
            }
          }
        })
      } else {
        // assumed to be some sort of tabular format
        const lines = raw.split(newline)
        const sep = tab.test(lines[0]) ? '\t' : dat.test(lines[0]) ? '  ' : ','
        const categories = lines
          .splice(0, 1)[0]
          .split(sep)
          .map(cat => cat.replace(quote_padding, ''))
        categories.splice(0, 1)
        const has_sense = categories[0] === 'term_sense'
        lines.forEach(l => {
          const weights = l.split(sep).map(entry => entry.replace(quote_padding, ''))
          const term = weights.splice(0, 1)[0].toLowerCase()
          if (term) {
            let sense = ''
            const cats: NumberObject = {}
            weights.forEach((weight, index) => {
              if (weight && categories[index]) {
                const value = +weight
                if (!sense && ((has_sense && index === 0) || isNaN(value))) {
                  sense = weight
                } else {
                  cats[categories[index]] = +weight
                }
              }
            })
            parsed[term] = makeDictEntry(term, cats, sense, detectRegex)
          }
        })
      }
    } catch {}
  }
  return parsed
}

export function ImportMenu() {
  const theme = useTheme()
  const manageDictionaries = useContext(ManageDictionaries)
  const [name, setName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [detectRegex, setDetectRegex] = useState(false)
  const [rawContent, setRawContent] = useState('')
  const clear = () => {
    setName('')
    setRawContent('')
  }
  const addDict = () => {
    if (name) {
      const dict = parseDict(rawContent, detectRegex)
      manageDictionaries({type: 'add', name, dict})
      clear()
      toggleMenu()
    }
  }
  return (
    <>
      <Button variant="outlined" onClick={toggleMenu}>
        New
      </Button>
      <Dialog
        open={menuOpen}
        onClose={toggleMenu}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0]
            const reader = new FileReader()
            reader.onload = () => {
              if (!name) setName(fileBaseName(file.name))
              setRawContent(reader.result as string)
            }
            reader.readAsText(file)
          }
        }}
      >
        <DialogTitle>Add Dictionary</DialogTitle>
        <IconButton
          aria-label="close import menu"
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
          <Stack spacing={1}>
            <TextField
              size="small"
              label="Name"
              value={name}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (name && e.code === 'Enter') {
                  addDict()
                }
              }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value)
              }}
            />
            <FormControl>
              <FormLabel sx={{fontSize: '.8em'}} htmlFor="import_content">
                Import Content
              </FormLabel>
              <textarea
                id="import_content"
                style={{
                  backgroundColor: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  whiteSpace: rawContent ? 'pre' : 'normal',
                  minWidth: '30em',
                  minHeight: '20em',
                }}
                value={rawContent}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setRawContent(e.target.value)
                }}
                placeholder="drag and drop a file, or enter content directly; see export menu for format examples"
              />
            </FormControl>
            <Tooltip title="Attempt to convert terms to regular expressions if they contain special RegEx characters.">
              <FormControlLabel
                label="Detect RegEx"
                labelPlacement="start"
                control={<Switch checked={detectRegex} onChange={() => setDetectRegex(!detectRegex)} />}
              />
            </Tooltip>
          </Stack>
        </DialogContent>
        <DialogActions sx={{justifyContent: 'space-between'}}>
          <Stack direction="row" spacing={1}>
            <CopyDictionary setName={setName} setContent={setRawContent} />
            <Tooltip title="select a file to import a dictionary from">
              <Button variant="outlined" component="label">
                File
                <HiddenInput
                  type="file"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length) {
                      const file = e.target.files[0]
                      const reader = new FileReader()
                      reader.onload = () => {
                        if (!name) setName(fileBaseName(file.name))
                        setRawContent(reader.result as string)
                      }
                      reader.readAsText(file)
                    }
                  }}
                />
              </Button>
            </Tooltip>
            <Tooltip title="clear current content">
              <Button onClick={clear}>clear</Button>
            </Tooltip>
          </Stack>
          <Button variant="contained" onClick={addDict}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
