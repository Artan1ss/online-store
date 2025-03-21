// Simple script to check API connection\nfetch('/api/debug').then(res => res.json()).then(data => console.log('API debug result:', data)).catch(err => console.error('API error:', err));
