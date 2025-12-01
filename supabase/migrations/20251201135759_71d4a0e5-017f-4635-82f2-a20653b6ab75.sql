-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- The table is already in the supabase_realtime publication by default
-- but we'll ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
