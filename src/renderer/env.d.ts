/// <reference types="vite/client" />

import type { LiquidApi } from '../shared/api'

declare global {
  interface Window {
    liquid: LiquidApi
  }
}

export {}
