document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('list-search');
  const category = document.getElementById('list-category');
  const pills = document.querySelectorAll('.filter-pill');
  const items = document.querySelector('.pen-grid, .table-card tbody');
  const empty = document.querySelector('.no-results');

  function filterList() {
    const term = search.value.trim().toLowerCase();
    const selected = category?.value || document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
    let count = 0;
    for (const item of items.children) {
      const name = item.querySelector('.pen-header strong');
      const text = name ? name.textContent : item.textContent;
      const matches = (selected === 'all' || item.dataset.category === selected) && text.toLowerCase().includes(term);
      item.hidden = !matches;
      if (matches) count++;
    }
    empty.hidden = count !== 0;
  }

  search.addEventListener('input', filterList);
  category?.addEventListener('change', filterList);
  for (const pill of pills) {
    pill.setAttribute('aria-pressed', pill.classList.contains('active'));
    pill.addEventListener('click', () => {
      for (const option of pills) {
        option.classList.toggle('active', option === pill);
        option.setAttribute('aria-pressed', option === pill);
      }
      filterList();
    });
  }
  new MutationObserver(filterList).observe(items, {childList: true, subtree: true, characterData: true});
  filterList();
});
