import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, Check, GearSix, ListPlus, Shuffle, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react'
import Spinner from './Spinner'
import { loadSaved, parseEntries, STORAGE_KEY } from './logic'

export default function App() {
  const [saved] = useState(loadSaved)
  const [raw, setRaw] = useState(saved.raw), [settings, setSettings] = useState(saved.settings)
  const [used, setUsed] = useState<string[]>(saved.used)
  const [screen, setScreen] = useState<'setup' | 'spin'>('setup')
  const [items, setItems] = useState<string[]>([]), [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false), [storageError, setStorageError] = useState(false)
  const parsed = useMemo(() => parseEntries(raw), [raw])
  const valid = parsed.items.length >= 2 && !parsed.error && !parsed.duplicates.length
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ raw, settings, used })); setStorageError(false) }
    catch { setStorageError(true) }
  }, [raw, settings, used])
  function createSpinner() {
    if (!valid) return
    setItems(parsed.items); setScreen('spin')
  }
  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="#" aria-label="SPIN, về màn hình nhập danh sách" onClick={event => { event.preventDefault(); if (!busy) setScreen('setup') }}><span className="brand-mark"><Shuffle size={24} weight="bold" /></span>spin<span className="brand-period">.</span></a>
      <div className="header-right"><span className="header-note">Bớt phân vân. Thêm bất ngờ.</span>
        <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
          <Dialog.Trigger asChild><button className="utility-button" disabled={busy}><GearSix size={19} /><span>Cài đặt</span></button></Dialog.Trigger>
          <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="settings-panel">
            <div className="panel-heading"><Dialog.Title>Cài đặt lượt quay</Dialog.Title><Dialog.Close asChild><button className="icon-button" aria-label="Đóng cài đặt"><X size={22} /></button></Dialog.Close></div>
            <Dialog.Description className="panel-description">Một chút điều chỉnh cho lần bất ngờ tiếp theo.</Dialog.Description>
            <fieldset className="duration-setting"><legend>Thời gian quay</legend><div className="duration-options">{[{ value: 3, name: 'Nhanh' }, { value: 4, name: 'Vừa đủ' }, { value: 5, name: 'Hồi hộp' }].map(option => <label key={option.value} className={settings.duration === option.value ? 'selected' : ''}><input type="radio" name="duration" value={option.value} checked={settings.duration === option.value} onChange={() => setSettings({ ...settings, duration: option.value })} /><strong>{option.value}s</strong><span>{option.name}</span></label>)}</div></fieldset>
            <label className="toggle-setting"><span><strong>Âm thanh</strong><small>Tiếng tick và âm báo khi có kết quả.</small></span><input type="checkbox" role="switch" checked={settings.sound} onChange={e => setSettings({ ...settings, sound: e.target.checked })} /><span className="switch-visual" aria-hidden="true" /></label>
            <label className="toggle-setting"><span><strong>Không lặp kết quả</strong><small>Mỗi lựa chọn chỉ xuất hiện một lần trong lượt.</small></span><input type="checkbox" role="switch" checked={settings.noRepeat} onChange={e => { setSettings({ ...settings, noRepeat: e.target.checked }); setUsed([]) }} /><span className="switch-visual" aria-hidden="true" /></label>
            {settings.noRepeat && used.length > 0 && <button className="secondary-button reset-button" onClick={() => setUsed([])}>Đặt lại {used.length} kết quả đã quay</button>}
            <div className="settings-note"><Check size={16} /> Cài đặt được lưu tự động trên thiết bị này.</div>
            <Dialog.Close asChild><button className="primary-button panel-done">Xong <Check size={18} /></button></Dialog.Close>
          </Dialog.Content></Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
    {screen === 'setup' ? <main className="setup-page">
      <div className="setup-heading"><span className="eyebrow"><span className="eyebrow-line" /> MỘT CHÚT NGẪU NHIÊN</span><h1>Nhiều lựa chọn.<br /><span>Một lần quay.</span></h1><p>Thêm những điều bạn đang phân vân.<br className="mobile-break" /> Để vòng quay chọn giúp bạn.</p></div>
      <form className="entry-form" onSubmit={e => { e.preventDefault(); createSpinner() }}>
        <div className="entry-heading"><label htmlFor="entries"><ListPlus size={20} /> Danh sách của bạn</label><span className="entry-count">{String(parsed.items.length).padStart(2, '0')} <span>lựa chọn</span></span></div>
        <div className="textarea-wrap"><textarea id="entries" spellCheck={false} maxLength={15000} value={raw} onChange={e => { setRaw(e.target.value); setUsed([]) }} placeholder={'Học tiếng Anh\nĐọc một cuốn sách\nTập thể dục\nThử một điều mới'} aria-describedby="entry-help entry-errors" /><div className="textarea-bottom" id="entry-help"><span>Mỗi dòng là một lựa chọn</span><span>Tối thiểu 2</span></div></div>
        <div id="entry-errors" aria-live="polite">{parsed.error && <p className="validation-message">{parsed.error}</p>}{parsed.duplicates.length > 0 && <div className="duplicate-notice"><span>Có {parsed.duplicates.length} dòng trùng. Hãy gộp để xác suất bằng nhau.</span><button type="button" onClick={() => { setRaw(parsed.items.join('\n')); setUsed([]) }}>Gộp dòng trùng</button></div>}</div>
        <button type="submit" className="primary-button create-button" disabled={!valid}><span>Tạo spinner</span><ArrowRight size={20} /></button>
        <p className="form-note"><Check size={14} /> {storageError ? 'Chưa lưu được trên trình duyệt. Bạn vẫn có thể quay.' : 'Danh sách được lưu riêng trên thiết bị của bạn.'}</p>
      </form>
    </main> : <Spinner items={items} used={used} settings={settings} settingsOpen={settingsOpen} onResult={value => setUsed(previous => [...new Set([...previous, value])])} onBusy={setBusy} onEdit={() => setScreen('setup')} onReset={() => setUsed([])} />}
    <footer className="site-footer"><span>Cho những quyết định lớn nhỏ.</span><div><button className="sound-button" aria-label={settings.sound ? 'Tắt âm thanh' : 'Bật âm thanh'} disabled={busy} onClick={() => setSettings({ ...settings, sound: !settings.sound })}>{settings.sound ? <SpeakerHigh size={17} /> : <SpeakerSlash size={17} />}<span>Âm thanh {settings.sound ? 'bật' : 'tắt'}</span></button><span className="footer-divider" /><span>Made for the undecided.</span></div></footer>
    {storageError && screen === 'spin' && <p className="storage-notice" role="status">Trình duyệt chưa lưu được thay đổi. Hãy giữ trang này mở.</p>}
  </div>
}
