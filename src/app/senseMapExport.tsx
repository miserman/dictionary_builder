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
  const {senseMap, synsetInfo, sense_keys, SenseLookup} = useContext(ResourceContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [name, setName] = useState('coarse_sense_map')
  const [useNLTK, setUseNLTK] = useState(false)
  const content = useMemo(() => {
    const rows = ['"fine_sense","coarse_sense"']
    const fine_senses = Object.keys(senseMap)
    if (fine_senses.length > 1) {
      fine_senses.forEach(fine => {
        const coarse = senseMap[fine]
        if (useNLTK && synsetInfo && sense_keys) {
          if (fine in SenseLookup) {
            const {nltk_id} = synsetInfo[SenseLookup[fine]]
            fine = nltk_id
          }
        }
        if (fine && coarse) coarse.forEach(l => rows.push('"' + fine + '","' + l + '"'))
      })
    }
    return rows.length > 1 ? rows.join('\n') : ''
  }, [menuOpen, useNLTK])
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
