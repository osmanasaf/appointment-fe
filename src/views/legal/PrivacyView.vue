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
          Gizlilik Politikası
        </h1>
        <p class="mb-8 text-sm text-slate-500">
          Son güncelleme: {{ lastUpdated }}
        </p>

        <div class="prose prose-slate max-w-none">
          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">1. Genel Bilgiler</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              Randevum ("Şirket", "biz", "bizim"), kullanıcılarının gizliliğini korumayı taahhüt eder. Bu Gizlilik Politikası, Randevum platformunu ("Hizmet") kullandığınızda kişisel verilerinizin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklar.
            </p>
            <p class="leading-relaxed text-slate-700">
              Hizmeti kullanarak bu Gizlilik Politikası'nı kabul etmiş olursunuz. Eğer bu politika ile ilgili herhangi bir endişeniz varsa, lütfen Hizmeti kullanmayı durdurunuz.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">2. Toplanan Bilgiler</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Hizmetimizi kullanırken aşağıdaki bilgileri toplayabiliriz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li><strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası, şifre (şifrelenmiş)</li>
              <li><strong>İşletme Bilgileri:</strong> İşletme adı, kategori, adres, çalışma saatleri, hizmet bilgileri</li>
              <li><strong>Randevu Bilgileri:</strong> Randevu tarihi, saati, hizmet detayları, notlar</li>
              <li><strong>Müşteri Bilgileri:</strong> Müşteri adı, iletişim bilgileri, randevu geçmişi, notlar</li>
              <li><strong>Teknik Bilgiler:</strong> IP adresi, tarayıcı türü, cihaz bilgisi, erişim zamanları</li>
              <li><strong>İletişim Verileri:</strong> WhatsApp mesajları, e-posta bildirimleri (içerik ve zaman damgası)</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">3. Bilgilerin Kullanım Amaçları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Randevu yönetim hizmetlerini sağlamak</li>
              <li>Kullanıcı hesaplarını oluşturmak ve yönetmek</li>
              <li>Randevu hatırlatmaları ve bildirimler göndermek (WhatsApp, SMS, e-posta)</li>
              <li>Müşteri desteği sağlamak</li>
              <li>Hizmetlerimizi iyileştirmek ve geliştirmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
              <li>Yasal yükümlülükleri yerine getirmek</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">4. Bilgilerin Paylaşımı</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Kişisel bilgilerinizi üçüncü taraflarla aşağıdaki durumlarda paylaşabiliriz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li><strong>Hizmet Sağlayıcılar:</strong> WhatsApp (Meta), e-posta servisleri (Resend), hosting sağlayıcıları</li>
              <li><strong>Yasal Zorunluluklar:</strong> Mahkeme kararları, yasal süreçler veya kamu otoritelerinin talepleri</li>
              <li><strong>İş Transferleri:</strong> Birleşme, satın alma veya varlık satışı durumunda</li>
            </ul>
            <p class="leading-relaxed text-slate-700">
              Kişisel verilerinizi pazarlama amacıyla üçüncü taraflara satmıyoruz veya kiralamıyoruz.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">5. Veri Saklama Süresi</h2>
            <p class="leading-relaxed text-slate-700">
              Kişisel verilerinizi yalnızca bu Gizlilik Politikası'nda belirtilen amaçlar için gerekli olduğu sürece saklarız. Hesabınızı sildiğinizde, kişisel verileriniz 90 gün içinde sistemlerimizden silinir. Yasal saklama yükümlülükleri olan veriler (örneğin fatura bilgileri) ilgili mevzuatın gerektirdiği süre boyunca saklanır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">6. Veri Güvenliği</h2>
            <p class="leading-relaxed text-slate-700">
              Kişisel verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri kullanırız:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>SSL/TLS şifreleme ile veri aktarımı</li>
              <li>Şifrelerin hash'lenerek saklanması</li>
              <li>Düzenli güvenlik güncellemeleri ve yama uygulamaları</li>
              <li>Erişim kontrolü ve yetkilendirme mekanizmaları</li>
              <li>Düzenli güvenlik denetimleri</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">7. Kullanıcı Hakları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li><strong>Erişim:</strong> Hangi kişisel verilerinizi işlediğimizi öğrenme hakkı</li>
              <li><strong>Düzeltme:</strong> Yanlış veya eksik bilgileri düzeltme hakkı</li>
              <li><strong>Silme:</strong> Kişisel verilerinizin silinmesini talep etme hakkı</li>
              <li><strong>İtiraz:</strong> Veri işlemeye itiraz etme hakkı</li>
              <li><strong>Taşınabilirlik:</strong> Verilerinizi yapılandırılmış, yaygın kullanılan formatta alma hakkı</li>
            </ul>
            <p class="leading-relaxed text-slate-700">
              Bu haklarınızı kullanmak için <a href="mailto:destek@randevum.pro" class="text-teal-600 hover:underline">destek@randevum.pro</a> adresinden bizimle iletişime geçebilirsiniz.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">8. Çerezler (Cookies)</h2>
            <p class="leading-relaxed text-slate-700">
              Hizmetimiz, kullanıcı deneyimini iyileştirmek için çerezler kullanır. Çerezler, cihazınıza yerleştirilen küçük metin dosyalarıdır. Oturum çerezleri (session cookies) ve kalıcı çerezler kullanarak oturum yönetimi, tercih saklama ve analiz yaparız. Tarayıcı ayarlarınızdan çerezleri reddedebilirsiniz ancak bu durumda bazı özellikler düzgün çalışmayabilir.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">9. Çocukların Gizliliği</h2>
            <p class="leading-relaxed text-slate-700">
              Hizmetimiz 18 yaşın altındaki bireylere yönelik değildir. Bilerek 18 yaşın altındaki kişilerden kişisel bilgi toplamıyoruz. Eğer 18 yaşın altında bir çocuğun kişisel bilgilerini topladığımızı fark ederseniz, lütfen bizimle iletişime geçin ve bu bilgileri derhal sileceğiz.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">10. Politika Değişiklikleri</h2>
            <p class="leading-relaxed text-slate-700">
              Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Değişiklikler bu sayfada yayınlandığı anda yürürlüğe girer. Önemli değişiklikler için e-posta ile bildirim gönderebiliriz. Gizlilik Politikası'nı düzenli olarak kontrol etmenizi öneririz.
            </p>
          </section>

          <section>
            <h2 class="mb-4 text-xl font-semibold text-slate-900">11. İletişim</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              Gizlilik Politikası ile ilgili sorularınız için:
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
  title: 'Gizlilik Politikası',
  description: 'Randevum gizlilik politikası ve kişisel veri işleme prensipleri. Verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi edinin.',
})
</script>
