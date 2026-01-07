import React from 'react'

interface EmptyStateProps {
  title?: string
  description?: string
  suggestion?: string
}

export function EmptyState({ title = 'No results', description = 'No products found.', suggestion = 'Try another keyword or clear filters.' }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <div className="mx-auto w-32 h-32 rounded-lg bg-[#f0f8f0] flex items-center justify-center mb-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6l3 0" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 6l-3 0" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#064e3b] mb-2">{title}</h3>
      <p className="text-sm text-[#064e3b]/70 mb-3">{description}</p>
      <p className="text-xs text-[#064e3b]/60">{suggestion}</p>
    </div>
  )
}
