-- Create storage policies for chat-media bucket
CREATE POLICY "Anyone can view chat media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can upload chat media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Users can update their own chat media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-media');

CREATE POLICY "Users can delete their own chat media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-media');