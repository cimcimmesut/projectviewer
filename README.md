# 🎠 Proje 3D Görüntüleyici — Kurulum Rehberi

Müşterilere özel oyun parkı tasarımlarını telefondan 3D görüntületen sistem.

---

## Dosya Yapısı
```
Project Viewer/
├── admin.html          ← Admin Panel (siz kullanırsınız)
├── viewer.html         ← Müşteri Görüntüleyici (müşteriye link gönderilir)
├── css/style.css
├── js/
│   ├── config.js       ← ⭐ Firebase bilgilerinizi buraya girin
│   ├── admin.js
│   └── viewer.js
├── firebase.json
├── firestore.rules
└── storage.rules
```

---

## 🚀 Kurulum (10 Dakika)

### Adım 1: Firebase Projesi Oluştur (Ücretsiz)
1. [console.firebase.google.com](https://console.firebase.google.com) → "Proje Ekle"
2. Proje adı girin → Devam edin
3. Sol menüden **Firestore Database** → "Veritabanı Oluştur" → **Test Modu**
4. Sol menüden **Storage** → "Başlayın" → **Test Modu**
5. Sol menüden **Hosting** → "Başlayın"

### Adım 2: Firebase Config'i Alın
1. Firebase Console → **Proje Ayarları** (⚙️ dişli ikonu)
2. Aşağı kaydırın → "Uygulamalarınız" → Web uygulaması ekle (</> ikonu)
3. Uygulama adı: "Project Viewer" → Kaydet
4. Çıkan `firebaseConfig` bilgilerini kopyalayın

### Adım 3: config.js'i Düzenleyin
`js/config.js` dosyasını açın ve Firebase bilgilerinizi girin:
```javascript
const FIREBASE_CONFIG = {
  apiKey: "BURAYA_YAPIŞTIRIN",
  authDomain: "BURAYA_YAPIŞTIRIN",
  // ...
};
```

### Adım 4: Firebase CLI Kurulumu ve Deploy
PowerShell'i yönetici olarak açın:
```powershell
# Node.js yoksa: nodejs.org'dan indirin
npm install -g firebase-tools
firebase login
firebase init         # Proje seçin, Hosting seçin
firebase deploy
```

Deploy sonrası size şöyle bir URL verilecek:
```
https://PROJE-ADINIZ.web.app
```

### Adım 5: config.js'de viewerBaseUrl'i Güncelleyin
```javascript
viewerBaseUrl: "https://PROJE-ADINIZ.web.app"
```
Tekrar deploy edin: `firebase deploy`

---

## 📱 Kullanım

### SketchUp'tan Export:
1. **Extensions → SimLab GLTF Exporter** (plugin kurun)
2. Modeli `.glb` olarak export edin
3. Hedef: < 50 MB (mobil için)

### Proje Yükleme:
1. `admin.html` açın (hosted URL veya local)
2. Şifre: `playground2024` (config.js'den değiştirebilirsiniz)
3. `.glb` dosyasını sürükleyin
4. Müşteri adı ve proje adı girin
5. "Yükle & Link Oluştur" butonuna basın
6. WhatsApp butonu ile müşteriye gönderin

### Müşteri Deneyimi:
- WhatsApp'tan linke tıklar
- Tarayıcıda 3D model açılır (uygulama indirme gerekmez)
- Android'de → "Gerçek Ortamda Gör" butonu ile AR

---

## ❓ Sık Sorulan Sorular

**S: Model çok büyük, yavaş yükleniyor?**
→ Blender'ı açın → File → Import → .glb → Mesh menüsü → Decimate modifier → Ratio: 0.3 → Export

**S: iPhone'da AR çalışmıyor?**
→ iPhone AR için USDZ formatı gerekiyor. Bu sürümde sadece Android AR desteklenir. 3D görüntüleme her cihazda çalışır.

**S: Admin şifremi nasıl değiştiririm?**
→ `js/config.js` → `adminPassword` satırını değiştirin → Firebase'e yeniden deploy edin

**S: Ücretsiz limitler neler?**
→ Firebase Spark (ücretsiz): Storage 1GB, Firestore 1GB, Hosting 1GB, 5GB/gün download. Test için yeterli.

---

## 🔒 Canlıya Almadan Önce

`firestore.rules` ve `storage.rules` dosyalarında `allow write: if true;` satırlarını
`allow write: if request.auth != null;` ile değiştirin ve Firebase Authentication ekleyin.

---

*Playground Production — 3D Proje Görüntüleyici Sistemi*
