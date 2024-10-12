import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy';
import InjectCssTo_gamePreloadPanel from './src/injectCss.js'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin(),
    copy({
      targets: [
        { src: 'src/preload/gamePanel.html', dest: 'out/preload' }
      ], hook: 'writeBundle' // Đảm bảo sao chép sau khi hoàn thành build
    }),
    InjectCssTo_gamePreloadPanel({ hook: 'closeBundle' })
    ],
    build: {
      rollupOptions: {
        input: {
          mainPreload: resolve(__dirname, 'src/preload/mainPreload.js'),
          gamePreload: resolve(__dirname, 'src/preload/gamePreload.js'),
        },
        output: {
          entryFileNames: '[name].js',
          dir: resolve(__dirname, 'out/preload')  // Thư mục xuất file preload
        }
      }
    }
  },
  renderer: {
    publicDir: resolve(__dirname, 'src/renderer/src/public'), // Chỉ định thư mục public
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
    ]
    , build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/renderer/index.html'),
        },
      }
    }
  }
})
