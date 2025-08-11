import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths'

export default defineConfig ({

	plugins: [react(),jsconfigPaths()],
	server: {
		port: 5002,
		open: '/',
		proxy: {
			'/api': {
				target: 'http://localhost:5001',
				changeOrigin: true,
				secure: false
			}
		}
	},
	preview: {
		port: 5002
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "src/components/global.scss";`
			}
		}
	}
});