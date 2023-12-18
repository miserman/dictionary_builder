import {Button} from '@mui/material'
import {useContext} from 'react'
import type {Synset} from './resources'
import {InfoDrawerContext} from './infoDrawer'

export function SynsetInfo({info}: {info: Synset}) {
  const updateInfoDrawerState = useContext(InfoDrawerContext)
  return (
    <Button
      variant="text"
      fullWidth
      sx={{p: 0, justifyContent: 'flex-start'}}
      onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'synset', value: info.key, info: info}})}
    >
      {info.key}
    </Button>
  )
}
