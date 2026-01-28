(function () {
  // Initialize only after DOM is ready to avoid early-runtime errors
  function init() {
    try {
      let hideTimer = null;
      let root = document.getElementById('seller-flash-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'seller-flash-root';
        document.body.appendChild(root);
      }

      function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
      // debug
      if (typeof console !== 'undefined' && console.info) console.info('[sellerFlash] initialized');
    
    function renderCard(data) {
      const avatarLetter = (data.username || data.fullName || 'U').charAt(0).toUpperCase();
      const productsHtml = (data.products||[]).slice(0,4).map(p =>
        `<div class="product-box"><span>${escapeHtml(p.title)}</span><strong>${escapeHtml(p.price||'')}</strong></div>`
      ).join('');
      return `
        <div class="seller-flash-overlay backdrop" role="dialog" aria-modal="true">
          <div class="seller-flash-card" tabindex="-1">
            <div class="seller-info">
              <div class="seller-avatar" aria-hidden="true">${avatarLetter}</div>
              <div class="seller-meta">
                <div class="seller-username">
                  <span>@${escapeHtml(data.username||data.fullName||'seller')}</span>
                  ${data.badge ? `<span class="seller-badge">${escapeHtml(data.badge)}</span>` : ''}
                </div>
                <div class="seller-bio">${escapeHtml(data.bio||'')}</div>
                <div class="seller-rating">⭐ ${escapeHtml(data.rating||'')}</div>
              </div>
            </div>
            <div class="seller-products">${productsHtml || '<div style="padding:10px;color:#6a6a6a">No current products</div>'}</div>
            <div class="seller-flash-dismiss">Click anywhere or press Esc to dismiss — auto hides in 3s</div>
          </div>
        </div>
      `;
    }

    function showSellerFlash(data, ms = 3000) {
      clearTimeout(hideTimer);
      root.innerHTML = renderCard(data);
      const overlay = root.querySelector('.seller-flash-overlay');
      const card = root.querySelector('.seller-flash-card');
      requestAnimationFrame(() => overlay.classList.add('show'));
      try { card.focus({preventScroll:true}); } catch (e) { /* ignore */ }

      function hide() {
        overlay.classList.remove('show');
        overlay.addEventListener('transitionend', () => { root.innerHTML = ''; }, { once: true });
        document.removeEventListener('keydown', onKey);
        overlay.removeEventListener('click', hide);
      }

      function onKey(e) { if (e.key === 'Escape') { hide(); } }

      overlay.addEventListener('click', hide);
      document.addEventListener('keydown', onKey);

      hideTimer = setTimeout(hide, ms);
    }

    // expose
    window.showSellerFlash = showSellerFlash;

    // delegated handler for .seller-link
    document.addEventListener('click', function (e) {
      const a = e.target.closest('.seller-link');
      if (!a) return;
      e.preventDefault();
      let data = null;
      try {
        if (a.dataset.seller) data = JSON.parse(a.dataset.seller);
        else {
          data = {
            username: a.dataset.username,
            fullName: a.dataset.fullname,
            badge: a.dataset.badge,
            bio: a.dataset.bio,
            rating: a.dataset.rating,
            products: a.dataset.products ? JSON.parse(a.dataset.products) : undefined
          };
        }
      } catch (err) {
        data = { username: a.textContent.trim() || 'seller' };
      }
      showSellerFlash(data);
    });
    } catch (err) { if (typeof console !== 'undefined' && console.error) console.error('[sellerFlash] init error', err); }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
