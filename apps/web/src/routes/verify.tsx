import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Header } from '#/components/layout/header'
import { Footer } from '#/components/layout/footer'
import { ResultGenuine } from '#/components/verification/result-genuine'
import { ResultCounterfeit } from '#/components/verification/result-counterfeit'
import { ResultNotFound } from '#/components/verification/result-not-found'
import { verifySerialNumber } from '#/lib/queries/verify'
import { ApiError } from '#/lib/api'
import { Loader2, ShieldCheck } from 'lucide-react'

const verifySearchSchema = z.object({
  sn: z.string().optional(),
})

export const Route = createFileRoute('/verify')({
  validateSearch: verifySearchSchema,
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Hasil Verifikasi — Proofly' },
      {
        name: 'description',
        content: 'Hasil verifikasi keaslian produk — Proofly',
      },
    ],
  }),
  component: VerifyPage,
})

function VerifyPage() {
  const { sn } = Route.useSearch()
  const navigate = useNavigate()

  const { data, error, isPending, isError, isSuccess } = useQuery({
    queryKey: ['verify', sn],
    queryFn: () => {
      let latitude = 0
      let longitude = 0

      try {
        const geoStr = sessionStorage.getItem('proofly_geo')
        if (geoStr) {
          const geo = JSON.parse(geoStr)
          latitude = geo.latitude ?? 0
          longitude = geo.longitude ?? 0
        }
      } catch {
        // fallback to 0,0
      }

      return verifySerialNumber({
        serial_number: sn as string,
        latitude,
        longitude,
      })
    },
    enabled: !!sn,
    retry: false,
    staleTime: Infinity, // Prevent refetching when window regains focus
  })

  useEffect(() => {
    if (!sn) {
      navigate({ to: '/' })
    }
  }, [sn, navigate])

  const errorMessage =
    error instanceof ApiError && error.status === 429
      ? 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa saat.'
      : error?.message || 'Gagal memverifikasi. Silakan coba lagi.'

  return (
    <div className="bg-slate-50 min-h-screen text-neutral-900 font-sans selection:bg-primary/20">
      <Header />

      <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col items-center justify-center px-4 py-12">
        {/* Loading */}
        {isPending && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="size-8 text-primary" />
              </div>
              <Loader2 className="absolute -right-1 -bottom-1 size-6 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-neutral-900">Memverifikasi...</p>
              <p className="text-sm text-neutral-500 mt-1 font-mono tracking-wider">
                {sn}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="w-full max-w-md rounded-2xl border border-error/20 bg-white p-8 shadow-sm text-center">
            <p className="text-error font-semibold mb-2">Verifikasi Gagal</p>
            <p className="text-sm text-neutral-500 mb-6">{errorMessage}</p>
            <a href="/" className="btn btn-primary btn-sm">
              Coba Lagi
            </a>
          </div>
        )}

        {/* Results */}
        {isSuccess && (
          <div className="w-full max-w-md mt-8">
            {/* Serial Number Header */}
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Serial Number
              </p>
              <p className="font-mono text-lg font-semibold tracking-widest text-neutral-900">
                {sn}
              </p>
            </div>

            {/* Render by status */}
            {data.status === 'genuine' && (
              <ResultGenuine data={data} />
            )}
            {data.status === 'counterfeit' && (
              <ResultCounterfeit data={data} />
            )}
            {data.status === 'not_found' && <ResultNotFound />}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

