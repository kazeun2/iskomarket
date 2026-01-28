"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "./utils";

// Track number of open dialogs for z-index stacking
let openDialogCount = 0;
const getNextZIndex = () => {
  return 1000 + (openDialogCount * 10);
};

// Context for passing z-index to children
const DialogZIndexContext = React.createContext<number>(1000);

function Dialog({ forceZIndex, ...props } : { forceZIndex?: number } & React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [zIndex, setZIndex] = React.useState(1000);
  
  // Lock body scroll when dialog is open and manage z-index (supports optional forced z-index)
  React.useEffect(() => {
    if (props.open) {
      // Increment dialog count (keeps stacking logic) and compute z-index
      openDialogCount++;
      const newZIndex = typeof forceZIndex === 'number' ? forceZIndex : getNextZIndex();
      setZIndex(newZIndex);
      
      // Add class to lock scroll
      document.body.classList.add('modal-open');
      document.documentElement.setAttribute('data-scroll-locked', 'true');
      
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        // Decrement dialog count
        openDialogCount = Math.max(0, openDialogCount - 1);
        
        // Only unlock scroll if no dialogs are open
        if (openDialogCount === 0) {
          document.body.classList.remove('modal-open');
          document.documentElement.removeAttribute('data-scroll-locked');
          
          // Restore scroll position
          const scrollY = document.body.style.top;
          document.body.style.top = '';
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }
  }, [props.open, forceZIndex]);
  
  return (
    <DialogZIndexContext.Provider value={zIndex}>
      <DialogPrimitive.Root data-slot="dialog" data-z-index={zIndex} {...props as any} />
    </DialogZIndexContext.Provider>
  );
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const zIndex = React.useContext(DialogZIndexContext);
  
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[9998] bg-black/40 dark:bg-[#00000066]",
        className,
      )}
      style={{ zIndex }}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Provide a unique description id to DialogContent and DialogDescription so that callers
// don't have to manually wire aria-describedby every time. If a caller provides
// their own `aria-describedby` it will be honored; otherwise a generated id is used.
const DialogDescriptionIdContext = React.createContext<string | undefined>(undefined);

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const zIndex = React.useContext(DialogZIndexContext);
  const descriptionId = React.useId();
  // Avoid forwarding an explicit `aria-describedby={undefined}` prop from callers.
  // Destructure it away and compute the real aria-describedby to ensure a proper
  // fallback description id is used when the caller omits a DialogDescription.
  const { ["aria-describedby"]: ariaDescProp, ...restProps } = props as any;
  const ariaDescribedBy = ariaDescProp ?? descriptionId;

  // Determine whether any descendant included an explicit DialogDescription
  const containsDescription = (nodes: any): boolean => {
    return React.Children.toArray(nodes).some((node: any) => {
      if (!node || !node.props) return false;
      if (node.props["data-slot"] === "dialog-description") return true;
      return containsDescription(node.props.children);
    });
  };
  const hasDescription = containsDescription(children);

  // Local ref so we can inspect the exact content element at runtime (for diagnostics)
  const innerRef = React.useRef<HTMLElement | null>(null);
  const setRef = (node: any) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as any).current = node;
  };

  React.useEffect(() => {
    // Run a short time after mount to allow the portal to attach
    // Neutralizer runs in all environments so production and dev UIs remain visually consistent.
    // Note: console diagnostics are still gated to dev, but the style normalization must run
    // in production as well to ensure modal surfaces are non-glassy and centered across builds.
    const t = setTimeout(() => {
      const el = innerRef.current as HTMLElement | null;
      if (!el) return;

      const neutralizeNode = (n: HTMLElement) => {
        try {
          // Force neutral surface and shadow
          n.style.background = '#ffffff';
          n.style.backgroundColor = '#ffffff';
          n.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
          n.style.mixBlendMode = 'normal';
          n.style.isolation = 'isolate';
          n.style.backdropFilter = 'none';
          (n.style as any).webkitBackdropFilter = 'none' as any;
          n.style.opacity = '1';
        } catch (e) {
          // ignore
        }
      };

      const neutralize = (root: HTMLElement) => {
        try {
          neutralizeNode(root);
          const all = root.querySelectorAll('*');
          all.forEach((node) => {
            neutralizeNode(node as HTMLElement);
            // Additionally neutralize inline box-shadow if it's green-tinted
            try {
              const cs = getComputedStyle(node as Element);
              const bs = cs.getPropertyValue('box-shadow');
              const mb = cs.getPropertyValue('mix-blend-mode');
              if (bs && /rgba\(\s*(?:0|20)\s*,\s*(?:100|184)\s*,\s*(?:0|166)\s*,?\s*\d?\.?\d*\)/.test(bs)) {
                (node as HTMLElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
              }
              if (mb && mb !== 'normal') {
                (node as HTMLElement).style.mixBlendMode = 'normal';
                (node as HTMLElement).style.isolation = 'isolate';
              }
            } catch (e) {
              // ignore per-node errors
            }
          });
        } catch (e) {
          // ignore
        }
      };

      try {
        const s = getComputedStyle(el);
        const info: any = {
          background: s.background || s.backgroundColor || s.backgroundImage,
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          opacity: s.opacity,
          backdropFilter: s.getPropertyValue('backdrop-filter'),
          webkitBackdropFilter: s.getPropertyValue('-webkit-backdrop-filter'),
          cssCardVar: s.getPropertyValue('--card'),
        };

        const ancestors: any[] = [];
        let node: HTMLElement | null = el;
        while (node && node !== document.body) {
          const cs = getComputedStyle(node);
          if (cs.opacity !== '1' || cs.getPropertyValue('backdrop-filter') || /(rgba\(|transparent)/i.test(cs.background || '')) {
            ancestors.push({
              node: node.tagName,
              id: node.id || null,
              className: node.className || null,
              opacity: cs.opacity,
              backdropFilter: cs.getPropertyValue('backdrop-filter'),
              background: cs.background || cs.backgroundColor || cs.backgroundImage,
            });
          }
          node = node.parentElement;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.group('[Dialog diagnostics] computed style for dialog content');
          console.debug(info);
          if (ancestors.length) console.warn('Potential translucency sources on ancestors:', ancestors);
          else console.debug('No ancestor opacity/backdrop-filter issues detected');
          console.groupEnd();
        }

        // Proactively neutralize green/brand shadows and blend modes in light mode on dialog
        try {
          const theme = document.documentElement.getAttribute('data-theme') || 'light';
          if (theme === 'light') {
            neutralize(el);

            // Watch for late mutations from child components and re-apply neutralization
            let observer: MutationObserver | null = null;
            try {
              if (typeof MutationObserver !== 'undefined') {
                observer = new MutationObserver((mutations) => {
                  // Quick re-apply whenever style/class changes or children are added
                  neutralize(el);
                });
                observer.observe(el, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class'] });
              }
            } catch (e) {
              // ignore
            }

            // As a fallback, re-apply periodically while the dialog is open
            const interval = setInterval(() => neutralize(el), 800);

            // Store observer and interval for cleanup on unmount
            (el as any).__dialog_neutralizer = { observer, interval };
          }
        } catch (e) {
          // ignore theme detection errors
        }
      } catch (e) {
        console.error('Dialog diagnostics failed', e);
      }
    }, 50);

    return () => {
      clearTimeout(t);
      const el = innerRef.current as HTMLElement | null;
      if (el && (el as any).__dialog_neutralizer) {
        try {
          const { observer, interval } = (el as any).__dialog_neutralizer;
          if (observer && typeof observer.disconnect === 'function') observer.disconnect();
          if (interval) clearInterval(interval);
          delete (el as any).__dialog_neutralizer;
        } catch (e) {
          // ignore
        }
      }
    };
  }, [/* run after every render in dev to catch dynamic styles */]);

  return (
    <DialogPortal data-slot="dialog-portal">
      {/* Render a lightweight hidden fallback description immediately in the portal
          (before overlay) when none is present - this satisfies Radix's mount-time
          checks and prevents the intermittent warning that appears while the modal
          initializes. */}
      {!hasDescription && (
        <div id={descriptionId} data-slot="dialog-description-fallback" className="sr-only">
          Dialog content
        </div>
      )}

      <DialogOverlay />
      <DialogDescriptionIdContext.Provider value={descriptionId}>
        <DialogPrimitive.Content
          ref={setRef}
          data-slot="dialog-content"
          className={cn(
<<<<<<< HEAD
            "iskomarket-dialog-content forced-modal-bg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[9999] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-gray-200 bg-neutral-50 dark:bg-neutral-900 p-6 shadow-xl text-gray-900 duration-200 sm:max-w-lg [&>button]:hidden",
=======
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[9999] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-gray-200 bg-neutral-50 dark:bg-neutral-900 p-6 shadow-xl text-gray-900 duration-200 sm:max-w-lg [&>button]:hidden",
>>>>>>> 5fb2eafeae169a25463aa6b7379206387573cbb6
            className,
          )}
          style={{ zIndex: Math.max(zIndex + 1, 9999), opacity: 1, isolation: 'isolate', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
          {...restProps}
          aria-describedby={ariaDescribedBy}
        >
          {/* Keep a proper Radix Description inside the Content for screen-readers */}
          {!hasDescription && (
            <DialogPrimitive.Description id={descriptionId} data-slot="dialog-description" className="sr-only">Dialog content</DialogPrimitive.Description>
          )}

<<<<<<< HEAD
          {/* Triple-layer nuclear protection to avoid any late global transparency overrides */}
          <div className="forced-nuclear-bg !bg-[#f8fafc] !bg-slate-50/100 max-w-[100%] max-h-[90vh] overflow-auto w-full">
            <div className="!bg-white/98 rounded-2xl shadow-2xl p-8 border w-full">
              <div className="!bg-slate-50 p-2 rounded-xl w-full">
                {/* Keep the aria-describedby content and children inside the safeguarded layers */}
                {!hasDescription && (
                  <DialogPrimitive.Description id={descriptionId} data-slot="dialog-description" className="sr-only">Dialog content</DialogPrimitive.Description>
                )}

                {children}
              </div>
            </div>
          </div>
=======
          {children}
>>>>>>> 5fb2eafeae169a25463aa6b7379206387573cbb6
        </DialogPrimitive.Content>
      </DialogDescriptionIdContext.Provider>

      {/* Development-only diagnostics to help track down intermittent accessibility
          warnings reported in the console when dialogs mount without descriptions. */}
      {process.env.NODE_ENV !== 'production' && (
        <script dangerouslySetInnerHTML={{ __html: `console.debug('[Dialog] mounted with hasDescription=${hasDescription} ariaDescribedBy=${ariaDescribedBy}');` }} />
      )}
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-0 items-center text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-tight font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const contextId = React.useContext(DialogDescriptionIdContext);
  const idProp = (props as any).id ?? contextId;

  return (
    <DialogPrimitive.Description
      id={idProp}
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
