import { defineConfig, type Plugin } from 'vite'
import solid from 'vite-plugin-solid'
import { viteSingleFile } from 'vite-plugin-singlefile'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, copyFileSync, cpSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function viteCopyPublic(): Plugin {
  return {
    name: 'vite-plugin-copy-public',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const faviconSrc = resolve(__dirname, 'public/favicon.svg')
      const faviconDest = resolve(distDir, 'favicon.svg')
      if (existsSync(distDir) && existsSync(faviconSrc)) {
        copyFileSync(faviconSrc, faviconDest)
      }
      // Copy geo and flags directories to dist for async loading
      const dirs = [
        { src: resolve(__dirname, 'public/geo'), dest: resolve(distDir, 'geo') },
        { src: resolve(__dirname, 'public/flags'), dest: resolve(distDir, 'flags') },
      ];
      for (const { src, dest } of dirs) {
        if (existsSync(src)) {
          cpSync(src, dest, { recursive: true });
        }
      }
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), solid(), viteSingleFile(), viteCopyPublic()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'es2023',
    copyPublicDir: true
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
