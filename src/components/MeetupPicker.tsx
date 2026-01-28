import React, { useState } from 'react'

export default function MeetupPicker({ onPick, onCancel }: { onPick: (iso: string) => void; onCancel: () => void }) {
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')

  const submit = () => {
    if (!date) return
    const iso = time ? new Date(`${date}T${time}`).toISOString() : new Date(date).toISOString()
    onPick(iso)
  }

  return (
    <div className="p-4 border rounded bg-white">
      <div className="mb-2">
        <label className="block text-sm">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Time</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} className="btn btn-primary">Pick</button>
        <button onClick={onCancel} className="btn">Cancel</button>
      </div>
    </div>
  )
}
