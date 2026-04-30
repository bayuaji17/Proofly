import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Header } from '#/components/layout/header'
import { Footer } from '#/components/layout/footer'
import { QrScanner } from '#/components/verification/qr-scanner'
import { SerialInput } from '#/components/verification/serial-input'
import { useGeolocation } from '#/hooks/use-geolocation'
import {
  ScanLine,
  Keyboard,
  MapPin,
  Loader2,
  ShieldCheck,
  BarChart3,
  Globe,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Proofly — Verifikasi Keaslian Produk' },
      {
        name: 'description',
        content:
          'Verifikasi keaslian produk secara real-time dengan scan QR code atau input serial number. Platform anti-pemalsuan terpercaya.',
      },
    ],
  }),
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const { coordinates, status, error, requestPermission } = useGeolocation()
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan')

  // Auto-request geolocation on mount
  useEffect(() => {
    if (status === 'idle') {
      requestPermission()
    }
  }, [status, requestPermission])

  const locationReady = status === 'granted' && coordinates != null
  const handleVerify = (serialNumber: string) => {
    if (!coordinates) return

    // Store coordinates in sessionStorage for verify page
    sessionStorage.setItem(
      'proofly_geo',
      JSON.stringify({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }),
    )

    navigate({ to: '/verify', search: { sn: serialNumber } })
  }

  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans selection:bg-primary/20">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative px-6 pt-28 pb-8 lg:pt-36 lg:pb-12 max-w-7xl mx-auto text-center">
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <ShieldCheck className="size-4" />
              Platform Anti-Pemalsuan
            </div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl leading-[1.1]">
              Verifikasi Keaslian Produk
            </h1>
            <p className="mt-6 text-lg text-neutral-500 sm:text-xl/8 max-w-xl mx-auto">
              Pastikan produk Anda asli dengan scan QR code atau masukkan serial
              number secara manual.
            </p>
          </div>
        </section>

        {/* Verification Box */}
        <section className="px-6 pb-20 max-w-lg mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/50">
            {/* Geolocation Gate */}
            {status === 'requesting' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="size-8 text-primary animate-spin" />
                <p className="text-sm text-neutral-500">
                  Meminta izin lokasi...
                </p>
              </div>
            )}

            {(status === 'denied' || status === 'error') && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-error/10">
                  <MapPin className="size-7 text-error" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-neutral-900">
                    Akses Lokasi Diperlukan
                  </p>
                  <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                    {error ||
                      'Izinkan akses lokasi di pengaturan browser Anda untuk melakukan verifikasi produk.'}
                  </p>
                </div>
                <button
                  onClick={requestPermission}
                  className="btn btn-primary btn-sm gap-2 mt-2"
                >
                  <MapPin className="size-4" />
                  Coba Lagi
                </button>
              </div>
            )}

            {status === 'idle' && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <MapPin className="size-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-neutral-900">
                    Izinkan Akses Lokasi
                  </p>
                  <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                    Lokasi diperlukan untuk memverifikasi keaslian produk dan
                    mendeteksi aktivitas mencurigakan.
                  </p>
                </div>
                <button
                  onClick={requestPermission}
                  className="btn btn-primary gap-2 mt-2"
                >
                  <MapPin className="size-4" />
                  Izinkan Lokasi
                </button>
              </div>
            )}

            {locationReady && (
              <>
                {/* Location confirmed badge */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-success/5 border border-success/15 px-3 py-2 mb-6">
                  <MapPin className="size-3.5 text-success" />
                  <span className="text-xs font-medium text-success">
                    Lokasi terdeteksi
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('scan')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === 'scan'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                  >
                    <ScanLine className="size-4" />
                    Scan QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === 'manual'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                  >
                    <Keyboard className="size-4" />
                    Input Manual
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'scan' ? (
                  <QrScanner onScan={handleVerify} />
                ) : (
                  <SerialInput onSubmit={handleVerify} />
                )}
              </>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-20 sm:py-24 border-t border-slate-200/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-14">
              <h2 className="text-base/7 font-semibold text-primary">
                Mengapa Proofly?
              </h2>
              <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Perlindungan produk yang terpercaya
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3 lg:max-w-5xl">
              <FeatureCard
                icon={<ShieldCheck className="size-6 text-primary" />}
                title="Verifikasi Real-time"
                description="Hasil verifikasi instan dan akurat langsung dari database terpusat."
              />
              <FeatureCard
                icon={<BarChart3 className="size-6 text-primary" />}
                title="Deteksi Pemalsuan"
                description="Algoritma cerdas mendeteksi pola scan mencurigakan secara otomatis."
              />
              <FeatureCard
                icon={<Globe className="size-6 text-primary" />}
                title="Pelacakan Lokasi"
                description="Peta distribusi scan untuk memantau peredaran produk secara global."
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/20">
          {icon}
        </div>
      </div>
      <h3 className="font-heading text-base font-semibold text-neutral-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  )
}
