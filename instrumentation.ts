import { assertProductionConfig } from './src/lib/runtime-config'

export function register() {
  assertProductionConfig()
}
