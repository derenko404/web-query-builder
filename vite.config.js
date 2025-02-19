/** @type {import('vite').UserConfig} */
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default {
  build: {
    outDir: resolve(__dirname, 'build'),
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/core/index.ts'),
      formats: ['es', 'umd', 'cjs'],
      name: 'WebQueryBuilder',
      // the proper extensions will be added
      fileName: 'web-query-builder',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['./src/tests'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
}
