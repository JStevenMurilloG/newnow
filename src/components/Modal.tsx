import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Diálogo modal nativo: centrado en escritorio, bottom sheet en móvil (ver .modal en CSS). */
export function Modal({ open, onClose, title, children, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // clic en el fondo
      }}
    >
      {open && (
        <div className="modal__panel">
          <header className="modal__head">
            <span className="modal__grip" aria-hidden="true" />
            <h2 className="modal__title">{title}</h2>
            <button type="button" className="icon-btn icon-btn--sm" aria-label="Cerrar" onClick={onClose}>
              <Icon name="close" size={18} />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
