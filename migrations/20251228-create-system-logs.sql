-- Create system_logs table for monitoring

CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('transaction', 'credit', 'error', 'slow')),
  type TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'SUCCESS', 'ERROR', 'SLOW')),
  source TEXT NOT NULL DEFAULT 'System',
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON public.system_logs (category);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON public.system_logs (severity);

-- Grant minimal select/insert privileges to anon/auth roles as appropriate (adjust to your RLS policies)
-- GRANT SELECT, INSERT ON public.system_logs TO anon, authenticated;
