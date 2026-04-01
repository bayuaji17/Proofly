import fs from 'node:fs'
import path from 'node:path'
import { pool } from './connection.js'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

const runMigrations = async () => {
  console.log('🚀 Running database migrations...')
  try {
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    
    for (const file of files) {
      console.log(`⏳ Executing ${file}...`)
      const filePath = path.join(migrationsDir, file)
      const query = fs.readFileSync(filePath, 'utf8')
      await pool.query(query)
      console.log(`✅ Finished ${file}`)
    }
    
    console.log('🎉 All migrations ran successfully!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await pool.end()
  }
}

runMigrations()
