import 'server-only'

const insecureDefaults = new Set([
  'demo-session-secret-change-before-production-2026',
  'development-only-payload-secret-change-me',
  'minioadmin',
  'postgres',
])

const required = (name: string, errors: string[]) => {
  const value = process.env[name]?.trim()
  if (!value) errors.push(`${name} 未配置`)
  return value
}

export function assertProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return

  const errors: string[] = []
  if (process.env.DEMO_MODE !== 'false') errors.push('DEMO_MODE 必须设置为 false')

  const appUrl = required('APP_URL', errors)
  if (appUrl && !appUrl.startsWith('https://')) errors.push('APP_URL 必须使用 HTTPS')

  for (const name of ['SESSION_SECRET', 'PAYLOAD_SECRET', 'DATABASE_URL', 'FEISHU_APP_ID', 'FEISHU_APP_SECRET']) {
    const value = required(name, errors)
    if (value && insecureDefaults.has(value)) errors.push(`${name} 仍在使用开发默认值`)
  }

  if (process.env.MINIO_ENABLED === 'true') {
    for (const name of ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET']) {
      const value = required(name, errors)
      if (value && insecureDefaults.has(value)) errors.push(`${name} 仍在使用开发默认值`)
    }
  }

  if (errors.length) throw new Error(`生产配置校验失败：\n- ${errors.join('\n- ')}`)
}
