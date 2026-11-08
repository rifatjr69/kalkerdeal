import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const WHATSAPP_NUMBER = '8801982711668';
const PREFILLED_MESSAGE = 'Hello! I need support regarding your website.';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;
const WA_GREEN = '#25D366';
const WA_DARK = '#075E54';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.003 3C9.375 3 4 8.373 4 15.001c0 2.116.553 4.18 1.602 6.002L4 29l8.171-1.57A12.94 12.94 0 0 0 16.003 27C22.63 27 28 21.627 28 15.001 28 8.373 22.63 3 16.003 3zm0 21.8a10.76 10.76 0 0 1-5.49-1.503l-.394-.234-4.85.932.97-4.72-.257-.404A10.77 10.77 0 0 1 5.2 15c0-5.965 4.84-10.8 10.803-10.8 5.96 0 10.797 4.835 10.797 10.8 0 5.964-4.837 10.8-10.797 10.8zm5.92-8.09c-.324-.163-1.918-.947-2.215-1.055-.297-.108-.513-.163-.729.163-.216.325-.836 1.055-1.025 1.272-.189.216-.378.244-.702.081-.324-.163-1.368-.504-2.605-1.607-.963-.859-1.613-1.92-1.802-2.245-.189-.325-.02-.5.142-.662.146-.145.324-.379.486-.568.162-.19.216-.325.324-.542.108-.216.054-.406-.027-.568-.081-.163-.729-1.757-.999-2.406-.263-.632-.53-.546-.729-.556l-.62-.011c-.216 0-.567.081-.864.406-.297.325-1.134 1.109-1.134 2.704 0 1.596 1.161 3.138 1.323 3.355.162.216 2.285 3.49 5.536 4.894.774.334 1.378.533 1.849.683.777.247 1.484.212 2.043.129.623-.093 1.918-.784 2.188-1.541.27-.757.27-1.406.189-1.541-.081-.135-.297-.216-.621-.379z" />
  </svg>
);

/**
 * Floating WhatsApp support button (bottom-left) with a small popup.
 * Render it ONCE per visible page.
 */
export const WhatsAppSupport: React.FC = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // বাইরে ক্লিক বা Esc চাপলে বন্ধ
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed left-3 sm:left-5 z-[55] flex flex-col items-start gap-3"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <style>{`
        @keyframes wa-pulse-ring {
          0% { transform: scale(1); opacity: .55; }
          80%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes wa-pop-in {
          from { opacity: 0; transform: translateY(8px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wa-pulse, .wa-pop { animation: none !important; }
        }
      `}</style>

      {open && (
        <div
          role="dialog"
          aria-label="WhatsApp Support"
          className="wa-pop w-[17.5rem] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
          style={{ animation: 'wa-pop-in .18s ease-out' }}
        >
          <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: WA_DARK }}>
            <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">WhatsApp Support</p>
              <p className="text-[11px] text-white/75 leading-tight mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: WA_GREEN }} />
                Online
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-[#ECE5DD]">
            <div className="bg-white rounded-xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-slate-800 shadow-sm w-fit max-w-full">
              Hello! 👋 How can we help you today?
            </div>
          </div>

          <div className="p-3 bg-white">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-white text-sm font-bold shadow-sm hover:brightness-95 active:brightness-90 transition"
              style={{ backgroundColor: WA_GREEN }}
            >
              <WhatsAppIcon className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="WhatsApp Support"
        aria-expanded={open}
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
        style={{ backgroundColor: WA_GREEN }}
      >
        {!open && (
          <span
            className="wa-pulse absolute inset-0 rounded-full"
            style={{ backgroundColor: WA_GREEN, animation: 'wa-pulse-ring 2s ease-out infinite' }}
          />
        )}
        <span className="relative">
          {open ? <X className="w-6 h-6" /> : <WhatsAppIcon className="w-7 h-7 sm:w-8 sm:h-8" />}
        </span>
      </button>
    </div>
  );
};

export default WhatsAppSupport;