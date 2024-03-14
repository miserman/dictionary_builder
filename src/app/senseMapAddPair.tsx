import {Close} from '@mui/icons-material'
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material'
import {useContext, useState} from 'react'
import {ResourceContext, SenseMapSetter} from './resources'
import {SenseSelector} from './senseMapEdit'

export function AddSenseMapPair({coarseLabels, useNLTK}: {coarseLabels: readonly string[]; useNLTK: boolean}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)

  const {senseMap} = useContext(ResourceContext)
  const setSenseMap = useContext(SenseMapSetter)

  const [fines, setFines] = useState<string[]>([])
  const [coarseInput, setCoarseInput] = useState<string | undefined>('')
  const [coarses, setCoarses] = useState<string[]>([])
  return (
    <>
      <Button sx={{position: 'absolute', left: 16, bottom: 16}} onClick={toggleMenu}>
        New Pairs
      </Button>
      <Dialog open={menuOpen} onClose={toggleMenu}>
        <DialogTitle>Sense Mappings</DialogTitle>
        <IconButton
          aria-label="close sense map editor"
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
        <DialogContent sx={{p: 1, minWidth: '500px'}}>
          <DialogContentText sx={{mb: 1}}>Define fine to coarse sense mappings:</DialogContentText>
          <Stack direction="row" spacing={1}>
            <SenseSelector selected={fines} setSelected={setFines} multi={true} useNLTK={useNLTK} />
            <Autocomplete
              componentsProps={{popper: {className: 'synset-select'}}}
              multiple
              disableCloseOnSelect
              options={coarseLabels}
              value={coarses}
              onChange={(_, value) => setCoarses([...value])}
              renderTags={(value: readonly string[], getTagProps) => {
                return value.map((option: string, index: number) => (
                  <Chip label={option} {...getTagProps({index})} key={option} />
                ))
              }}
              inputValue={coarseInput}
              onInputChange={(_, value) => setCoarseInput(value)}
              renderInput={params => <TextField {...params} size="small" label="Coarse Senses"></TextField>}
              filterSelectedOptions
              selectOnFocus
              clearOnEscape
              handleHomeEndKeys
              fullWidth
              freeSolo
            ></Autocomplete>
          </Stack>
        </DialogContent>
        <DialogActions sx={{justifyContent: 'space-between'}}>
          <Button onClick={toggleMenu}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              const newMap = {...senseMap}
              fines.forEach(fine => {
                if (fine in senseMap) {
                  const newCoarses = [...newMap[fine]]
                  coarses.forEach(coarse => {
                    if (!newCoarses.includes(coarse)) newCoarses.push(coarse)
                  })
                  newMap[fine] = newCoarses
                } else {
                  newMap[fine] = coarses
                }
              })
              setSenseMap(newMap)
              setFines([])
              setCoarses([])
              toggleMenu()
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
