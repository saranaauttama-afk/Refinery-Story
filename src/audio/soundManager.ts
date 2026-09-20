import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

import { BGM_SOURCE, SOUND_SOURCES, type SoundKey } from './sounds'

// Thin wrapper around expo-audio. All native calls are guarded: if the
// native module is unavailable (e.g. a dev build that didn't include
// expo-audio) or an asset fails to load, every method degrades to a silent
// no-op instead of crashing an action. The rest of the app talks to this
// through useSound() and never touches expo-audio directly.

let audioModeConfigured = false
let audioUnavailable = false

function ensureAudioMode() {
  if (audioModeConfigured || audioUnavailable) return
  audioModeConfigured = true
  // Play SFX even when the iOS ringer switch is on silent, and mix with
  // other audio rather than hijacking it.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
}

// One reusable player per SFX, created lazily on first play and cached.
const sfxPlayers: Partial<Record<SoundKey, AudioPlayer>> = {}

function getSfxPlayer(key: SoundKey): AudioPlayer | null {
  if (audioUnavailable) return null
  const existing = sfxPlayers[key]
  if (existing) return existing
  try {
    ensureAudioMode()
    const player = createAudioPlayer(SOUND_SOURCES[key])
    sfxPlayers[key] = player
    return player
  } catch {
    // expo-audio native missing -> disable for the rest of the session.
    audioUnavailable = true
    return null
  }
}

export function playSfx(key: SoundKey) {
  const player = getSfxPlayer(key)
  if (!player) return
  try {
    player.seekTo(0)
    player.play()
  } catch {
    // ignore: a single failed playback shouldn't bubble into game logic
  }
}

// --- Background music ---------------------------------------------------

let bgmPlayer: AudioPlayer | null = null
let bgmStarted = false

export function startBgm() {
  if (audioUnavailable || bgmStarted) return
  if (BGM_SOURCE == null) return // no track shipped yet
  bgmStarted = true
  try {
    ensureAudioMode()
    bgmPlayer = createAudioPlayer(BGM_SOURCE)
    bgmPlayer.loop = true
    bgmPlayer.volume = 0.5
    bgmPlayer.play()
  } catch {
    audioUnavailable = true
    bgmStarted = false
  }
}

export function setBgmEnabled(enabled: boolean) {
  if (BGM_SOURCE == null) return
  if (enabled) {
    if (!bgmStarted) {
      startBgm()
    } else {
      try {
        bgmPlayer?.play()
      } catch {
        /* no-op */
      }
    }
  } else {
    try {
      bgmPlayer?.pause()
    } catch {
      /* no-op */
    }
  }
}
