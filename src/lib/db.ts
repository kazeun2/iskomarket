import { supabase } from './supabase'

// Cache for table column discovery to avoid repeated information_schema queries
const tableColumnsCache: Record<string, Set<string>> = {}

export async function getTableColumns(table: string): Promise<Set<string>> {
  if (tableColumnsCache[table]) return tableColumnsCache[table]
  try {
    const { data: cols, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', table)
    if (error || !cols) {
      tableColumnsCache[table] = new Set<string>()
      return tableColumnsCache[table]
    }
    const s = new Set<string>((cols as any[]).map((c: any) => String(c.column_name)))
    tableColumnsCache[table] = s
    return s
  } catch (e) {
    tableColumnsCache[table] = new Set<string>()
    return tableColumnsCache[table]
  }
}

export async function tableExists(table: string): Promise<boolean> {
  const cols = await getTableColumns(table)
  return cols.size > 0
}
