import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Header } from '#/components/layout/header'
import { Footer } from '#/components/layout/footer'
import { Search } from 'lucide-react'

const verifySearchSchema = z.object({
  sn: z.string().optional(),
})

export const Route = createFileRoute('/verify')({
  validateSearch: verifySearchSchema,
  head: () => ({
    meta: [{ title: 'Hasil Verifikasi — Proofly' }],
  }),
  component: VerifyPage,
})

function VerifyPage() {
  const { sn } = Route.useSearch()

  return (
    <div className="bg-slate-50 min-h-screen text-neutral-900 font-sans">
      <Header />

      <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm border border-slate-200">
          <div className="flex flex-col items-center text-center">
            
            {/* Minimal Icon Area */}
            <div className="relative mb-6">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                <Search className="size-6 text-primary" />
              </div>
            </div>

            <h1 className="mb-2 text-2xl font-display font-semibold tracking-tight">Status Pengecekan</h1>

            {sn ? (
              <div className="mt-4 w-full">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Identitas Serial
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      Processing
                    </span>
                  </div>
                  <p className="font-mono text-lg font-semibold tracking-widest text-neutral-900 text-left">
                    {sn}
                  </p>
                </div>
                <p className="mt-6 text-sm text-neutral-500 text-left">
                  Sistem mengeksekusi pemeriksaan *real-time* ke basis data. Tampilan *Verified/Counterfeit* final berjalan pada Sprint paralel.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Silakan masukkan <strong>Serial Number</strong> yang valid atau pindai QR code melalui antarmuka pemindai.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
