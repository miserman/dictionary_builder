import {Close} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  useTheme,
} from '@mui/material'
import {type ChangeEvent, useContext, useMemo, useState} from 'react'
import {type Dict, Dictionaries, DictionaryName, type NumberObject} from './building'

type Formats = 'tabular' | 'json' | 'dic'
type DelTypes = 'csv' | 'tsv' | 'dat'
type JSONTypes = 'weighted' | 'unweighted' | 'full'
function getSepChar(type: DelTypes) {
  switch (type) {
    case 'csv':
      return ','
    case 'tsv':
      return '\t'
    default:
      return ' '
  }
}
function exportDict(dict: Dict, format: Formats, delType: DelTypes, jsonType: JSONTypes) {
  switch (format) {
    case 'tabular':
      const sep = getSepChar(delType)
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

function exportName(name: string, format: string, delType: string) {
  return name + '.' + (format === 'tabular' ? delType : format)
}
export function ExportMenu() {
  const theme = useTheme()
  const currentDictionary = useContext(DictionaryName)
  const dict = useContext(Dictionaries)[currentDictionary]
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [format, setFormat] = useState<Formats>('dic')
  const [delType, setDelType] = useState<DelTypes>('csv')
  const [name, setName] = useState(currentDictionary)
  const [jsonType, setJsonType] = useState<JSONTypes>('unweighted')
  const content = useMemo(
    () => (menuOpen ? exportDict(dict, format, delType, jsonType) : ''),
    [menuOpen, dict, format, delType, jsonType]
  )
  return (
    <>
      <Button variant="contained" onClick={toggleMenu}>
        Export
      </Button>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={toggleMenu}>
          <DialogTitle>Export Dictionary</DialogTitle>
          <IconButton
            aria-label="close export menu"
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
                label="Filename"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setName(e.target.value)
                }}
              />
              <FormControl>
                <FormLabel sx={{fontSize: '.8em'}} htmlFor="export_content">
                  Export Content
                </FormLabel>
                <textarea
                  id="export_content"
                  style={{
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    whiteSpace: 'pre',
                    minWidth: '30em',
                    minHeight: '20em',
                  }}
                  value={content}
                  onChange={() => {}}
                ></textarea>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{justifyContent: 'space-between'}}>
            <Stack direction="row" spacing={1}>
              <FormControl>
                <InputLabel id="export_format">Format</InputLabel>
                <Select
                  labelId="export_format"
                  label="Format"
                  size="small"
                  value={format as ''}
                  onChange={(e: SelectChangeEvent<HTMLDivElement>) => {
                    setFormat(e.target.value as Formats)
                  }}
                >
                  <MenuItem value="dic">DIC</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="tabular">Tabular</MenuItem>
                </Select>
              </FormControl>
              {format === 'tabular' ? (
                <FormControl>
                  <InputLabel id="export_separator">Type</InputLabel>
                  <Select
                    labelId="export_separator"
                    label="Type"
                    size="small"
                    value={delType as ''}
                    onChange={(e: SelectChangeEvent<HTMLDivElement>) => {
                      setDelType(e.target.value as DelTypes)
                    }}
                  >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="tsv">TSV</MenuItem>
                    <MenuItem value="dat">DAT</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <></>
              )}{' '}
              {format === 'json' ? (
                <FormControl>
                  <InputLabel id="export_json_type">Type</InputLabel>
                  <Select
                    labelId="export_json_type"
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
                  a.setAttribute('download', exportName(name, format, delType))
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
      )}
    </>
  )
}
