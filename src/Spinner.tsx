import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { ArrowClockwise, ArrowRight, Check, PencilSimple, Shuffle } from '@phosphor-icons/react'
import { availableEntries, centeredEntries, randomIndex } from './logic'
import type { Settings } from './logic'
type Props = { items: string[]; used: string[]; settings: Settings; settingsOpen: boolean; onResult: (value: string) => void; onBusy: (busy: boolean) => void; onEdit: () => void; onReset: () => void }
export default function Spinner({ items, used, settings, settingsOpen, onResult, onBusy, onEdit, onReset }: Props) {
  const [rows, setRows] = useState(() => centeredEntries(items, items[0]))
  const [result, setResult] = useState(''), [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const controls = useRef<ReturnType<typeof animate> | null>(null)
  const audio = useRef<AudioContext | null>(null), lastTick = useRef(0)
  const position = useMotionValue(2)
  const transform = useTransform(position, p => `translateY(calc(${2 - p} * var(--row-height)))`)
  const reducedMotion = useReducedMotion()
  const pool = availableEntries(items, used, settings.noRepeat), exhausted = pool.length === 0
  const spinRef = useRef<() => void>(() => {})
  useEffect(() => () => { controls.current?.stop(); void audio.current?.close() }, [])
  function tone(win = false) {
    if (!settings.sound) return
    try {
      if (!audio.current) audio.current = new AudioContext()
      const context = audio.current
      void context.resume().catch(() => {})
      const oscillator = context.createOscillator(), gain = context.createGain()
      oscillator.connect(gain); gain.connect(context.destination); oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(win ? 660 : 260, context.currentTime)
      if (win) oscillator.frequency.exponentialRampToValueAtTime(990, context.currentTime + .16)
      gain.gain.setValueAtTime(.045, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + (win ? .5 : .045))
      oscillator.start(); oscillator.stop(context.currentTime + (win ? .5 : .05))
    } catch { /* Optional audio must never interrupt the spin. */ }
  }
  function spin() {
    if (lock.current || exhausted || settingsOpen) return
    lock.current = true
    const winner = pool[randomIndex(pool.length)]
    const first = rows.slice(Math.round(position.get()) - 2, Math.round(position.get()) + 3)
    const sequence = [...first, ...Array.from({ length: 55 }, (_, i) => pool[i % pool.length]), ...centeredEntries(pool, winner)]
    const target = sequence.length - 3
    flushSync(() => { setRows(sequence); setResult(''); setBusy(true); onBusy(true) })
    position.set(2); tone()
    let previousRow = 2
    controls.current = animate(position, target, {
      duration: reducedMotion || pool.length === 1 ? .2 : settings.duration,
      ease: [.12, .68, .14, 1],
      onUpdate: value => {
        const row = Math.floor(value)
        if (row !== previousRow && performance.now() - lastTick.current > 50) { tone(); lastTick.current = performance.now() }
        previousRow = row
      },
      onComplete: () => {
        setResult(winner); setBusy(false); onBusy(false); onResult(winner); lock.current = false; tone(true)
      },
    })
  }
  spinRef.current = spin
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement
      if (event.code !== 'Space' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || el.closest('input, textarea, button, select, [contenteditable="true"], [role="dialog"]')) return
      event.preventDefault(); spinRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return <main className="spin-page">
    <div className="spin-topline"><span>{String(items.length).padStart(2, '0')} LỰA CHỌN CỦA BẠN</span><button className="text-button" onClick={onEdit} disabled={busy}><PencilSimple size={15} /> Sửa danh sách</button></div>
    <div className="spin-intro"><h1>Để ngẫu nhiên <span>quyết định.</span></h1><p>{settings.noRepeat ? `Còn ${pool.length} lựa chọn trong lượt này.` : 'Một lần quay. Một lựa chọn dành cho bạn.'}</p></div>
    <section className={`reel-stage ${busy ? 'is-spinning' : ''} ${result ? 'has-result' : ''}`} aria-label="Spinner chọn ngẫu nhiên" aria-busy={busy}>
      <ul className="sr-only" aria-label="Danh sách lựa chọn">{items.map(item => <li key={item}>{item}</li>)}</ul>
      <div className="reel-rule top" /><div className="selection-frame"><i /><i /><i /><i /></div>
      <div className="reel-window" aria-hidden="true"><motion.div className="reel-track" style={{ transform }}>
        {rows.map((label, index) => <div className={`reel-row ${label.length > 28 ? 'long-label' : ''} ${label.length > 60 ? 'very-long-label' : ''}`} key={index}><span>{label}</span></div>)}
      </motion.div></div><div className="reel-rule bottom" />
    </section>
    <div className="spin-controls">
      <div className="result-status" role="status" aria-live="polite">{busy ? <span>Đang tìm lựa chọn của bạn...</span> : result ? <span className="winner-label"><Check size={16} /> Đã chọn: <strong>{result}</strong></span> : <span>Mọi lựa chọn đều có cơ hội như nhau.</span>}</div>
      {exhausted && !busy ? <button className="primary-button spin-button" onClick={() => { onReset(); setResult('') }}><ArrowClockwise size={19} /> Đặt lại lượt quay</button>
        : <button className="primary-button spin-button" onClick={spin} disabled={busy}><Shuffle size={21} weight="bold" /><span>{busy ? 'ĐANG QUAY' : result ? 'QUAY LẠI' : 'QUAY'}</span>{!busy && <ArrowRight size={19} />}</button>}
      <p className="keyboard-hint">{exhausted && !busy ? 'Bạn đã quay hết danh sách. Bắt đầu một lượt mới nhé.' : <>hoặc nhấn <kbd>space</kbd> để quay</>}</p>
    </div>
  </main>
}
