'use client'

import { useState, useTransition } from 'react'
import { addTickerAction, deleteTickerAction, toggleTickerAction } from '../actions'

interface TickerItem { id: string; text: string; active: boolean }

export default function AdminTickerPanel({ items: initial }: { items: TickerItem[] }) {
  const [items,    setItems]    = useState<TickerItem[]>(initial)
  const [newText,  setNewText]  = useState('')
  const [isPending, start]      = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim()) return
    const fd = new FormData()
    fd.append('text', newText.trim())
    start(async () => {
      await addTickerAction(fd)
      setNewText('')
      window.location.reload()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('למחוק פריט זה?')) return
    const fd = new FormData(); fd.append('id', id)
    start(async () => {
      await deleteTickerAction(fd)
      setItems(prev => prev.filter(x => x.id !== id))
    })
  }

  const handleToggle = (item: TickerItem) => {
    const fd = new FormData()
    fd.append('id', item.id)
    fd.append('active', String(!item.active))
    start(async () => {
      await toggleTickerAction(fd)
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, active: !x.active } : x))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="הכנס פריט מבזק..."
          className="input flex-1 text-sm"
          maxLength={200}
          required
        />
        <button type="submit" disabled={isPending} className="btn-primary text-sm px-4 py-2">
          ➕ הוסף
        </button>
      </form>

      {items.length === 0 && (
        <p className="text-sm text-center py-3" style={{ color: 'var(--text-muted)' }}>אין פריטים במבזק</p>
      )}

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.id} className="glass-sm flex items-center gap-3 px-3 py-2 rounded-xl">
            <button
              onClick={() => handleToggle(item)}
              disabled={isPending}
              style={{
                background: item.active ? 'rgba(34,197,94,0.2)' : 'rgba(100,100,100,0.15)',
                border: `1px solid ${item.active ? 'rgba(34,197,94,0.4)' : 'rgba(150,150,150,0.3)'}`,
                borderRadius: 9999, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700,
                color: item.active ? '#4ade80' : 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              {item.active ? 'פעיל' : 'כבוי'}
            </button>
            <p className="flex-1 text-sm truncate" style={{ color: 'var(--text-main)' }}>{item.text}</p>
            <button onClick={() => handleDelete(item.id)} disabled={isPending} className="btn-danger text-xs px-2 py-1">
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
