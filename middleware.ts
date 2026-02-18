// middleware.ts

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Process request
  const response = NextResponse.next();
  
  // Add performance header
  const duration = Date.now() - start;
  response.headers.set('X-Response-Time', `${duration}ms`);
  
  // Log slow queries
  if (duration > 500) {
    console.warn(`⚠️ Slow API: ${request.url} took ${duration}ms`);
  }
  
  return response;
}