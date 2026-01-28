export function clearModalLocks() {
  try {
    document.body.classList.remove('modal-open')
  } catch (e) {}
  try { document.documentElement.removeAttribute('data-scroll-locked') } catch (e) {}
  try { document.body.style.top = '' } catch (e) {}
}
