<template>
  <div class="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-sm text-teal-600 transition hover:text-teal-700"
        >
          <ArrowLeft class="size-4" />
          Ana sayfaya dön
        </RouterLink>
      </div>

      <div class="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
        <h1 class="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          Kullanım Koşulları
        </h1>
        <p class="mb-8 text-sm text-slate-500">
          Son güncelleme: {{ lastUpdated }}
        </p>

        <div class="prose prose-slate max-w-none">
          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">1. Hizmetin Tanımı</h2>
            <p class="leading-relaxed text-slate-700">
              Randevum, işletmelerin müşterileriyle randevu oluşturmasını, yönetmesini ve takip etmesini sağlayan bir SaaS (Software as a Service) platformudur. Hizmetimiz, online rezervasyon, WhatsApp hatırlatmaları, müşteri yönetimi, takvim entegrasyonu ve raporlama özellikleri içerir.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">2. Kullanım Kabul Şartları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Bu Hizmeti kullanarak aşağıdaki şartları kabul etmiş olursunuz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>18 yaşında veya daha büyük olduğunuzu</li>
              <li>Kayıt sırasında verdiğiniz bilgilerin doğru ve güncel olduğunu</li>
              <li>Hesabınızın güvenliğinden sorumlu olduğunuzu</li>
              <li>Hizmeti yalnızca yasal amaçlar için kullanacağınızı</li>
              <li>Türkiye Cumhuriyeti yasalarına ve bu Kullanım Koşulları'na uyacağınızı</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">3. Hesap Oluşturma ve Güvenlik</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              Hizmeti kullanmak için bir hesap oluşturmanız gerekmektedir. Hesabınızı oluştururken:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Geçerli bir e-posta adresi ve güçlü bir şifre kullanmalısınız</li>
              <li>Hesap bilgilerinizi güvende tutmaktan ve yetkisiz erişimi önlemekten siz sorumlusunuz</li>
              <li>Hesabınızda gerçekleşen tüm aktivitelerden siz sorumlusunuz</li>
              <li>Yetkisiz erişim veya güvenlik ihlali durumunda derhal bize bildirmelisiniz</li>
              <li>Bir kişi veya kuruluş yalnızca bir hesap oluşturabilir</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">4. Hizmet Kullanım Kuralları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Hizmeti kullanırken aşağıdaki davranışlar yasaktır:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Başkalarının hesaplarına yetkisiz erişim</li>
              <li>Spam, kötü amaçlı yazılım veya zararlı içerik yayma</li>
              <li>Hizmetin güvenliğini tehlikeye atmaya çalışmak</li>
              <li>Ters mühendislik, decompile veya kaynak kodunu çıkarmaya çalışmak</li>
              <li>API limitleri aşmak veya sistem kaynaklarını kötüye kullanmak</li>
              <li>Yanıltıcı, hileli veya yasa dışı amaçlar için kullanmak</li>
              <li>Telif hakkı veya fikri mülkiyet haklarını ihlal etmek</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">5. Ücretlendirme ve Ödeme</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              Randevum şu anda 14 gün ücretsiz deneme sunmaktadır. Deneme süresi sonunda:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Ücretli planlara geçiş için sizinle iletişime geçilecektir</li>
              <li>Fiyatlar ve paket detayları web sitemizde ve kullanıcı panelinizde belirtilmektedir</li>
              <li>Ödemeler aylık veya yıllık olarak tahsil edilebilir</li>
              <li>Fiyatları değiştirme hakkımız saklıdır; değişiklikler 30 gün önceden bildirilir</li>
              <li>İade politikası: Ödeme sonrası 7 gün içinde herhangi bir nedenle iptal edebilir ve tam iade alabilirsiniz</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">6. Hizmetin Kullanılabilirliği</h2>
            <p class="leading-relaxed text-slate-700">
              Hizmeti olduğu gibi ("as is") sağlarız. %99.5 uptime hedefliyoruz ancak aşağıdaki durumlar için kesintisiz hizmet garanti etmiyoruz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Planlı bakım çalışmaları (önceden bildirilir)</li>
              <li>Acil güvenlik güncellemeleri</li>
              <li>Kontrol dışı teknik sorunlar (sunucu arızası, ağ kesintisi, vb.)</li>
              <li>Üçüncü taraf hizmet kesintileri (WhatsApp, e-posta servisleri)</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">7. İçerik ve Fikri Mülkiyet</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              <strong>Sizin İçeriğiniz:</strong> Hizmete yüklediğiniz tüm içeriğin (müşteri verileri, randevu notları, fotoğraflar) sorumluluğu size aittir. İçeriğinizi yalnızca hizmeti size sağlamak için kullanırız.
            </p>
            <p class="leading-relaxed text-slate-700">
              <strong>Bizim İçeriğimiz:</strong> Randevum platformu, logosu, markası, tasarımı, kaynak kodu ve dokümantasyonu dahil tüm fikri mülkiyet hakları Randevum'a aittir. Bu haklara saygı göstermeniz gerekmektedir.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">8. Veri Saklama ve Yedekleme</h2>
            <p class="leading-relaxed text-slate-700">
              Verilerinizi güvenli sunucularda saklarız ve düzenli yedeklemeler yaparız. Ancak veri kaybına karşı kendi yedeklerinizi almanızı öneririz. Hesabınızı sildiğinizde, verileriniz 90 gün içinde sistemlerimizden tamamen silinir. Bu süre içinde hesap geri yükleme talebinde bulunabilirsiniz.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">9. Sorumluluk Sınırlamaları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Yasaların izin verdiği ölçüde, Randevum aşağıdaki durumlardan sorumlu değildir:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Hizmetin kullanımından veya kullanılamamasından kaynaklanan dolaylı zararlar</li>
              <li>Veri kaybı veya hasarı (düzenli yedekleme yapmanız önerilir)</li>
              <li>Üçüncü taraf hizmetlerinden (WhatsApp, e-posta servisleri) kaynaklanan sorunlar</li>
              <li>Kullanıcının güvenlik ihmali nedeniyle oluşan zararlar</li>
              <li>Kullanıcının bu Koşulları ihlal etmesinden kaynaklanan durumlar</li>
            </ul>
            <p class="leading-relaxed text-slate-700">
              Toplam sorumluluk miktarımız, son 12 ayda ödediğiniz ücretle sınırlıdır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">10. Hesap Askıya Alma ve Fesih</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              <strong>Sizin tarafınızdan:</strong> Hesabınızı istediğiniz zaman kullanıcı panelinden veya destek ekibimize yazarak kapatabilirsiniz.
            </p>
            <p class="mb-3 leading-relaxed text-slate-700">
              <strong>Bizim tarafımızdan:</strong> Aşağıdaki durumlarda hesabınızı askıya alabilir veya sonlandırabiliriz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Bu Kullanım Koşulları'nın ihlali</li>
              <li>Ödeme yükümlülüklerinin yerine getirilmemesi</li>
              <li>Yasadışı aktivite veya şüpheli davranış</li>
              <li>Diğer kullanıcılara veya Hizmete zarar verme</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">11. Değişiklikler</h2>
            <p class="leading-relaxed text-slate-700">
              Bu Kullanım Koşulları'nı zaman zaman güncelleyebiliriz. Önemli değişiklikler için e-posta ile bilgilendirileceksiniz. Değişikliklerin yayınlanmasından sonra Hizmeti kullanmaya devam ederseniz, yeni koşulları kabul etmiş sayılırsınız.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">12. Uygulanacak Hukuk</h2>
            <p class="leading-relaxed text-slate-700">
              Bu Kullanım Koşulları Türkiye Cumhuriyeti yasalarına tabidir. Herhangi bir uyuşmazlık durumunda İstanbul mahkemeleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 class="mb-4 text-xl font-semibold text-slate-900">13. İletişim</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              Kullanım Koşulları ile ilgili sorularınız için:
            </p>
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-slate-700">
                <strong>E-posta:</strong> <a href="mailto:destek@randevum.pro" class="text-teal-600 hover:underline">destek@randevum.pro</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { usePageMeta } from '@/composables/usePageMeta'

const lastUpdated = '13 Nisan 2026'

usePageMeta({
  title: 'Kullanım Koşulları',
  description: 'Randevum kullanım koşulları ve hizmet şartları. Platformumuzu kullanırken uymanız gereken kurallar ve haklarınız hakkında bilgi edinin.',
})
</script>
