export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      host: 'localhost',
    }
  }
})