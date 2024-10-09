import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          mainPreload: resolve(__dirname, 'src/preload/mainPreload.js'),
          gamePreload: resolve(__dirname, 'src/preload/gamePreload.js')
        },
        output: {
          entryFileNames: '[name].js',
          dir: resolve(__dirname, 'out/preload')  // Thư mục xuất file preload
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      copy({
        targets: [{ src: 'src/renderer/assets/**/*', dest: 'dist/renderer/assets' }],
      }),
    ]
    , build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/renderer/index.html'),
          game: resolve(__dirname, 'src/renderer/game.html')
        }
      }
    }
  }
})
