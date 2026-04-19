import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const vkId = searchParams.get('vkId')

  // Simple success page — redirect to VK bot chat
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Оплата прошла успешно</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0f4f8; }
    .card { background: white; border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { color: #1a1a2e; margin: 0 0 8px; font-size: 24px; }
    p { color: #666; margin: 0 0 24px; }
    a { display: inline-block; background: #0077ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Оплата прошла!</h1>
    <p>Подписка активирована. Мы отправили вам сообщение ВКонтакте со ссылкой для вступления в группу.</p>
    <a href="https://vk.com">Вернуться ВКонтакте</a>
  </div>
</body>
</html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
