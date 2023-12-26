import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  styled,
  useTheme,
} from '@mui/material'
import {ChangeEvent, useContext, useMemo, useState} from 'react'
import {Dict, Dictionaries, DictionaryName, NumberObject} from './building'

const HiddenA = styled('a')({
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

type Formats = 'csv' | 'json' | 'dic'
type JSONTypes = 'weighted' | 'unweighted' | 'full'
function exportDict(dict: Dict, format: Formats, sep: string, jsonType: JSONTypes) {
  switch (format) {
    case 'csv':
      const terms = Object.keys(dict)
      const categories: Set<string> = new Set()
      terms.forEach(term => {
        const cats = dict[term].categories
        if (cats) Object.keys(cats).forEach(cat => categories.add(cat))
      })
      const catArray = Array.from(categories)
      const catMap = new Map(catArray.map((cat, index) => [index, cat]))
      return (
        '"term"' +
        sep +
        '"' +
        catArray.join('"' + sep + '"') +
        '"\n' +
        terms
          .map(term => {
            const cats = dict[term].categories
            let row = '"' + term + '"'
            catMap.forEach(cat => {
              row += sep + (cat in cats ? cats[cat] : '')
            })
            return row
          })
          .join('\n')
      )
    case 'dic':
      const allCats: NumberObject = {}
      let nCats = 0
      let body = ''
      Object.keys(dict).forEach(term => {
        const cats = dict[term].categories
        if (cats) {
          const line: (string | number)[] = [term]
          Object.keys(cats).forEach(cat => {
            if (!(cat in allCats)) allCats[cat] = ++nCats
            line.push(allCats[cat])
          })
          body += '\n' + line.join('\t')
        }
      })
      return (
        '%\n' +
        Object.keys(allCats)
          .map(cat => allCats[cat] + '\t' + cat)
          .join('\n') +
        '\n%' +
        body
      )
    case 'json':
      if (jsonType === 'full') return JSON.stringify(dict, void 0, 2)
      const temp: {[index: string]: {[index: string]: number}} = {}
      Object.keys(dict).forEach(term => {
        const cats = dict[term].categories
        if (cats) {
          Object.keys(cats).forEach(cat => {
            if (!(cat in temp)) temp[cat] = {}
            temp[cat][term] = cats[cat]
          })
        }
      })
      if (jsonType === 'weighted') return JSON.stringify(temp, void 0, 2)
      const unweighted: {[index: string]: string[]} = {}
      Object.keys(temp).forEach(cat => {
        unweighted[cat] = Object.keys(temp[cat])
      })
      return JSON.stringify(unweighted, void 0, 2)
    default:
      return ''
  }
}

function exportName(name: string, format: string, sep: string) {
  return name + '.' + (format === 'csv' ? (sep === '\t' ? 'tsv' : sep === ',' ? 'csv' : 'txt') : format)
}
export function ExportMenu() {
  const theme = useTheme()
  const currentDictionary = useContext(DictionaryName)
  const dict = useContext(Dictionaries)[currentDictionary]
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [format, setFormat] = useState<Formats>('csv')
  const [sep, setSep] = useState(',')
  const [name, setName] = useState(currentDictionary)
  const [jsonType, setJsonType] = useState<JSONTypes>('unweighted')
  const content = useMemo(() => exportDict(dict, format, sep, jsonType), [dict, format, sep, jsonType])
  return (
    <>
      <Button variant="contained" onClick={toggleMenu}>
        Export
      </Button>
      <Dialog open={menuOpen} onClose={toggleMenu}>
        <DialogTitle>Export Dictionary</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={toggleMenu}
          sx={{
            position: 'absolute',
            right: 8,
            top: 12,
            color: theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
        <DialogContent sx={{p: 1}}>
          <Stack spacing={1}>
            <TextField
              size="small"
              label="name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value)
              }}
            />
            <textarea
              style={{
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                whiteSpace: 'nowrap',
                minWidth: '30em',
                minHeight: '20em',
              }}
              value={content}
              onChange={() => {}}
            ></textarea>
          </Stack>
        </DialogContent>
        <DialogActions sx={{justifyContent: 'space-between'}}>
          <Stack direction="row" spacing={1}>
            <FormControl>
              <InputLabel>Format</InputLabel>
              <Select
                label="Format"
                size="small"
                value={format as ''}
                onChange={(e: SelectChangeEvent<HTMLDivElement>) => {
                  setFormat(e.target.value as Formats)
                }}
              >
                <MenuItem value="dic">.dic</MenuItem>
                <MenuItem value="json">.json</MenuItem>
                <MenuItem value="csv">.csv</MenuItem>
              </Select>
            </FormControl>
            {format === 'csv' ? (
              <TextField
                sx={{maxWidth: '5em'}}
                size="small"
                label="Separator"
                value={sep}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSep(e.target.value)
                }}
              ></TextField>
            ) : (
              <></>
            )}{' '}
            {format === 'json' ? (
              <FormControl>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  size="small"
                  value={jsonType as ''}
                  onChange={(e: SelectChangeEvent<HTMLDivElement>) => {
                    setJsonType(e.target.value as JSONTypes)
                  }}
                >
                  <MenuItem value="weighted">Weighted</MenuItem>
                  <MenuItem value="unweighted">Unweighted</MenuItem>
                  <MenuItem value="full">Full</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <></>
            )}
          </Stack>
          <Button
            variant="contained"
            onClick={() => {
              if (name && content) {
                const a = document.createElement('a')
                a.setAttribute('href', URL.createObjectURL(new Blob([content], {type: 'text/plain'})))
                a.setAttribute('download', exportName(name, format, sep))
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
