// CollabBoard app loader – concatenates part files
const parts = ['./app.part0.js','./app.part1.js','./app.part2.js','./app.part3.js'];
async function load() {
  const texts = await Promise.all(parts.map(p => fetch(p).then(r => {
    if (!r.ok) throw new Error('Failed to load ' + p);
    return r.text();
  })));
  const blob = new Blob([texts.join('')], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  await import(url);
}
load().catch(err => {
  console.error(err);
  document.body.innerHTML = '<pre style="color:red;padding:20px">Failed to load CollabBoard: ' + err.message + '</pre>';
});
