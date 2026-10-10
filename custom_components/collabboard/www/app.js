// CollabBoard loader
const n = 4;
const texts = await Promise.all(
  Array.from({length: n}, (_, i) => fetch(new URL('./app.part' + i + '.js', import.meta.url)).then(r => {
    if (!r.ok) throw new Error('Failed to load app.part' + i + '.js: ' + r.status);
    return r.text();
  }))
);
const code = texts.join('');
const blob = new Blob([code], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
await import(url);
