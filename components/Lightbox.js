'use client';
import { useEffect, useState } from 'react';

export default function Lightbox({ images, title }) {
  const [i, setI] = useState(null);
  const open = i !== null;
  const go = (d) => setI((v) => (v + d + images.length) % images.length);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setI(null);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="thumbs">
        {images.map((src, n) => (
          <button key={src} onClick={() => setI(n)} aria-label={`Buka foto ${n + 1}`}>
            <img src={src} alt={`${title} ${n + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
      {open && (
        <div className="lb" onClick={() => setI(null)}>
          <img src={images[i]} alt={`${title} ${i + 1}`} onClick={(e) => e.stopPropagation()} />
          <button className="x" onClick={() => setI(null)} aria-label="Tutup">×</button>
          {images.length > 1 && (
            <>
              <button className="l" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Sebelumnya">‹</button>
              <button className="r" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Berikutnya">›</button>
            </>
          )}
          <span className="n">{i + 1} / {images.length}</span>
        </div>
      )}
    </>
  );
}
