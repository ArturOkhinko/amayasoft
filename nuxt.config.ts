// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css', '~/assets/css/paywall.css'],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'theme-color', content: '#f9fafb' },
        { name: 'description', content: 'Тестовый пейволл: выбор тарифа и покупка' },
      ],
      link: [
        { rel: 'preload', href: '/fonts/Inter-Regular.woff', as: 'font', type: 'font/woff', crossorigin: '' },
        { rel: 'preload', href: '/fonts/Inter-SemiBold.woff', as: 'font', type: 'font/woff', crossorigin: '' },
        { rel: 'preload', href: '/fonts/Inter-Bold.woff', as: 'font', type: 'font/woff', crossorigin: '' },
      ],
    },
  },

  typescript: {
    strict: true,
  },
})
