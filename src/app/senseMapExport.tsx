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
  Typography,
  useTheme,
} from '@mui/material'
import {type ChangeEvent, useContext, useMemo, useState} from 'react'
import {ResourceContext} from './resources'

export function ExportCoarseSenseMap() {
  const theme = useTheme()
  const {senseMap, senseMapOptions, synsetInfo, sense_keys, SenseLookup, NLTKLookup} = useContext(ResourceContext)
  const senseMapRaw = senseMapOptions.rawMap
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [name, setName] = useState('coarse_sense_map')
  const [useNLTK, setUseNLTK] = useState(senseMapRaw ? senseMapRaw.NLTKLabels : false)
  const [originalFormat, setOriginalFormat] = useState(!!senseMapRaw)
  const content = useMemo(() => {
    const rows = [originalFormat && senseMapRaw ? senseMapRaw.header.join(',') : '"fine_sense","coarse_sense"']
    const fine_senses = Object.keys(senseMap)
    if (fine_senses.length && sense_keys && synsetInfo) {
      if (originalFormat && senseMapRaw) {
        const {header, selectedCols, rows: originalRows, NLTKLabels} = senseMapRaw
        const fine_col = header.indexOf(selectedCols[0])
        const coarse_col = header.indexOf(selectedCols[1])
        if (fine_col !== -1 && coarse_col !== -1) {
          const mapped: {[index: string]: boolean} = {}
          originalRows.forEach(row => {
            const fine = NLTKLabels ? sense_keys[NLTKLookup[row[fine_col]]] : row[fine_col]
            const coarse = row[coarse_col]
            if (fine in senseMap && senseMap[fine].indexOf(coarse) !== -1) {
              const newRow = [...row]
              if (NLTKLabels && !useNLTK) {
                newRow[fine_col] = sense_keys[NLTKLookup[row[fine_col]]]
              } else if (!NLTKLabels && useNLTK && fine in SenseLookup) {
                newRow[fine_col] = synsetInfo[SenseLookup[fine]].nltk_id
              }
              rows.push(newRow.join(','))
              mapped[newRow[fine_col] + coarse] = true
            }
          })
          fine_senses.forEach(fine => {
            const coarses = senseMap[fine]
            if (useNLTK && fine in SenseLookup) {
              const {nltk_id} = synsetInfo[SenseLookup[fine]]
              fine = nltk_id
            }
            const nCols = header.length
            coarses.forEach(coarse => {
              const key = fine + coarse
              if (fine && coarse && !(key in mapped)) {
                const row = new Array(nCols)
                row[fine_col] = fine
                row[coarse_col] = coarse
                rows.push(row.join(','))
              }
            })
          })
        }
      } else {
        fine_senses.forEach(fine => {
          const coarse = senseMap[fine]
          if (useNLTK && fine in SenseLookup) {
            const {nltk_id} = synsetInfo[SenseLookup[fine]]
            fine = nltk_id
          }
          if (fine && coarse) coarse.forEach(l => rows.push('"' + fine + '","' + l + '"'))
        })
      }
    }
    return rows.length > 1 ? rows.join('\n') : ''
  }, [useNLTK, originalFormat, NLTKLookup, SenseLookup, senseMap, senseMapRaw, sense_keys, synsetInfo])
  return (
    <>
      <Button variant="outlined" onClick={toggleMenu}>
        Export
      </Button>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={toggleMenu}>
          <DialogTitle>Export Coarse Sense Map</DialogTitle>
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
                    minWidth: '35em',
                    minHeight: '20em',
                  }}
                  value={content}
                  readOnly
                ></textarea>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{justifyContent: 'space-between'}}>
            <FormControlLabel
              control={<Switch size="small" checked={useNLTK} onChange={() => setUseNLTK(!useNLTK)}></Switch>}
              label={<Typography variant="caption">NLTK-Style Labels</Typography>}
              labelPlacement="top"
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={originalFormat}
                  onChange={() => setOriginalFormat(!originalFormat)}
                  disabled={!senseMapRaw}
                ></Switch>
              }
              label={<Typography variant="caption">Match Import Format</Typography>}
              labelPlacement="top"
            />
            <Button
              variant="contained"
              onClick={() => {
                if (name && content) {
                  const a = document.createElement('a')
                  a.setAttribute('href', URL.createObjectURL(new Blob([content], {type: 'text/plain'})))
                  a.setAttribute('download', name + '.csv')
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
