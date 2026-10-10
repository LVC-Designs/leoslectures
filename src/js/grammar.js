const q = document.querySelector('.gr-search');
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
q?.addEventListener('input', () => {
  const n = norm(q.value.trim());
  document.querySelectorAll('.gr-list li').forEach(li => { li.hidden = n && !norm(li.dataset.text).includes(n); });
  document.querySelectorAll('.gr-cat').forEach(s => { s.hidden = [...s.querySelectorAll('li')].every(li => li.hidden); });
});
