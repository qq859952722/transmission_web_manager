import { defineConfig, type Plugin } from 'vite'
import solid from 'vite-plugin-solid'
import { viteSingleFile } from 'vite-plugin-singlefile'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, readdirSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, basename, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const VIRTUAL_MMDB_ID = 'virtual:inline-mmdb'
const VIRTUAL_MMDB_RESOLVED = '\0' + VIRTUAL_MMDB_ID
const VIRTUAL_FLAGS_ID = 'virtual:inline-flags'
const VIRTUAL_FLAGS_RESOLVED = '\0' + VIRTUAL_FLAGS_ID

function viteInlineAssets(): Plugin {
  return {
    name: 'vite-plugin-inline-assets',
    resolveId(id) {
      if (id === VIRTUAL_MMDB_ID) return VIRTUAL_MMDB_RESOLVED
      if (id === VIRTUAL_FLAGS_ID) return VIRTUAL_FLAGS_RESOLVED
    },
    load(id) {
      if (id === VIRTUAL_MMDB_RESOLVED) {
        const mmdbPath = resolve(__dirname, 'public/geo/dbip-country-lite-2026-05.mmdb')
        const buf = readFileSync(mmdbPath)
        const base64 = buf.toString('base64')
        return `export default "${base64}";`
      }
      if (id === VIRTUAL_FLAGS_RESOLVED) {
        const flagsDir = resolve(__dirname, 'public/flags')
        const files = readdirSync(flagsDir).filter(f => f.endsWith('.svg'))
        const entries: string[] = []
        for (const f of files) {
          const code = basename(f, '.svg')
          const content = readFileSync(resolve(flagsDir, f), 'utf-8')
          const encoded = content.replace(/"/g, "'").replace(/\n/g, '').replace(/\r/g, '')
          entries.push(`  "${code}": "data:image/svg+xml,${encodeURIComponent(encoded)}"`)
        }
        return `export default {\n${entries.join(',\n')}\n};`
      }
    },
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const faviconSrc = resolve(__dirname, 'public/favicon.svg')
      const faviconDest = resolve(distDir, 'favicon.svg')
      if (existsSync(distDir) && existsSync(faviconSrc)) {
        copyFileSync(faviconSrc, faviconDest)
      }
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), solid(), viteInlineAssets(), viteSingleFile()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Only copy favicon.svg from public, mmdb and flags are inlined via virtual modules
    copyPublicDir: false
  },
  server: {
    proxy: {
      '/transmission/rpc': {
        target: process.env.TR_RPC_URL || 'http://localhost:9091',
        changeOrigin: true
      }
    }
  }
})
