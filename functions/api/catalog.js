export async function onRequestGet({ env }) {
  if (!env.GAS_WEB_APP_URL || !env.GAS_API_KEY)
    return Response.json(
      { ok: false, error: 'Server configuration missing' },
      { status: 500 }
    );

  try {
    const upstream = await fetch(env.GAS_WEB_APP_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'catalog',
        apiKey: env.GAS_API_KEY
      })
    });

    const data = await upstream.json();

    if (!data.ok)
      return Response.json(data, {
        status: upstream.ok ? 401 : upstream.status
      });

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    return Response.json({
      ok: false,
      error: 'Catalogue service unavailable: ' + error.message
    }, { status: 502 });
  }
}
