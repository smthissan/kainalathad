// Vercel Routing Middleware — يعمل قبل الملفات الثابتة، فيصل إلى الرئيسية "/" التي لا تصلها قواعد rewrites في vercel.json.
// روبوتات البحث والمعاينة فقط تُحوَّل إلى /api/og?list=home لتأخذ محتوى الرئيسية جاهزاً. الزوار يمرون كما هم.

// نفس قائمة الروبوتات في vercel.json
const BOTS = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Pinterest|Googlebot|bingbot|Applebot|redditbot|Viber|SkypeUriPreview|Embedly/;

export const config = { matcher: '/' };

// مطابق لـ rewrite() و next() في @vercel/functions دون إضافة الحزمة
export default function middleware(request) {
  if (!BOTS.test(request.headers.get('user-agent') || '')) return new Response(null, { headers: { 'x-middleware-next': '1' } });
  const url = new URL('/api/og?list=home', request.url);
  return new Response(null, { headers: { 'x-middleware-rewrite': url.toString() } });
}
