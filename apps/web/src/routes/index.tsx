import { createFileRoute, Link } from '@tanstack/react-router'
import { Header } from '#/components/layout/header'
import { Footer } from '#/components/layout/footer'
import { ScanLine, Keyboard } from 'lucide-react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Proofly — Real-time detection and response' }],
  }),
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans selection:bg-primary/20">
      <Header />

      <main>
        {/* Stark Hero Section */}
        <section className="relative px-6 pt-32 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 pb-24">
          
          {/* Left Text Content */}
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:pt-8 flex-1">
            <h1 className="font-display text-5xl font-semibold tracking-tight text-neutral-900 sm:text-7xl leading-[1.1]">
              Real-time verification and incident response
            </h1>
            <p className="mt-8 text-lg font-medium text-neutral-500 sm:text-xl/8">
              Automate operations from insight to action with Proofly powering fraud detection, anti-counterfeit, and moderation teams.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/verify"
                className="rounded-full bg-primary px-6 py-3.5 text-sm/6 font-semibold text-primary-content shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all"
              >
                Mulai Verifikasi
              </Link>
            </div>
          </div>

          {/* Right Mockup/Graphic */}
          <div className="flex-1 w-full max-w-2xl lg:max-w-none">
            <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200/50 shadow-sm relative overflow-hidden">
              <img 
                src="/b2b-dashboard.png" 
                alt="Proofly Dashboard Mockup" 
                className="w-full rounded-lg shadow-sm border border-neutral-200/80 object-cover"
              />
            </div>
          </div>

        </section>

        {/* Gray Background Bottom Section */}
        <section className="bg-slate-50 py-24 sm:py-32 border-t border-slate-200/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-base/7 font-semibold text-primary">Operasi Berkelanjutan</h2>
              <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                Verifikasi terpusat tanpa hambatan
              </p>
              <p className="mt-6 text-lg/8 text-neutral-600">
                Lakukan pengujian dan pemantauan dari berbagai cara, terintegrasi langsung dengan satu klik menuju sistem analisis.
              </p>
            </div>

            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:max-w-4xl">
              {/* Card 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
                    <ScanLine className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-neutral-900">Scan QR Code</h3>
                  </div>
                  <div className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Active
                  </div>
                </div>
                <p className="text-sm text-neutral-500">
                  Integrasi modul pemindai presisi cerdas memanfaatkan kamera perangkat langsung via peramban web B2B.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20">
                    <Keyboard className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-neutral-900">Input Serial Number</h3>
                  </div>
                   <div className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Active
                  </div>
                </div>
                <p className="text-sm text-neutral-500">
                  Sinkronisasi validasi baris karakter (*Serial Number*) secara asinkron menembus filter *rate-limited* infrastruktur.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
