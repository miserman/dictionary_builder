import {Close, Visibility, VisibilityOff} from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  styled,
} from '@mui/material'
import {type ChangeEvent, type DragEvent, useState, useContext} from 'react'
import {type CoarseSenseMap, ResourceContext, SenseMapSetter} from './resources'

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

const quotes = /^"|"$/g
const sep = /"*,"*/
function parseCoarseMap(rows: readonly string[][], fine_col: number, coarse_col: number) {
  const parsed: CoarseSenseMap = {}
  if (rows) {
    if (fine_col !== -1 && coarse_col !== -1) {
      try {
        rows.forEach(row => {
          const fine = row[fine_col]
          const coarse = row[coarse_col]
          if (fine && coarse && coarse.length) {
            if (fine in parsed) {
              const existing = parsed[fine]
              if (!existing.includes(coarse)) existing.push(coarse)
            } else {
              parsed[fine] = [coarse]
            }
          }
        })
      } catch {}
    }
  }
  return parsed
}

const newLine = /[\r\n]+/
const senseKeySep = /%/
export function ImportCoarseSenseMap() {
  const {sense_keys, SenseLookup, NLTKLookup} = useContext(ResourceContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [store, setStore] = useState(true)
  const [encrypt, setEncrypt] = useState(false)
  const [header, setHeader] = useState<string[]>([])
  const [rows, setRows] = useState<readonly string[][]>([])
  const [selectedCols, setSelectedCols] = useState(['', ''])
  const [NLTKLabels, setNLTKLabels] = useState(false)
  const [recognized, setRecognized] = useState([0, 0, 0])
  const [map, setMap] = useState<CoarseSenseMap>({})
  const [password, setPassword] = useState('')
  const [hide, setHide] = useState(true)
  const senseMapSetter = useContext(SenseMapSetter)
  const clear = () => {
    setHeader([])
    setRows([])
    setPassword('')
  }
  const parseMap = (rows: readonly string[][], fine: number, coarse: number) => {
    const map = parseCoarseMap(rows, fine, coarse)
    const recognizedMap: CoarseSenseMap = {}
    const fineMapped = Object.keys(map)
    if (fineMapped.length && sense_keys) {
      const isNLTK = !senseKeySep.test(fineMapped[0])
      setNLTKLabels(isNLTK)
      const lookup = isNLTK ? NLTKLookup : SenseLookup
      const coarse: Set<String> = new Set()
      let nRecognized = 0
      fineMapped.forEach(key => {
        const to = map[key]
        if ('string' === typeof to) {
          coarse.add(to)
        } else {
          to.forEach(l => coarse.add(l))
        }
        if (key in lookup) {
          nRecognized++
          recognizedMap[isNLTK ? sense_keys[NLTKLookup[key]] : key] = to
        }
      })
      setRecognized([fineMapped.length, nRecognized, coarse.size])
    }
    setMap(recognizedMap)
  }
  const handleUpload = (rawRows: string[]) => {
    if (rawRows.length > 1) {
      const header = rawRows.splice(0, 1)[0].replace(quotes, '').split(sep)
      const rows = rawRows.map(row => row.replace(quotes, '').split(sep))
      setRows(Object.freeze(rows))
      setHeader(header)
      if (header.length > 1) {
        const cols = [header[0], header[1]]
        setSelectedCols(cols)
        parseMap(rows, 0, 1)
      }
    }
  }
  const setCoarseMap = () => {
    const rawMap = {header, selectedCols, rows, NLTKLabels}
    senseMapSetter(map, rawMap, store, password)
    clear()
    setMenuOpen(false)
  }
  return (
    <>
      <Button variant="outlined" onClick={toggleMenu}>
        Import
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
              handleUpload((reader.result as string).split(newLine))
            }
            reader.readAsText(file)
          }
        }}
      >
        <DialogTitle>Import Coarse Sense Mappings</DialogTitle>
        <IconButton
          aria-label="close coarse sense import menu"
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
        <DialogContent sx={{p: 1, minWidth: '400px'}}>
          {rows.length > 1 ? (
            <Stack spacing={1} direction="row">
              <Box sx={{width: '50%'}}>
                <Tooltip
                  title="Name of the column containing fine-grained sense labels (such as sense keys)."
                  placement="left"
                >
                  <FormControl fullWidth>
                    <InputLabel id="fine_sense_select">Fine Senses</InputLabel>
                    <Select
                      labelId="fine_sense_select"
                      label="Fine Senses"
                      size="small"
                      value={selectedCols[0]}
                      onChange={e => {
                        const value = e.target.value
                        const cols = [value, selectedCols[selectedCols[1] === value ? 0 : 1]]
                        parseMap(rows, header.indexOf(cols[0]), header.indexOf(cols[1]))
                        setSelectedCols(cols)
                      }}
                    >
                      {header.map((colName, index) => {
                        return (
                          <MenuItem key={colName + index} value={colName}>
                            {colName}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>
                </Tooltip>
                <Typography sx={{pl: 2}} variant="caption">
                  <span className="number">{recognized[1]} </span>
                  of
                  <span className="number"> {recognized[0]} </span>
                  recognized
                </Typography>
              </Box>
              <Box sx={{width: '50%'}}>
                <Tooltip
                  title="Name of the column containing coarse-grained sense labels (such as sense clusters)."
                  placement="right"
                >
                  <FormControl fullWidth>
                    <InputLabel id="coarse_sense_select">Coarse Senses</InputLabel>
                    <Select
                      labelId="coarse_sense_select"
                      label="Coarse Senses"
                      size="small"
                      value={selectedCols[1]}
                      onChange={e => {
                        const value = e.target.value
                        const cols = [selectedCols[selectedCols[0] === value ? 1 : 0], value]
                        parseMap(rows, header.indexOf(cols[0]), header.indexOf(cols[1]))
                        setSelectedCols(cols)
                      }}
                    >
                      {header.map((colName, index) => {
                        return (
                          <MenuItem key={colName + index} value={colName}>
                            {colName}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>
                </Tooltip>
                <Typography sx={{pl: 2}} variant="caption">
                  <span className="number"> {recognized[2]} </span>
                  unique labels
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography sx={{p: 2}}>
              Select a CSV file with columns containing fine- and coarse-gained sense labels.
            </Typography>
          )}
          <Stack spacing={1}>
            <Stack spacing={2} direction="row" sx={{justifyContent: 'flex-end'}}>
              <Tooltip title="Store the imported map locally." placement="top">
                <FormControlLabel
                  label="Store"
                  labelPlacement="start"
                  control={<Switch checked={store} onChange={() => setStore(!store)} />}
                />
              </Tooltip>
              {store ? (
                <Tooltip title="Encrypt the sense map when being stored." placement="right">
                  <FormControlLabel
                    label="Encrypt"
                    labelPlacement="start"
                    control={<Switch checked={encrypt} onChange={() => setEncrypt(!encrypt)} />}
                  />
                </Tooltip>
              ) : (
                <></>
              )}
            </Stack>
            {store && encrypt ? (
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Password"
                  type={hide ? 'password' : 'text'}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                />
                <IconButton
                  sx={{position: 'absolute', right: 15}}
                  aria-label="toggle password visibility"
                  onClick={() => setHide(!hide)}
                >
                  {hide ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
            ) : (
              <></>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{justifyContent: 'space-between'}}>
          <Stack direction="row" spacing={1}>
            <Tooltip title="select a file to import a coarse sense map from">
              <Button variant="outlined" component="label">
                File
                <HiddenInput
                  type="file"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length) {
                      const file = e.target.files[0]
                      const reader = new FileReader()
                      reader.onload = () => {
                        handleUpload((reader.result as string).split(newLine))
                        e.target.value = ''
                      }
                      reader.readAsText(file)
                    }
                  }}
                />
              </Button>
            </Tooltip>
            <Tooltip title="clear any loaded content">
              <Button onClick={clear}>clear</Button>
            </Tooltip>
          </Stack>
          <Button variant="contained" disabled={encrypt ? !password : false} onClick={setCoarseMap}>
            Set
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
