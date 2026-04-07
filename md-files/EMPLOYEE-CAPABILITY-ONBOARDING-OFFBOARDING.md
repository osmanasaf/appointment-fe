# Employee Capability, Onboarding & Offboarding — Frontend Dokümantasyonu

**Tarih:** 7 Nisan 2026  
**Branch:** `feature/employee-capability`  
**Kapsam:** Çalışan yetkinlik yönetimi, çalışma takvimi, onboarding ve offboarding akışları

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [TypeScript Tipleri](#2-typescript-tipleri)
3. [API Referansı](#3-api-referansı)
4. [Onboarding Akışı](#4-onboarding-akışı)
5. [Offboarding Akışı](#5-offboarding-akışı)
6. [Yetkinlik Yönetimi](#6-yetkinlik-yönetimi)
7. [Çalışma Takvimi](#7-çalışma-takvimi)
8. [Public Booking Akışı (Müşteri)](#8-public-booking-akışı-müşteri)
9. [Hata Kodları](#9-hata-kodları)
10. [Kullanım Örnekleri](#10-kullanım-örnekleri)

---

## 1. Genel Bakış

Bu modülle birlikte çalışan yönetimi birkaç yeni kavram kazandı:

| Kavram | Açıklama |
|--------|----------|
| **Capability** | Bir çalışanın hangi hizmetleri verebileceğini tanımlar. Randevu oluştururken zorunlu kontrol yapılır. |
| **SkillLevel** | Çalışanın o hizmetteki yeterlilik seviyesi. Opsiyonel fiyat/süre farkı tanımlanabilir. |
| **WorkingSchedule** | Çalışanın hangi günlerde, hangi saatlerde çalıştığını tanımlar. İşletme saatini override edebilir. |
| **Onboarding** | Yeni çalışan `INACTIVE` başlar → yetkinlik atanır → takvim tanımlanır → `ACTIVE` yapılır. |
| **Offboarding** | Ayrılan çalışanın gelecek randevuları iptal edilir veya başka çalışana atanır, ardından `INACTIVE` yapılır. |

### Önemli Kırıklık Değişikliği

`EmployeeResponse` artık yeni alanlar içeriyor. Mevcut bileşenlerde kullanılan `EmployeeResponse` tipini güncelleyin:

```diff
- id, businessId, name, phoneNumber, email, bio, profileImageUrl, status, owner, createdAt
+ id, businessId, name, **title**, phoneNumber, email, bio, profileImageUrl, status, owner,
+   **experienceYears**, **acceptsOnlineBooking**, createdAt
```

Public API'de `getAvailableSlots` ve `getAvailableDates` içindeki `employeeId` artık **opsiyonel**. Verilmezse yetkin tüm çalışanların slotları birleştirilir.

---

## 2. TypeScript Tipleri

Tüm tipler `src/api/employee.ts` dosyasındadır.

### EmployeeResponse

```typescript
interface EmployeeResponse {
  id: number
  businessId: number
  name: string
  title: string | null           // YENİ: "Kıdemli Stilist" gibi
  phoneNumber: string | null
  email: string | null
  bio: string | null
  profileImageUrl: string | null
  status: 'ACTIVE' | 'INACTIVE'
  owner: boolean
  experienceYears: number | null // YENİ
  acceptsOnlineBooking: boolean  // YENİ
  createdAt: string
}
```

### EmployeeCapabilityResponse

```typescript
interface EmployeeCapabilityResponse {
  id: number
  employeeId: number
  serviceId: number
  serviceName: string
  customDurationMinutes: number | null  // null → hizmet varsayılanı kullanılır
  customPrice: number | null            // null → hizmet varsayılanı kullanılır
  skillLevel: 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'EXPERT'
  active: boolean
  createdAt: string
}
```

### EmployeeScheduleResponse

```typescript
interface EmployeeScheduleResponse {
  id: number
  employeeId: number
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string    // "09:00:00"
  endTime: string      // "18:00:00"
  breakStart: string | null
  breakEnd: string | null
  closed: boolean      // true → o gün çalışmıyor
}
```

### Offboarding Tipleri

```typescript
type OffboardAction = 'CANCEL_ALL' | 'REASSIGN_ALL'

interface AffectedAppointmentResponse {
  id: number
  customerId: number
  serviceId: number
  scheduledAt: string
  status: 'PENDING' | 'CONFIRMED' | 'RISKY'
}

interface OffboardSummaryResponse {
  affectedAppointmentCount: number
  action: OffboardAction
  reassignedToEmployeeId: number | null
}
```

---

## 3. API Referansı

Tüm endpoint'ler `Authorization: Bearer <token>` gerektirir (public endpoint'ler hariç).

### Çalışan CRUD

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/v1/employees?businessId=&activeOnly=` | İşletmenin çalışanları |
| `POST` | `/api/v1/employees` | Yeni çalışan oluştur (`INACTIVE` başlar) |
| `GET` | `/api/v1/employees/{id}` | Çalışan detayı |
| `PUT` | `/api/v1/employees/{id}` | Profil güncelle |
| `POST` | `/api/v1/employees/{id}/activate` | `ACTIVE` yap |
| `POST` | `/api/v1/employees/{id}/deactivate` | `INACTIVE` yap |
| `DELETE` | `/api/v1/employees/{id}` | Çalışanı sil |

### Yetkinlik (Capability) Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/v1/employees/{id}/capabilities` | Çalışanın yetkinlikleri |
| `POST` | `/api/v1/employees/{id}/capabilities` | Yetkinlik ata / güncelle |
| `DELETE` | `/api/v1/employees/{id}/capabilities/{serviceId}` | Yetkinliği kaldır |
| `GET` | `/api/v1/services/{id}/employees` | Hizmeti yapabilen çalışanlar |

### Takvim (Schedule) Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/v1/employees/{id}/schedule` | Çalışanın haftalık takvimi |
| `POST` | `/api/v1/employees/{id}/schedule` | Gün takvimi tanımla / güncelle |

### Offboarding Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/v1/employees/{id}/offboard-preview` | Etkilenecek randevuların önizlemesi |
| `POST` | `/api/v1/employees/{id}/offboard` | Offboarding işlemini başlat |

### Public Endpoint'ler (kimlik doğrulama gerekmez)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/api/v1/public/businesses/{slug}/services/{serviceId}/employees` | Hizmeti yapabilen çalışanlar (public) |
| `GET` | `/api/v1/public/businesses/{slug}/availability?serviceId=&date=[&employeeId=]` | Müsait slotlar (employeeId opsiyonel) |
| `GET` | `/api/v1/public/availability?businessId=&serviceId=&date=[&employeeId=]` | Müsait slotlar (businessId ile) |

---

## 4. Onboarding Akışı

Yeni bir çalışan oluşturulduğunda **`INACTIVE`** statüsüyle başlar. Admin'in şu adımları tamamlaması gerekir:

```
1. Çalışan oluştur (INACTIVE)
        ↓
2. Yapabileceği hizmetleri ata (capabilities)
        ↓
3. Çalışma günlerini / saatlerini tanımla (schedule)  ← opsiyonel, işletme saatini devralır
        ↓
4. Çalışanı aktifleştir (ACTIVE)
```

### Adım 1 — Çalışan Oluştur

```typescript
const { data } = await employeeApi.create({
  businessId: 1,
  name: 'Ayşe Kaya',
  title: 'Kıdemli Stilist',
  email: 'ayse@salon.com',
  phoneNumber: '5551234567',
  bio: '10 yıl deneyimli saç stilisti',
})
// data.data.status === 'INACTIVE'
```

**Request Body:**

```json
{
  "businessId": 1,
  "name": "Ayşe Kaya",
  "title": "Kıdemli Stilist",
  "email": "ayse@salon.com",
  "phoneNumber": "5551234567",
  "bio": "10 yıl deneyimli saç stilisti",
  "owner": false
}
```

### Adım 2 — Yetkinlik Ata

```typescript
await employeeApi.assignCapability(employeeId, {
  serviceId: 3,
  skillLevel: 'SENIOR',
  customDurationMinutes: 45,  // opsiyonel — hizmet 60 dk ama bu çalışan 45'te bitirir
  customPrice: 350,           // opsiyonel — hizmet 200 TL ama bu çalışan 350 TL
})
```

**Request Body:**

```json
{
  "serviceId": 3,
  "skillLevel": "SENIOR",
  "customDurationMinutes": 45,
  "customPrice": 350
}
```

> Aynı çalışana aynı hizmeti tekrar atarsanız `UPSERT` davranışı gösterir — mevcut kayıt güncellenir.

### Adım 3 — Takvim Tanımla (Opsiyonel)

Takvim tanımlanmazsa çalışan işletmenin çalışma saatlerini devralır. Farklı günler için ayrı ayrı `POST` yapın:

```typescript
// Pazartesi 10:00–17:00
await employeeApi.setDaySchedule(employeeId, {
  dayOfWeek: 'MONDAY',
  startTime: '10:00',
  endTime: '17:00',
  breakStart: '13:00',
  breakEnd: '14:00',
  closed: false,
})

// Pazar — çalışmıyor
await employeeApi.setDaySchedule(employeeId, {
  dayOfWeek: 'SUNDAY',
  closed: true,
})
```

**Önemli:** `closed: true` gönderildiğinde `startTime`/`endTime` görmezden gelinir.

### Adım 4 — Aktifleştir

```typescript
await employeeApi.activate(employeeId)
// status: 'ACTIVE' → artık randevu alabilir
```

### UI Öneri: Onboarding Sihirbazı

```
Step 1: Temel Bilgiler   → CreateEmployeeRequest
Step 2: Hizmet Seç       → AssignCapabilityRequest (çoklu seçim)
Step 3: Takvim (opsiyonel) → EmployeeScheduleRequest (7 gün için)
Step 4: Özet & Aktifleştir → POST /activate
```

---

## 5. Offboarding Akışı

Çalışan ayrılmadan önce gelecekteki randevularını yönetmek gerekir.

### Adım 1 — Önizleme

Offboarding başlatmadan önce kaç randevunun etkileneceğini gösterin:

```typescript
const { data } = await employeeApi.offboardPreview(employeeId)
// data.data: AffectedAppointmentResponse[]
```

**Response:**

```json
[
  {
    "id": 42,
    "customerId": 15,
    "serviceId": 3,
    "scheduledAt": "2026-04-15T10:00:00",
    "status": "CONFIRMED"
  },
  {
    "id": 43,
    "customerId": 22,
    "serviceId": 3,
    "scheduledAt": "2026-04-16T14:00:00",
    "status": "PENDING"
  }
]
```

**Önizleme boşsa:** Çalışanın gelecek randevusu yok demektir — doğrudan `deactivate` kullanabilirsiniz.

### Adım 2 — Eylem Seçimi

İki seçenek sunun:

#### Seçenek A: Tüm Randevuları İptal Et

```typescript
const { data } = await employeeApi.offboard(employeeId, {
  action: 'CANCEL_ALL',
})
```

- Tüm PENDING/CONFIRMED/RISKY randevular iptal edilir
- `AppointmentCancelled` event'i tetiklenir (müşteri bildirimi)
- Çalışan `INACTIVE` yapılır
- Tüm yetkinlikler kaldırılır

#### Seçenek B: Başka Çalışana Ata

```typescript
// Önce: yeni çalışanın bu hizmetler için yetkinliği var mı kontrol edin
const { data } = await employeeApi.offboard(employeeId, {
  action: 'REASSIGN_ALL',
  newEmployeeId: 7,
})
```

- Tüm randevular `newEmployeeId`'ye yeniden atanır
- Yeni çalışanın her hizmet için yetkinliği olmak **zorunda** (olmayan varsa 422 döner)
- Çalışan `INACTIVE` yapılır

**Response (her iki seçenekte):**

```json
{
  "affectedAppointmentCount": 2,
  "action": "CANCEL_ALL",
  "reassignedToEmployeeId": null
}
```

```json
{
  "affectedAppointmentCount": 2,
  "action": "REASSIGN_ALL",
  "reassignedToEmployeeId": 7
}
```

### UI Öneri: Offboarding Diyaloğu

```
┌─────────────────────────────────────────────┐
│  Ayşe Kaya — Ayrılış İşlemi                │
├─────────────────────────────────────────────┤
│  ⚠️  2 adet gelecek randevu etkilenecek     │
│                                             │
│  • 15 Nis 10:00 — Saç Kesimi (Müşteri: 15) │
│  • 16 Nis 14:00 — Saç Kesimi (Müşteri: 22) │
│                                             │
│  Ne yapılsın?                               │
│  ○ Tüm randevuları iptal et                 │
│  ● Başka çalışana ata:  [Mehmet ▼]          │
│                                             │
│  [İptal]              [Offboard'u Başlat]  │
└─────────────────────────────────────────────┘
```

**Dikkat:** `REASSIGN_ALL` seçildiğinde `newEmployeeId` zorunludur. `newEmployeeId` olmadan gönderilirse `400 Bad Request` döner.

---

## 6. Yetkinlik Yönetimi

### Çalışanın Yetkinliklerini Listele

```typescript
const { data } = await employeeApi.getCapabilities(employeeId)
// data.data: EmployeeCapabilityResponse[]
```

### Yetkinlik Ata / Güncelle

Aynı çalışan + hizmet kombinasyonu zaten varsa **güncelleme** yapar (upsert):

```typescript
await employeeApi.assignCapability(employeeId, {
  serviceId: 5,
  skillLevel: 'EXPERT',
  // customDurationMinutes ve customPrice verilmezse hizmet değerleri kullanılır
})
```

### Yetkinliği Kaldır

Siler değil, `active: false` yapar. Sonradan tekrar atanabilir:

```typescript
await employeeApi.removeCapability(employeeId, serviceId)
```

### Bir Hizmeti Yapabilen Çalışanları Listele (Admin)

```typescript
// GET /api/v1/services/{serviceId}/employees
const { data } = await serviceApi.getCapableEmployees(serviceId)
```

### SkillLevel Görüntüleme Önerisi

```typescript
const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  JUNIOR: 'Junior',
  INTERMEDIATE: 'Deneyimli',
  SENIOR: 'Kıdemli',
  EXPERT: 'Uzman',
}

const SKILL_LEVEL_COLORS: Record<SkillLevel, string> = {
  JUNIOR: 'text-gray-500',
  INTERMEDIATE: 'text-blue-500',
  SENIOR: 'text-green-500',
  EXPERT: 'text-purple-500',
}
```

---

## 7. Çalışma Takvimi

### Takvimi Getir

```typescript
const { data } = await employeeApi.getSchedule(employeeId)
// data.data: EmployeeScheduleResponse[]
// Tanımlı günler döner — tanımsız günler için işletme saati kullanılır
```

### Gün Takvimi Tanımla

Her gün için ayrı `POST` yapın. Aynı gün için tekrar `POST` yaparsanız **güncelleme** yapar:

```typescript
const days: EmployeeScheduleRequest[] = [
  { dayOfWeek: 'MONDAY',    startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 'TUESDAY',   startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 'THURSDAY',  startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 'FRIDAY',    startTime: '09:00', endTime: '16:00' },
  { dayOfWeek: 'SATURDAY',  closed: true },
  { dayOfWeek: 'SUNDAY',    closed: true },
]

await Promise.all(days.map(d => employeeApi.setDaySchedule(employeeId, d)))
```

### Slot Hesaplama Mantığı

Availability hesaplanırken:

1. İşletme o gün açık mı? (`BusinessWorkingHours`)
2. Çalışanın o gün takvimi var mı?
   - **Var ve `closed: true`** → o gün slot yok
   - **Var ve açık** → işletme saati ile çalışan saatinin **kesişimi** alınır
   - **Yok** → işletme saati kullanılır

```
İşletme:  09:00 ──────────────── 18:00
Çalışan:       10:00 ──── 17:00
Kesişim:       10:00 ──── 17:00  ← slotlar buradan üretilir
```

---

## 8. Public Booking Akışı (Müşteri)

### Hizmet Seçimi Sonrası Çalışan Listeleme

```typescript
// Belirli bir hizmeti yapabilen çalışanları getir
const { data } = await publicApi.getEmployeesForService(slug, serviceId)
// Sadece yetkinliği olan ve ACTIVE çalışanlar döner
```

### Müsait Slot Sorgulama

#### Çalışan seçilmeden (herhangi biri)

```typescript
const { data } = await publicApi.getAvailableSlotsBySlug(slug, serviceId, '2026-04-15')
// Tüm yetkin çalışanların slotları birleştirilir, tekrarlar kaldırılır
```

#### Belirli çalışan seçiliyken

```typescript
const { data } = await publicApi.getAvailableSlotsBySlug(slug, serviceId, '2026-04-15', employeeId)
// Sadece o çalışanın slotları, capability + özel süre dikkate alınarak
```

### Önerilen Booking Akışı (UI)

```
1. Hizmeti seç
        ↓
2. "Çalışan seçin (opsiyonel)" → publicApi.getEmployeesForService()
   [ Farketmez | Ayşe | Mehmet ]
        ↓
3. Tarih seç → publicApi.getAvailableDates(slug, serviceId, 30, employeeId?)
        ↓
4. Saat seç → publicApi.getAvailableSlotsBySlug(slug, serviceId, date, employeeId?)
        ↓
5. Müşteri bilgileri → publicApi.createAppointment(slug, { employeeId, ... })
```

> Müşteri "Farketmez" seçerse `employeeId` göndermeyebilirsiniz. Backend o hizmet için yetkin tüm çalışanların müsait slotlarını döner.

---

## 9. Hata Kodları

| HTTP | Kod | Açıklama | UI Aksiyonu |
|------|-----|----------|-------------|
| `422` | `CAPABILITY_NOT_FOUND` | Çalışanın bu hizmeti yapma yetkinliği yok | "Bu çalışan seçilen hizmeti yapamamaktadır" |
| `422` | `SLOT_NOT_AVAILABLE` | Seçilen saatte çakışma var | "Bu saat dolu, lütfen başka bir saat seçin" |
| `404` | `ENTITY_NOT_FOUND` | Çalışan/hizmet bulunamadı | Sayfaya yönlendir |
| `400` | `VALIDATION_ERROR` | Gerekli alan eksik (örn. `newEmployeeId`) | Form validasyon mesajı göster |
| `409` | `DUPLICATE_APPOINTMENT` | Aynı telefon + saat için randevu var | "Bu saat için randevunuz bulunuyor" |

---

## 10. Kullanım Örnekleri

### Yetkinlik Yönetim Sayfası (Composable)

```typescript
// composables/useEmployeeCapabilities.ts
import { ref } from 'vue'
import { employeeApi, type EmployeeCapabilityResponse, type AssignCapabilityRequest } from '@/api/employee'

export function useEmployeeCapabilities(employeeId: number) {
  const capabilities = ref<EmployeeCapabilityResponse[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const { data } = await employeeApi.getCapabilities(employeeId)
      capabilities.value = data.data ?? []
    } finally {
      loading.value = false
    }
  }

  async function assign(body: AssignCapabilityRequest) {
    const { data } = await employeeApi.assignCapability(employeeId, body)
    if (data.data) capabilities.value.push(data.data)
  }

  async function remove(serviceId: number) {
    await employeeApi.removeCapability(employeeId, serviceId)
    capabilities.value = capabilities.value.filter(c => c.serviceId !== serviceId)
  }

  return { capabilities, loading, load, assign, remove }
}
```

### Offboarding Diyaloğu (Composable)

```typescript
// composables/useOffboarding.ts
import { ref, computed } from 'vue'
import { employeeApi, type AffectedAppointmentResponse, type OffboardAction } from '@/api/employee'

export function useOffboarding(employeeId: number) {
  const preview = ref<AffectedAppointmentResponse[]>([])
  const loading = ref(false)
  const hasAffected = computed(() => preview.value.length > 0)

  async function loadPreview() {
    loading.value = true
    try {
      const { data } = await employeeApi.offboardPreview(employeeId)
      preview.value = data.data ?? []
    } finally {
      loading.value = false
    }
  }

  async function execute(action: OffboardAction, newEmployeeId?: number) {
    const { data } = await employeeApi.offboard(employeeId, { action, newEmployeeId })
    return data.data
  }

  return { preview, loading, hasAffected, loadPreview, execute }
}
```

### Haftalık Takvim Formu

```typescript
// Tüm haftayı tek seferde kaydet
const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const

async function saveWeeklySchedule(employeeId: number, defaultStart = '09:00', defaultEnd = '18:00') {
  const requests = WEEKDAYS.map(day =>
    employeeApi.setDaySchedule(employeeId, {
      dayOfWeek: day,
      startTime: defaultStart,
      endTime: defaultEnd,
    })
  )
  // Cumartesi ve Pazar kapalı
  requests.push(
    employeeApi.setDaySchedule(employeeId, { dayOfWeek: 'SATURDAY', closed: true }),
    employeeApi.setDaySchedule(employeeId, { dayOfWeek: 'SUNDAY', closed: true }),
  )
  await Promise.all(requests)
}
```

---

*Bu dokümantasyon `feature/employee-capability` branch'i için güncel olup `appointment-frontend/md-files/` altında saklanmaktadır.*
