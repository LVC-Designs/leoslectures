const q = document.querySelector('.ph-search');
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
q?.addEventListener('input', () => {
  const n = norm(q.value.trim());
  document.querySelectorAll('.phrases li').forEach(li => { li.hidden = n && !norm(li.dataset.text).includes(n); });
  document.querySelectorAll('.phrases').forEach(s => { s.hidden = n && [...s.querySelectorAll('li')].every(li => li.hidden); });
});
