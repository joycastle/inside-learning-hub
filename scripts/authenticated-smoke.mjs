/**
 * Production-safe authenticated API smoke test.
 *
 * Required: E2E_BASE_URL and E2E_SESSION_COOKIE from a real, already logged-in
 * test account. It never performs writes unless E2E_ALLOW_MUTATIONS=true.
 */
const baseUrl = (process.env.E2E_BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '')
const cookie = process.env.E2E_SESSION_COOKIE
if (!cookie) throw new Error('缺少 E2E_SESSION_COOKIE：请从已登录的测试浏览器会话提供 Cookie')

const expectStatus = async (path, expected = 200) => {
  const response = await fetch(`${baseUrl}${path}`, { headers: { Cookie: cookie, Accept: 'application/json' } })
  if (response.status !== expected) throw new Error(`${path}: expected ${expected}, got ${response.status}`)
  return response
}

await expectStatus('/api/v1/auth/me')
await expectStatus('/api/v1/content/announcements')
await expectStatus('/api/v1/content/knowledge-articles')
await expectStatus('/api/v1/content/reference-documents')
await expectStatus('/api/v1/learning/enrollments')

const isAdmin = process.env.E2E_EXPECT_ADMIN === 'true'
if (isAdmin) {
  await expectStatus('/api/v1/admin/training/paths')
  await expectStatus('/api/v1/admin/feishu/organization')
  await expectStatus('/api/v1/admin/departments')
  await expectStatus('/api/v1/admin/content/questions')
  await expectStatus('/api/v1/admin/content/knowledge-articles')
  await expectStatus('/api/v1/admin/content/reference-documents')
}

if (process.env.E2E_MEDIA_ID) await expectStatus(`/api/v1/media/${encodeURIComponent(process.env.E2E_MEDIA_ID)}/signed-url`)
if (process.env.E2E_UNIT_ID) await expectStatus(`/api/v1/learning/units/${encodeURIComponent(process.env.E2E_UNIT_ID)}`)

console.log(JSON.stringify({ ok: true, baseUrl, role: isAdmin ? 'admin' : 'employee', checked: 'authenticated-api-smoke' }))
