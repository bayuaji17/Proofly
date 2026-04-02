import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { countAdmins, createAdmin } from './queries/admin.js'
import { pool } from './connection.js'

const emailSchema = z.email('Format email tidak valid.')

async function runSeed() {
  try {
    console.log('\n🔍 Mengecek ketersediaan admin...')
    const total = await countAdmins()
    if (total >= 1) {
      console.error('\n❌ [FAIL] Pendaftaran ditutup! Master Admin sudah terdaftar di database.')
      await pool.end()
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ Gagal mengecek admin database:', err)
    await pool.end()
    process.exit(1)
  }

  const rl = readline.createInterface({ input, output })

  console.log('\n🌟 Inisialisasi Akun Master Admin Proofly 🌟\n')

  try {
    let email = ''
    while (true) {
      email = await rl.question('Masukkan Email Admin: ')
      const parsed = emailSchema.safeParse(email)
      if (parsed.success) {
        break
      } else {
        console.error('❌', parsed.error.message)
      }
    }

    let password = ''
    while (true) {
      console.warn('⚠️  Perhatian: Input password akan terlihat di layar (Terminal).')
      password = await rl.question('Masukkan Password (harus min 6 karakter): ')
      if (password.length >= 6) {
        break
      } else {
        console.error('❌ Password terlalu pendek!')
      }
    }

    let confirmPassword = ''
    while (true) {
      confirmPassword = await rl.question('Konfirmasi Password: ')
      if (password === confirmPassword) {
        break
      } else {
        console.error('❌ Konfirmasi Password tidak sama, coba lagi!')
      }
    }

    console.log('\n⏳ Menyimpan data admin ke database...')
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)

    const admin = await createAdmin(email, hash)
    console.log(`✅ [SUCCESS] Akun admin master [${admin.email}] telah sukses dibuat! System Secured.\n`)

  } catch (err) {
    console.error('\n❌ Terjadi kesalahan internal script:', err)
  } finally {
    rl.close()
    await pool.end()
    process.exit(0)
  }
}

// Invoke seeder
runSeed()
