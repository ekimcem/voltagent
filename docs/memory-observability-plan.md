# Memory Observability Genişleme Planı

Bu doküman, VoltAgent ve VoltOps ekosisteminde bellek (conversation history + working memory) görünürlüğünü ilk sınıf vatandaş haline getirmek için izleyeceğimiz rotayı anlatır. CPO olarak hedefim, hem backend hem de VoltOps arayüzünün güvenli, performanslı ve sürdürülebilir biçimde gelişmesini sağlamak.

## 1. Amaç ve Başarı Kriterleri

- **Tek Kaynaktan Görünürlük:** VoltOps içinde tüm kullanıcılar, konuşmalar ve working memory kayıtlarına tek bir ekrandan erişim.
- **Agent Drill-Down:** Observability > Agent detay sayfasında, o ajana bağlı memory varlıklarını hızla filtreleme.
- **Performans ve Güvenlik:** Paginasyon, filtreleme, yetkilendirme politikaları ve `safeStringify` kullanımımı garanti altına alma.
- **Tip Güvenliği ve Tutarlılık:** Hem server hem console tarafında paylaşılan DTO tiplerinin TypeScript ile tam uyumlu olması.

## 2. Fazlara Göre Yol Haritası

### Faz 0 – Hazırlık ve Analiz

1. Mevcut memory adapter’larının (Postgres, Supabase, LibSQL, InMemory) kullanıcı / konuşma sorgusu yeteneklerini gözden geçir.
2. Agent registry üzerinden memory’e erişim noktalarını haritalandır.
3. API sözleşmesi için shared paketinde kullanılacak tip taslağını oluştur.

### Faz 1 – Server-Core Genişletmeleri

1. `packages/server-core` altında yeni handler seti oluştur (`memory.handlers.ts`).
   - Kullanıcı listesi (`listUsers`) – agentId opsiyonel.
   - Konuşma listesi (`queryConversations`) – agentId, userId ve pagination destekli.
   - Konuşma mesajları (`getMessages`).
   - Working memory endpoint’i (user veya conversation scope).
2. Tüm handler’larda `safeStringify`, hata yönetimi ve logging standartlarına uy.
3. Gerekirse storage adapter’lara ek metot ekle; Postgres/Supabase tarafında SQL indekslerini kontrol et.
4. `routes/definitions.ts` içine “Memory Observability” bölümünü ekle; yeni rotaları `OBSERVABILITY_ROUTES` altında topla.
5. Hem Hono (`packages/server-hono`) hem serverless Hono’da route registration yap ve mevcut log tarzını uygula.
6. Unit test’ler: in-memory adapter ile handler davranışlarını doğrula.
7. Integration test’ler: Postgres adapter + yeni API’ler için happy/sad path senaryoları çalıştır.

### Faz 2 – Tip Sözleşmeleri ve Çapraz Depo Senkronizasyonu

1. Backend tarafında kullanılacak DTO ve response tiplerini `packages/server-core` içinde açıkça export et.
2. Console projesi ayrı bir codebase olduğundan, aynı tipleri VoltOps deposunda manuel olarak çoğalt; değişiklik olduğunda senkron tutmak için kısa vadede checklist ve PR template notu ekle.
3. Orta vadede REST/OpenAPI şemasından otomatik tip üretimi değerlendirilerek iki repo arasında drift riskini düşür.
4. Gerekirse VoltOps SDK veya client katmanlarında ek helper fonksiyonlar tanımla.

### Faz 3 – VoltOps Global Memory Sayfası

1. VoltOps sol navigasyona yeni “Memory” sekmesini ekle.
2. Sayfa yapısı:
   - Üst filtre: agent seçimi (tek/çoklu), arama kutusu, pagination kontrolü.
   - Sol panel: kullanıcı listesi (global default).
   - Orta panel: seçilen kullanıcıya ait konuşmalar.
   - Sağ panel: konuşma mesajları + working memory görünümü (Markdown/JSON toggle).
3. React Query kullanımıyla cache/paginasyon stratejisini uygula; yoğun dataset’lerde incremental fetch.
4. UI bileşenlerini (listeler, detaya geçişler) component testleriyle doğrula.
5. Büyük veri setlerinde performans için sanal listeleme (opsiyonel) değerlendirilir.

### Faz 4 – Observability Page Entegrasyonu

1. Mevcut Observability agent sayfasına “Memory” tab/sekme ekle.
2. Seçili agentId için aynı API’leri filtreli çağır; kullanıcı listesi global olduğu için kullanıcı seçimi ortak komponentten beslensin.
3. Agent değiştiğinde query’leri invalid et; Observability navigation state ile entegrasyon.
4. UI testleri: agent bazlı memory drill-down senaryoları.

### Faz 5 – Dokümantasyon ve Yayın

1. `docs` altında yeni veya mevcut dokümanlarda (örn. `docs/tooling.md` veya yeni `docs/observability-memory.md`) API ve UI kullanım rehberini yaz.
2. OpenTelemetry + memory korelasyonunun nasıl yapılacağını anlatan kısa rehber ekle.
3. Sürüm notlarına (CHANGELOG) ek bilgi gir.
4. Feature flag / config gerekiyorsa CLI veya server config dokümanına ekle.

## 3. Riskler ve Alınacak Önlemler

- **Büyük Dataset:** Global sorgular için limit/offset zorunlu; backend’de upper bound belirle.
- **Çoklu Adapter Tutarlılığı:** Tüm storage adapter’larında aynı davranışı sağlamak için test matrisini genişlet.
- **Auth & RBAC:** Mevcut auth katmanı memory endpoint’lerini kapsıyor mu kontrol et; gerekirse middleware genişlet.
- **UI State Kompleksliği:** Aynı kullanıcıyı birden fazla agent’ta gösterirken veri tekilleştirme stratejisi test edilmeli.

## 4. Başarı Metrikleri

- API çağrılarında <200 ms median latency (lokal Postgres referansı).
- UI’da memory listesi 10k kayıt altında <1 s ilk render.
- Test kapsamı: yeni handler’lar için >80% coverage, console bileşenleri için kritik path testleri.
- Kullanıcı geri bildirimi: VoltOps ekibinden “memory keşfi kolaylığı” metriklerini toplamak.

## 5. İletişim ve İş Birliği

- Backend ve Console takımları haftalık sync ile durum paylaşacak.
- QA sürecinde gerçek çalışma verisiyle staging testleri yapılacak.
- Açık kaynak katkıları için CONTRIBUTING’e kısa not eklemek (endpoint’ler ve UI bileşenleri).

Bu planı sprint’lere bölerken fazları ardışık ama kısmi release edilebilir tutalım. Özellikle Faz 1 tamamlandığında API’leri feature flag ile açıp VoltOps ekibinin erken geri bildirimini almak kritik.
