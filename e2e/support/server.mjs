// Everything the tests need besides the app itself, in one process:
//  - an SMTP server that records every email the app sends
//  - a "monitored API" whose health the tests can switch
//  - a small HTTP control API so tests (running in other processes) can read mail and flip health
//  - the monitor worker, started once the API is up
import http from 'node:http'
import net from 'node:net'
import { spawn } from 'node:child_process'

import { backendDir, backendEnv, ports } from './env.js'

const mails = []
let healthy = true

const decodeQuotedPrintable = (text) => text.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

const smtp = net.createServer((socket) => {
  socket.on('error', () => {})
  socket.write('220 sink ESMTP\r\n')
  let buffer = ''
  let inData = false
  let loginStep = 0
  let current = { to: [], raw: '' }

  socket.on('data', (chunk) => {
    buffer += chunk
    let end
    while ((end = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)

      if (inData) {
        if (line === '.') {
          inData = false
          const raw = decodeQuotedPrintable(current.raw)
          mails.push({ to: current.to, subject: (raw.match(/^Subject: (.*)$/m) || [])[1] ?? '', raw, at: Date.now() })
          current = { to: [], raw: '' }
          socket.write('250 OK queued\r\n')
        } else {
          current.raw += (line.startsWith('..') ? line.slice(1) : line) + '\r\n'
        }
        continue
      }
      if (loginStep === 1) { loginStep = 2; socket.write('334 UGFzc3dvcmQ6\r\n'); continue }
      if (loginStep === 2) { loginStep = 0; socket.write('235 ok\r\n'); continue }

      const command = line.toUpperCase()
      if (command.startsWith('EHLO') || command.startsWith('HELO')) socket.write('250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n')
      else if (command.startsWith('AUTH PLAIN')) socket.write('235 ok\r\n')
      else if (command.startsWith('AUTH LOGIN')) { loginStep = 1; socket.write('334 VXNlcm5hbWU6\r\n') }
      else if (command.startsWith('RCPT TO')) { current.to.push(line.match(/<(.*)>/)[1].toLowerCase()); socket.write('250 OK\r\n') }
      else if (command === 'DATA') { inData = true; socket.write('354 go\r\n') }
      else if (command === 'QUIT') { socket.write('221 bye\r\n'); socket.end() }
      else socket.write('250 OK\r\n')
    }
  })
})

const json = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

const control = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  if (url.pathname === '/ready') return json(response, 200, { ok: true })
  if (url.pathname === '/mails' && request.method === 'GET') {
    const to = url.searchParams.get('to')?.toLowerCase()
    return json(response, 200, to ? mails.filter((m) => m.to.includes(to)) : mails)
  }
  if (url.pathname === '/mails/clear' && request.method === 'POST') {
    mails.length = 0
    return json(response, 200, { ok: true })
  }
  if (url.pathname === '/target' && request.method === 'POST') {
    healthy = url.searchParams.get('state') !== 'down'
    return json(response, 200, { healthy })
  }
  return json(response, 404, { ok: false })
})

const target = http.createServer((request, response) => {
  response.writeHead(healthy ? 200 : 500)
  response.end(healthy ? 'ok' : 'down')
})

await new Promise((resolve) => smtp.listen(ports.smtp, '127.0.0.1', resolve))
await new Promise((resolve) => target.listen(ports.target, '127.0.0.1', resolve))
await new Promise((resolve) => control.listen(ports.control, '127.0.0.1', resolve))

// The worker needs the API's database and Redis, and runs the checks the tests watch for
let worker
const waitForApi = async () => {
  for (let attempt = 0; attempt < 120; attempt++) {
    if ((await fetch(`http://localhost:${ports.api}/health-check`).catch(() => null))?.ok) return true
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}
if (await waitForApi()) {
  worker = spawn('node', ['worker.js'], { cwd: backendDir, env: { ...backendEnv(), WORKER_CONCURRENCY: '5' }, stdio: 'ignore' })
}

const shutdown = () => {
  worker?.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
