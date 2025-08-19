-- Create table for WebRTC signaling
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate', 'call-start', 'call-end'
  signal_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for call signals
CREATE POLICY "Users can view signals for their calls" 
ON public.call_signals 
FOR SELECT 
USING (sender = auth.uid()::text OR receiver = auth.uid()::text);

CREATE POLICY "Users can create signals for their calls" 
ON public.call_signals 
FOR INSERT 
WITH CHECK (sender = auth.uid()::text);

-- Add to realtime
ALTER TABLE public.call_signals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;