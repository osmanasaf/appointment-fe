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
          KVKK Aydınlatma Metni
        </h1>
        <p class="mb-8 text-sm text-slate-500">
          Son güncelleme: {{ lastUpdated }}
        </p>

        <div class="prose prose-slate max-w-none">
          <section class="mb-8">
            <p class="mb-4 leading-relaxed text-slate-700">
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verilerinizin işlenmesi hakkında sizleri aydınlatmak isteriz. Bu metin, veri sorumlusu sıfatıyla hareket eden Randevum'un, kişisel verilerinizi hangi amaçlarla işlediğini, kimlere aktardığını ve haklarınızın neler olduğunu açıklamaktadır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">1. Veri Sorumlusu</h2>
            <p class="leading-relaxed text-slate-700">
              Kişisel verileriniz, Randevum tarafından veri sorumlusu sıfatıyla işlenmektedir.
            </p>
            <div class="mt-4 rounded-lg bg-slate-50 p-4">
              <p class="mb-2 text-slate-700"><strong>İletişim Bilgileri:</strong></p>
              <p class="text-slate-700">E-posta: <a href="mailto:destek@randevum.tr" class="text-teal-600 hover:underline">destek@randevum.tr</a></p>
              <p class="text-slate-700">Web: <a href="https://randevum.tr" class="text-teal-600 hover:underline">https://randevum.tr</a></p>
            </div>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">2. İşlenen Kişisel Veriler</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Hizmetlerimizi kullanırken aşağıdaki kişisel veri kategorileri işlenmektedir:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li><strong>Kimlik Bilgileri:</strong> Ad, soyad</li>
              <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
              <li><strong>Müşteri İşlem Bilgileri:</strong> Randevu kayıtları, işlem geçmişi, hizmet tercihleri</li>
              <li><strong>İşletme Bilgileri:</strong> İşletme adı, kategori, adres, çalışma saatleri</li>
              <li><strong>Elektronik İşlem Güvenliği Bilgileri:</strong> IP adresi, çerez kayıtları, tarayıcı bilgisi</li>
              <li><strong>Finans Bilgileri:</strong> Ödeme kayıtları, fatura bilgileri (kart bilgileri saklanmaz)</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Randevu yönetim hizmetlerinin sunulması</li>
              <li>Kullanıcı hesaplarının oluşturulması ve yönetimi</li>
              <li>Randevu hatırlatmalarının gönderilmesi (WhatsApp, SMS, e-posta)</li>
              <li>Müşteri destek hizmetlerinin sağlanması</li>
              <li>Hizmet kalitesinin iyileştirilmesi ve yeni özelliklerin geliştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi (fatura düzenleme, kayıt saklama)</li>
              <li>Güvenlik önlemlerinin uygulanması ve dolandırıcılığın önlenmesi</li>
              <li>İstatistiksel analiz ve raporlama (anonim verilerle)</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">4. Kişisel Verilerin İşlenme Hukuki Sebepleri</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanarak işlenmektedir:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Açık rızanızın bulunması</li>
              <li>Sözleşmenin kurulması veya ifası için gerekli olması</li>
              <li>Hukuki yükümlülüğün yerine getirilmesi</li>
              <li>Meşru menfaatlerimiz (güvenlik, hizmet iyileştirme)</li>
              <li>Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">5. Kişisel Verilerin Aktarılması</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              Kişisel verileriniz, yukarıda belirtilen amaçlarla sınırlı olmak üzere aşağıdaki taraflara aktarılabilir:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li><strong>İş ortaklarımız:</strong> WhatsApp (Meta Platforms Inc.), e-posta servisi sağlayıcıları (Resend)</li>
              <li><strong>Hizmet sağlayıcılarımız:</strong> Bulut sunucu hizmet sağlayıcıları, teknik destek sağlayıcıları</li>
              <li><strong>Yasal yükümlülükler:</strong> Kamu kurum ve kuruluşları (mahkeme kararı, yasal talep)</li>
            </ul>
            <p class="leading-relaxed text-slate-700">
              Yurt dışına veri aktarımı yapılması durumunda KVKK'nın 9. maddesine uygun olarak gerekli önlemler alınmaktadır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">6. Veri Toplama Yöntemi</h2>
            <p class="leading-relaxed text-slate-700">
              Kişisel verileriniz, Randevum web sitesi ve mobil uygulamaları üzerinden elektronik ortamda otomatik veya otomatik olmayan yöntemlerle, sözleşme ilişkisi içerisinde olunan kişilerden, e-posta yoluyla ve işletmenizin kaydettiği müşteri verilerinden toplanmaktadır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">7. Kişisel Veri Sahibinin Hakları</h2>
            <p class="mb-3 leading-relaxed text-slate-700">
              KVKK'nın 11. maddesi uyarınca, kişisel veri sahipleri olarak aşağıdaki haklara sahipsiniz:
            </p>
            <ul class="mb-4 ml-6 list-disc space-y-2 text-slate-700">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
              <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme veya yok edilme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">8. Haklarınızı Nasıl Kullanabilirsiniz?</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              Yukarıda belirtilen haklarınızı kullanmak için başvurunuzu aşağıdaki yöntemlerle iletebilirsiniz:
            </p>
            <div class="mb-4 rounded-lg bg-slate-50 p-4">
              <p class="mb-2 text-slate-700"><strong>E-posta:</strong> <a href="mailto:destek@randevum.tr" class="text-teal-600 hover:underline">destek@randevum.tr</a></p>
              <p class="text-slate-700"><strong>Web sitesi:</strong> Kullanıcı panelinizdeki "Hesap Ayarları" bölümünden</p>
            </div>
            <p class="mb-3 leading-relaxed text-slate-700">
              Başvurularınız, talebinizin niteliğine göre en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır. Ancak işlemin ayrıca bir maliyeti gerektirmesi durumunda, Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
            </p>
            <p class="leading-relaxed text-slate-700">
              Başvurunuzda; adınız, soyadınız, başvuru yazılı ise imzanız, T.C. kimlik numaranız, ikamet veya işyeri adresiniz, e-posta adresi, telefon ve faks numaranız, talep konunuz bulunmalıdır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">9. Veri Güvenliği</h2>
            <p class="leading-relaxed text-slate-700">
              Randevum, kişisel verilerinizin güvenliğini sağlamak için KVKK'nın 12. maddesi uyarınca gerekli teknik ve idari tedbirleri almaktadır. Verileriniz SSL/TLS şifreleme ile korunmakta, erişim kontrolleri uygulanmakta ve düzenli güvenlik denetimleri yapılmaktadır.
            </p>
          </section>

          <section class="mb-8">
            <h2 class="mb-4 text-xl font-semibold text-slate-900">10. Veri Saklama Süresi</h2>
            <p class="leading-relaxed text-slate-700">
              Kişisel verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanmaktadır. Hesabınızı silmeniz durumunda, kişisel verileriniz yasal saklama yükümlülüğü olan veriler hariç 90 gün içinde silinir veya anonim hale getirilir.
            </p>
          </section>

          <section>
            <h2 class="mb-4 text-xl font-semibold text-slate-900">11. İletişim</h2>
            <p class="mb-4 leading-relaxed text-slate-700">
              KVKK kapsamındaki haklarınız ve kişisel veri işleme faaliyetlerimiz hakkında detaylı bilgi almak için:
            </p>
            <div class="rounded-lg bg-slate-50 p-4">
              <p class="text-slate-700">
                <strong>E-posta:</strong> <a href="mailto:destek@randevum.tr" class="text-teal-600 hover:underline">destek@randevum.tr</a>
              </p>
              <p class="mt-2 text-slate-700">
                <strong>Kişisel Verileri Koruma Kurumu:</strong> <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener" class="text-teal-600 hover:underline">www.kvkk.gov.tr</a>
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
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin işlenmesi, saklanması ve haklarınız hakkında aydınlatma metni.',
})
</script>
