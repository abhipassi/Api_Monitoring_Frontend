import { cleanDatabase, cleanRedis } from './db.js'

export default async function globalTeardown() {
  await cleanDatabase()
  await cleanRedis()
}
