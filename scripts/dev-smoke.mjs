const base = process.env.PUBLIC_API_BASE || 'http://localhost:8787';

async function check(path, init) {
  const res = await fetch(`${base}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} ${res.status} ${text}`);
  }
  return res.json();
}

async function run() {
  console.log('GET /api/monitoring/status');
  await check('/api/monitoring/status');
  console.log('GET /api/jobs?limit=1');
  await check('/api/jobs?limit=1');
  console.log('POST /api/runs/monitor');
  await check('/api/runs/monitor', { method: 'POST' });
  console.log('Smoke checks passed');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
