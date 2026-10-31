import { defineConfig } from 'vite';

// GitHub Pages 项目站点挂在 /TyphoonBattle/ 子路径下；
// 本地 dev/build 仍用根路径，避免 http://localhost:5173/TyphoonBattle/ 这种别扭地址。
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/TyphoonBattle/' : '/',
});
