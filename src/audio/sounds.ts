// SFX registry. Each key maps to a bundled audio asset (require'd so Metro
// includes it). The files shipped here are short, gentle PLACEHOLDER tones
// generated procedurally -- drop nicer .wav/.mp3 files over the same paths to
// upgrade the game's sound with zero code changes.
//
// To add a new SFX: add a key here + a file in assets/audio, then call
// useSound().play('<key>') from the relevant action.

export type SoundKey = 'tap' | 'confirm' | 'sell' | 'build' | 'success' | 'levelup'

export const SOUND_SOURCES: Record<SoundKey, number> = {
  tap: require('../../assets/audio/tap.wav'),
  confirm: require('../../assets/audio/confirm.wav'),
  sell: require('../../assets/audio/sell.wav'),
  build: require('../../assets/audio/build.wav'),
  success: require('../../assets/audio/success.wav'),
  levelup: require('../../assets/audio/levelup.wav'),
}

// Optional looping background music. No placeholder is shipped (a generated
// loop would be unpleasant) -- drop a file at assets/audio/bgm.mp3 and switch
// this to require('../../assets/audio/bgm.mp3') to enable it. Left null so
// the music system stays a safe no-op until a real track is added.
export const BGM_SOURCE: number | null = null
