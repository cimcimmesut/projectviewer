-- =================================================================================
-- SUPABASE GÜVENLİK KURALLARI (ROW LEVEL SECURITY - RLS)
-- =================================================================================
-- Bu kodları Supabase Panelinizdeki "SQL Editor" sekmesine yapıştırıp çalıştırın (RUN).
-- =================================================================================

-- 1. "projects" tablosu (Veritabanı) için kurallar
-- ---------------------------------------------------------------------------------

-- RLS'yi aktif ediyoruz
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Herkes (müşteriler dahil) projeleri görüntüleyebilir
CREATE POLICY "Projeleri herkes okuyabilir" 
ON projects FOR SELECT 
USING (true);

-- Sadece sisteme giriş yapmış olan Admin'ler yeni proje yükleyebilir
CREATE POLICY "Sadece admin proje ekleyebilir" 
ON projects FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Sadece sisteme giriş yapmış olan Admin'ler proje güncelleyebilir
CREATE POLICY "Sadece admin proje guccelleyebilir" 
ON projects FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Sadece sisteme giriş yapmış olan Admin'ler proje silebilir
CREATE POLICY "Sadece admin proje silebilir" 
ON projects FOR DELETE 
USING (auth.role() = 'authenticated');


-- 2. "models" klasörü (Storage / Depolama) için kurallar
-- ---------------------------------------------------------------------------------
-- ! DİKKAT ! Eğer "models" isminde bir bucket oluşturmadıysanız önce Storage sekmesinden "models" adında bir Public kova oluşturun.

-- Herkes (müşteriler dahil) indirip görüntüleyebilir (3D açılması için şarttır)
CREATE POLICY "Modelleri herkes okuyabilir" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'models' );

-- Sadece sisteme Admin olarak giriş yapanlar dosya yükleyebilir
CREATE POLICY "Sadece admin model yukleyebilir" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'models' AND auth.role() = 'authenticated' );

-- Sadece sisteme Admin olarak giriş yapanlar dosya silebilir
CREATE POLICY "Sadece admin model silebilir" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'models' AND auth.role() = 'authenticated' );

-- Sadece sisteme Admin olarak giriş yapanlar dosya güncelleyebilir
CREATE POLICY "Sadece admin model guncelleyebilir" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'models' AND auth.role() = 'authenticated' );
