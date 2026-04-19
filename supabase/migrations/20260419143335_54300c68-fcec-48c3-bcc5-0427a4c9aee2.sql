DROP POLICY IF EXISTS "Authenticated users can upload scan images" ON storage.objects;

CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scan-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );