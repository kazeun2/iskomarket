import { useState, useEffect } from 'react'
import { Database, X, Info, CheckCircle } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

export function DatabaseModeIndicator() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured())
  }, [])

  // Don't show indicator in production when properly configured
  if (isConfigured && import.meta.env.PROD) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100000]">
      {isExpanded ? (
        <div className="bg-white dark:bg-[var(--card)] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {isConfigured ? '✅ Supabase Connected' : '⚠️ Database Not Connected'}
            </h4>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isConfigured ? (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Connected to Supabase database
              </p>
              <div className="space-y-1">
                <p className="font-medium text-gray-900 dark:text-white">Features:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Real-time data synchronization</li>
                  <li>User authentication & OTP</li>
                  <li>Secure data storage</li>
                  <li>Row Level Security (RLS)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Info className="w-4 h-4" />
                  Supabase not configured
                </p>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white text-xs mb-2">
                  Setup Instructions:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Create a Supabase project</li>
                  <li>Run the SQL schema file</li>
                  <li>Copy .env.example to .env</li>
                  <li>Add your Supabase credentials</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
            isConfigured
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          {isConfigured ? (
            <>
              <Database className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Connected</span>
            </>
          ) : (
            <>
              <Info className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Setup Required</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}