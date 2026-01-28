import React, { useState } from 'react'

export default function RateModal({ onSubmit, onCancel, otherName }: { onSubmit: (rating: number, note?: string) => void; onCancel: () => void; otherName: string }) {
  const [rating, setRating] = useState<number>(5)
  const [note, setNote] = useState('')

  return (
    <div className="p-4 border rounded bg-card">
      <h3 className="font-bold">Rate {otherName}</h3>
      <div className="mt-2">
        <label className="block text-sm">Rating</label>
        <input type="range" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
        <div>{rating} / 5</div>
      </div>
      <div className="mt-2">
        <label className="block text-sm">Note (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full" />
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn btn-primary" onClick={() => onSubmit(rating, note)}>Submit Rating</button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
