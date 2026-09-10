/** Synthesized locally: no downloads or third-party sound assets. */
export class SpinAudio {
  private context: AudioContext | null = null
  private voices = new Set<OscillatorNode>()

  // Called directly from the user's click/Space gesture to unlock browser audio.
  start() {
    try {
      this.stopVoices()
      const context = this.context ??= new AudioContext()
      if (context.state === 'running') this.tick()
      else void context.resume().then(() => {
        if (this.context === context) this.tick()
      }).catch(() => {})
    } catch { /* Audio unavailable: the spinner still works. */ }
  }

  tick() {
    const context = this.context
    if (context?.state !== 'running') return
    this.note(1050, context.currentTime, .045, .13, 'triangle', 380)
  }

  win() {
    const context = this.context
    if (context?.state !== 'running') return
    // A soft ascending major triad distinguishes the result from reel ticks.
    ;[523.25, 659.25, 783.99].forEach((frequency, i) => {
      this.note(frequency, context.currentTime + i * .11, i === 2 ? .65 : .3, .12, 'sine')
    })
  }

  private note(frequency: number, at: number, duration: number, volume: number, type: OscillatorType, endFrequency?: number) {
    const context = this.context!
    const oscillator = context.createOscillator(), gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, at)
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(volume, at + .003)
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration)
    oscillator.connect(gain); gain.connect(context.destination)
    this.voices.add(oscillator)
    oscillator.onended = () => {
      oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator)
    }
    oscillator.start(at); oscillator.stop(at + duration + .01)
  }

  private stopVoices() {
    for (const voice of this.voices) { voice.stop(); voice.disconnect() }
    this.voices.clear()
  }

  close() {
    this.stopVoices()
    void this.context?.close().catch(() => {})
    this.context = null
  }
}
