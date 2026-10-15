import { cleanDatabase, cleanRedis, seedStaff } from './db.js'

// Start from a clean slate: remove leftovers of an earlier run, then create the staff accounts
export default async function globalSetup() {
  await cleanDatabase()
  await cleanRedis()
  await seedStaff()
}
