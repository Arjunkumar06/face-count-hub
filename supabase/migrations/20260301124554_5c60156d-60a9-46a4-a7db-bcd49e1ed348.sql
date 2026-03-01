
-- Create scans table
CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scans" ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for scan images
INSERT INTO storage.buckets (id, name, public) VALUES ('scan-images', 'scan-images', true);

CREATE POLICY "Anyone can view scan images" ON storage.objects FOR SELECT USING (bucket_id = 'scan-images');
CREATE POLICY "Authenticated users can upload scan images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scan-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own scan images" ON storage.objects FOR DELETE USING (bucket_id = 'scan-images' AND auth.uid()::text = (storage.foldername(name))[1]);
