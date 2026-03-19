import { NextResponse } from 'next/server';
import { unsubscribeFromNewsletter } from '@/app/server/controllers/newsletterController.js';

const successHTML = (email) => `<!DOCTYPE html>
<html>
<head>
<title>Unsubscribed</title>
<style>
body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
.success { color: #4caf50; }
.message { color: #666; margin-top: 10px; }
a { color: #667eea; text-decoration: none; margin-top: 20px; display: inline-block; }
</style>
</head>
<body>
<div class="container">
<h1 class="success">✓ Successfully Unsubscribed</h1>
<p class="message">You have been unsubscribed from our newsletter.</p>
<p class="message">Email: <strong>\${email}</strong></p>
<p class="message" style="font-size: 14px; margin-top: 30px;">If you change your mind, you can always subscribe again.</p>
<a href="/">← Back to website</a>
</div>
</body>
</html>`;

const errorHTML = (message) => `<!DOCTYPE html>
<html>
<head>
<title>Error</title>
<style>
body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
.error { color: #f44336; }
.message { color: #666; margin-top: 10px; }
a { color: #667eea; text-decoration: none; margin-top: 20px; display: inline-block; }
</style>
</head>
<body>
<div class="container">
<h1 class="error">✗ Error</h1>
<p class="message">\${message}</p>
<p class="message" style="font-size: 14px; margin-top: 30px;">Please contact support if you continue to experience issues.</p>
<a href="/">← Back to website</a>
</div>
</body>
</html>`;

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const result = await unsubscribeFromNewsletter(email);

    if (result.success) {
      return new NextResponse(successHTML(email), {
        headers: { 'Content-Type': 'text/html' },
        status: 200,
      });
    } else {
      return new NextResponse(errorHTML(result.error || 'Could not unsubscribe'), {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      });
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse(errorHTML(error.message), {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}
