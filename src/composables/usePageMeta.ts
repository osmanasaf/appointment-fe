import { onMounted, onUnmounted } from 'vue'

const DEFAULT_TITLE = 'Randevum'
const DEFAULT_DESCRIPTION =
  'Kuaför, güzellik merkezi, psikolog ve diyetisyen için WhatsApp entegreli online randevu ve müşteri yönetimi.'
const DEFAULT_IMAGE = 'https://randevum.tr/og-image.png'
const SITE_URL = 'https://randevum.tr'

export interface PageMetaOptions {
  title: string
  description?: string
  ogImage?: string
  /** Public booking için işletme slug'ı */
  slug?: string
  /** JSON-LD structured data nesnesi (stringify edilmiş olmadan gönder) */
  structuredData?: object
}

/**
 * Sayfa meta tag'lerini dinamik olarak yönetir.
 * Her route değişiminde çağrılmalı.
 *
 * Kullanım:
 *   usePageMeta({ title: 'Randevularım', description: 'Randevu yönetim paneli' })
 */
export function usePageMeta(options: PageMetaOptions) {
  const fullTitle = options.title
    ? `${options.title} — ${DEFAULT_TITLE}`
    : DEFAULT_TITLE

  const description = options.description ?? DEFAULT_DESCRIPTION
  const ogImage = options.ogImage ?? DEFAULT_IMAGE
  const canonicalUrl = options.slug
    ? `${SITE_URL}/b/${options.slug}`
    : SITE_URL

  let structuredDataScript: HTMLScriptElement | null = null

  onMounted(() => {
    // Sayfa başlığı
    document.title = fullTitle

    // Meta description
    setMeta('name', 'description', description)

    // Open Graph
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:locale', 'tr_TR')

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', ogImage)

    // Canonical
    setCanonical(canonicalUrl)

    // JSON-LD Structured Data
    if (options.structuredData) {
      structuredDataScript = document.createElement('script')
      structuredDataScript.type = 'application/ld+json'
      structuredDataScript.id = 'page-structured-data'
      structuredDataScript.textContent = JSON.stringify(options.structuredData)
      document.head.appendChild(structuredDataScript)
    }
  })

  onUnmounted(() => {
    // Component unmount olunca eklenen script'i temizle
    if (structuredDataScript) {
      structuredDataScript.remove()
      structuredDataScript = null
    }
    // Title'ı varsayılana döndür
    document.title = DEFAULT_TITLE
  })
}

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function setMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`,
  )
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attrName, attrValue)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Lifecycle hook kullanmadan meta tag'leri güncellemek için imperative API.
 * watch/async callback içinden çağrılabilir.
 */
export function setPageMeta(options: PageMetaOptions) {
  const fullTitle = options.title
    ? `${options.title} — ${DEFAULT_TITLE}`
    : DEFAULT_TITLE

  const description = options.description ?? DEFAULT_DESCRIPTION
  const ogImage = options.ogImage ?? DEFAULT_IMAGE
  const canonicalUrl = options.slug
    ? `${SITE_URL}/b/${options.slug}`
    : SITE_URL

  document.title = fullTitle
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:image', ogImage)
  setMeta('property', 'og:url', canonicalUrl)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:locale', 'tr_TR')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', fullTitle)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', ogImage)
  setCanonical(canonicalUrl)

  if (options.structuredData) {
    let existing = document.getElementById('page-structured-data')
    if (!existing) {
      existing = document.createElement('script')
      existing.setAttribute('type', 'application/ld+json')
      existing.id = 'page-structured-data'
      document.head.appendChild(existing)
    }
    existing.textContent = JSON.stringify(options.structuredData)
  }
}
