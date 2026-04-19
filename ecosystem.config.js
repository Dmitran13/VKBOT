module.exports = {
  apps: [
    {
      name: 'vk-bot',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/root/vk-subscription-bot',
      env: { NODE_ENV: 'production', DATABASE_URL: 'file:./dev.db' },
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      error_file: '/root/vk-subscription-bot/logs/error.log',
      out_file:   '/root/vk-subscription-bot/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'vk-longpoll',
      script: 'longpoll-worker.js',
      cwd: '/root/vk-subscription-bot',
      env: { NODE_ENV: 'production', DATABASE_URL: 'file:./dev.db' },
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      error_file: '/root/vk-subscription-bot/logs/longpoll-error.log',
      out_file:   '/root/vk-subscription-bot/logs/longpoll-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    }
  ]
}
