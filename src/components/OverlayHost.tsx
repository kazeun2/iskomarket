import React from 'react';
import { createPortal } from 'react-dom';
import { useOverlayManager } from '../contexts/OverlayManager';
import { CreditScoreHistoryOverlay } from './CreditScoreHistoryOverlay';
import { ProductDetail } from './ProductDetail';
import { WarningConfirmationModal } from './WarningConfirmationModal';
import { NoticeOverlay } from './NoticeOverlay';
import { ProductDeleteOverlay } from './ProductDeleteOverlay';
import { SellerProfileModal } from './SellerProfileModal';

export function OverlayHost() {
  const { overlay, hide, show } = useOverlayManager();

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (!overlay || !overlay.name) return;
    // short delay to allow portal DOM to be inserted
    const t = setTimeout(() => {
      try {
        const content = document.querySelector('[data-slot="dialog-content"]') as HTMLElement | null;
        const overlayEl = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement | null;
        if (!content && !overlayEl) {
          console.debug('[OverlayHost diagnostics] No dialog-content or dialog-overlay found in DOM for overlay:', overlay.name);
          return;
        }
        if (content) {
          const cs = getComputedStyle(content);
          console.group('[OverlayHost diagnostics] content styles for overlay: ' + overlay.name);
          console.debug({
            background: cs.background || cs.backgroundColor || cs.backgroundImage,
            backgroundColor: cs.backgroundColor,
            backgroundImage: cs.backgroundImage,
            opacity: cs.opacity,
            backdropFilter: cs.getPropertyValue('backdrop-filter'),
            cssCardVar: cs.getPropertyValue('--card')
          });

          // Neutralize any green-tinted shadows/blend modes when light theme is active; also clean up when not.
          try {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';

            const cleanupNeutralization = (rootEl: HTMLElement) => {
              try {
                if ((rootEl as any).__overlay_neutralizer) {
                  const obs = (rootEl as any).__overlay_neutralizer;
                  try { obs.disconnect(); } catch (e) {}
                  delete (rootEl as any).__overlay_neutralizer;
                }
                if ((rootEl as any).__overlay_interval) {
                  clearInterval((rootEl as any).__overlay_interval);
                  delete (rootEl as any).__overlay_interval;
                }
                const walk = [rootEl, ...Array.from(rootEl.querySelectorAll('*'))] as HTMLElement[];
                walk.forEach(n => {
                  if (n && n.style) {
                    n.style.background = '';
                    n.style.backgroundColor = '';
                    n.style.boxShadow = '';
                    n.style.mixBlendMode = '';
                    n.style.isolation = '';
                  }
                });
              } catch (e) {}
            };

            if (theme === 'light') {
              const neutralizeNode = (n: HTMLElement) => {
                try {
                  const card = getComputedStyle(document.documentElement).getPropertyValue('--card') || '#f6f9f7';
                  n.style.background = card;
                  n.style.backgroundColor = card;
                  n.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
                  n.style.mixBlendMode = 'normal';
                  n.style.isolation = 'isolate';
                } catch (e) {}
              };

              const neutralize = (root: HTMLElement) => {
                neutralizeNode(root);
                const all = root.querySelectorAll('*');
                all.forEach((n) => {
                  neutralizeNode(n as HTMLElement);
                  try {
                    const csn = getComputedStyle(n as Element);
                    const bs = csn.getPropertyValue('box-shadow');
                    const mb = csn.getPropertyValue('mix-blend-mode');
                    if (bs && /rgba\(\s*(?:0|20)\s*,\s*(?:100|184)\s*,\s*(?:0|166)\s*,?\s*\d?\.?\d*\)/.test(bs)) {
                      (n as HTMLElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
                    }
                    if (mb && mb !== 'normal') {
                      (n as HTMLElement).style.mixBlendMode = 'normal';
                      (n as HTMLElement).style.isolation = 'isolate';
                    }
                  } catch (e) {}
                });
              };

              neutralize(content as HTMLElement);

              try {
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver(() => neutralize(content as HTMLElement));
                  observer.observe(content as HTMLElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class'] });
                  (content as any).__overlay_neutralizer = observer;
                }
              } catch (e) {
                // ignore
              }

              const interval = setInterval(() => neutralize(content as HTMLElement), 800);
              (content as any).__overlay_interval = interval;
            } else {
              // ensure any prior neutralization is removed when not in light theme
              cleanupNeutralization(content as HTMLElement);
            }
          } catch (e) {
            // ignore
          }

          console.groupEnd();
        }
        if (overlayEl) {
          const cs2 = getComputedStyle(overlayEl);
          console.group('[OverlayHost diagnostics] overlay/backdrop styles for overlay: ' + overlay.name);
          console.debug({
            background: cs2.background || cs2.backgroundColor || cs2.backgroundImage,
            opacity: cs2.opacity,
            backdropFilter: cs2.getPropertyValue('backdrop-filter')
          });
          console.groupEnd();
        }
      } catch (e) {
        console.error('OverlayHost diagnostics failed', e);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [overlay?.name]);

  if (!overlay || !overlay.name) return null;

  const node = (
    <div
      aria-hidden={false}
      className="fixed inset-0 z-[40000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      data-slot="dialog-portal"
    >
      {/* Backdrop */}
      <div
        data-slot="dialog-overlay"
        className="fixed inset-0 bg-white dark:backdrop-blur-sm"
        onClick={() => hide()}
        style={{ zIndex: 40000 }}
      />

      <div data-slot="dialog-content" className="relative z-[40001] w-full min-h-screen flex items-center justify-center" style={{ zIndex: 40001 }}>
        {overlay.name === 'creditScoreHistory' && (
          <CreditScoreHistoryOverlay
            userId={overlay.props?.userId}
            onClose={() => {
              hide();
              // if caller requested to return to profile, provide that
              if (overlay.props?.returnToProfile) show('profile', { userId: overlay.props.userId });
            }}
            onBack={() => {
              hide();
              // Navigate back to profile overlay
              show('profile', { userId: overlay.props?.userId });
            }}
          />
        )}

        {overlay.name === 'profile' && (
          // Keep the old SellerProfile modal as an overlay type by allowing callers to pass a component props.seller and functions
          <div className="w-full max-w-3xl p-4 self-start mt-6">
            {overlay.props?.component ? (
              overlay.props.component
            ) : overlay.props?.userId ? (
              <SellerProfileModal
                sellerId={overlay.props.userId}
                onClose={() => hide()}
                currentUser={overlay.props?.currentUser}
                isAdmin={overlay.props?.isAdmin || false}
                onReport={(s: any) => {
                  if (typeof overlay.props?.onReport === 'function') overlay.props?.onReport(s);
                }}
                onDelete={(s: any) => {
                  if (typeof overlay.props?.onDelete === 'function') overlay.props?.onDelete(s);
                }}
                embedded={true}
              />
            ) : (
              <div />
            )}
          </div>
        )}

        {overlay.name === 'productDetail' && (() => {
          // If an inline ProductDetail is already present for the same product (e.g., marketplace page),
          // do not open a duplicate overlay. This avoids showing two identical modals.
          try {
            const existing = document.querySelector('[data-product-detail="true"]') as HTMLElement | null;
            const targetId = overlay.props?.product?.id;
            if (existing && targetId != null) {
              const existingId = existing.getAttribute('data-product-id');
              if (existingId && String(existingId) === String(targetId)) {
                // Same product detail already open in the page; bring it into view instead of opening a duplicate overlay.
                try { existing.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
                // Schedule clearing the overlay state after render to avoid setState during render warnings
                setTimeout(() => {
                  try { hide(); } catch (e) {}
                }, 0);
                return null;
              }
            }
          } catch (e) {
            // ignore DOM access errors
          }

          return (
            <div className="w-full max-w-3xl p-4">
              {overlay.props?.product ? (
                <ProductDetail
                  product={overlay.props.product}
                  meetupLocations={overlay.props.meetupLocations || []}
                  currentUser={overlay.props.currentUser}
                  onClose={() => hide()}
                  // If an onRequestDelete callback is provided, call it so the host can show the delete overlay (stacked behavior)
                  onDeleteProduct={(p) => {
                    if (typeof overlay.props?.onRequestDelete === 'function') {
                      overlay.props.onRequestDelete(p);
                      return; // keep productDetail open (host will show delete overlay)
                    }

                    // Fallback behavior: call onProductDeleted (legacy) and hide
                    if (typeof overlay.props?.onProductDeleted === 'function') overlay.props.onProductDeleted(p?.id);
                    hide();
                  }}
                  onProductUpdated={(p) => {
                    if (typeof overlay.props?.onProductUpdated === 'function') overlay.props.onProductUpdated(p);
                  }}
                  onRequestEdit={(p) => {
                    if (typeof overlay.props?.onRequestEdit === 'function') overlay.props.onRequestEdit(p);
                  }}
                />
              ) : null}
            </div>
          );
        })()}

        {overlay.name === 'notice' && (
          <div className="w-full max-w-3xl p-4">
            <NoticeOverlay
              mode={overlay.props?.mode}
              user={overlay.props?.user}
              onClose={() => hide()}
              onSend={(m, u) => {
                // default action: call any provided onSend, then hide
                if (typeof overlay.props?.onSend === 'function') overlay.props.onSend(m, u);
                hide();
              }}
            />
          </div>
        )}

        {overlay.name === 'warningConfirmation' && (
          <div className="w-full max-w-md p-4">
            <WarningConfirmationModal
              isOpen={true}
              onClose={() => hide()}
              onConfirm={() => {
                if (typeof overlay.props?.onConfirm === 'function') overlay.props.onConfirm();
                hide();
              }}
              user={overlay.props?.user}
            />
          </div>
        )}



        {overlay.name === 'productDelete' && (
          <div className="w-full max-w-[520px] p-4">
            <ProductDeleteOverlay
              product={overlay.props?.product}
              onClose={() => hide()}
              onConfirm={(p) => {
                if (typeof overlay.props?.onConfirm === 'function') overlay.props.onConfirm(p);
                hide();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : null;
}
