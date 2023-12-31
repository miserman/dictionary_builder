import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  styled,
  useTheme,
} from '@mui/material'
import {type ChangeEvent, type DragEvent, type KeyboardEvent, useContext, useState} from 'react'
import {type Dict, ManageDictionaries, type NumberObject} from './building'
import {fileBaseName} from './utils'

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

const tab = /\\t/
const padding = /^\s+|\s+$/g
const quote_padding = /^["\s]+|["\s]+$/g
const dic_seps = /\t+/g
function makeDictEntry(cats: NumberObject, sense?: string) {
  return {
    added: Date.now(),
    type: 'fixed' as const,
    categories: cats,
    sense: sense || '',
  }
}
function parseDict(raw: string) {
  let parsed: Dict = {}
  if (raw) {
    try {
      if (raw[0] === '%') {
        // assumed to be dic format
        const lines = raw.split('\n')
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
              const term = parts.splice(0, 1)[0].toLowerCase()
              if (term) {
                const cats: NumberObject = {}
                parts.forEach(index => {
                  if (index in categories) cats[categories[index]] = 1
                })
                parsed[term] = makeDictEntry(cats)
              }
            }
          }
        }
      } else if (raw[0] === '{') {
        // assumed to be JSON
        const initial = JSON.parse(raw)
        Object.keys(initial).forEach(cat => {
          if (cat) {
            const terms = initial[cat]
            if (Array.isArray(terms)) {
              terms.forEach(term => {
                term = term.toLowerCase()
                if (term) {
                  if (term in parsed) {
                    parsed[term].categories[cat] = 1
                  } else {
                    parsed[term] = makeDictEntry({[cat]: 1})
                  }
                }
              })
            } else {
              Object.keys(terms).forEach(term => {
                term = term.toLowerCase()
                if (term) {
                  if (term in parsed) {
                    parsed[term].categories[cat] = terms[term]
                  } else {
                    parsed[term] = makeDictEntry({[cat]: terms[term]})
                  }
                }
              })
            }
          }
        })
      } else {
        // assumed to be some sort of tabular format
        const lines = raw.split('\n')
        const sep = tab.test(lines[0]) ? '\\t' : ','
        const categories = lines
          .splice(0, 1)[0]
          .split(sep)
          .map(cat => cat.replace(quote_padding, ''))
        categories.splice(0, 1)
        lines.forEach(l => {
          const weights = l.split(sep)
          const term = weights.splice(0, 1)[0].toLowerCase().replace(quote_padding, '')
          if (term) {
            const cats: NumberObject = {}
            weights.forEach((weight, index) => {
              if (weight && categories[index]) cats[categories[index]] = +weight
            })
            parsed[term] = makeDictEntry(cats)
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
  const [rawContent, setRawContent] = useState('')
  const clear = () => {
    setName('')
    setRawContent('')
  }
  const addDict = () => {
    if (name) {
      const dict = parseDict(rawContent)
      manageDictionaries({type: 'add', name, dict})
      clear()
      toggleMenu()
    }
  }
  return (
    <>
      <Button variant="contained" onClick={toggleMenu}>
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
              label="name"
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
            <textarea
              style={{
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                whiteSpace: 'pre',
                minWidth: '30em',
                minHeight: '20em',
              }}
              value={rawContent}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                setRawContent(e.target.value)
              }}
              placeholder="drag and drop a file, or enter content directly"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{justifyContent: 'space-between'}}>
          <Stack direction="row" spacing={1}>
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
            <Button onClick={clear}>clear</Button>
          </Stack>
          <Button variant="contained" onClick={addDict}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
