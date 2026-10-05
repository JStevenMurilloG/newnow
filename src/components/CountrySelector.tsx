import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import { REGIONS } from '../data/regions';
import { COUNTRIES, placePath, WORLD } from '../lib/geo';
import type { Place } from '../lib/types';
import { Flag } from './Flag';
import { Icon } from './Icon';
import { Modal } from './Modal';

export const usePicker = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

interface Option {
  place: Place;
  flag?: string;
  hint: string;
  search: string;
}

const OPTIONS: Option[] = [
  { place: WORLD, hint: 'Todo el planeta', search: 'mundo world global' },
  ...REGIONS.map((r) => ({
    place: { kind: 'region', code: r.id, name: r.name } as Place,
    hint: 'Región',
    search: fold(r.name),
  })),
  ...COUNTRIES.map((c) => ({
    place: { kind: 'country', code: c.code, name: c.name, country: c.code } as Place,
    flag: c.code,
    hint: c.code.toUpperCase(),
    search: fold(`${c.name} ${c.nameEn} ${c.code}`),
  })),
];

/** Selector de país/región con búsqueda: alternativa accesible por teclado al globo. */
export function CountrySelector() {
  const { open, setOpen } = usePicker();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = fold(query.trim());
    return q ? OPTIONS.filter((o) => o.search.includes(q)) : OPTIONS;
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // el diálogo ya está abierto (el efecto del Modal hijo corre antes): el foco va al buscador
      input.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (o: Option | undefined) => {
    if (!o) return;
    setOpen(false);
    navigate(placePath(o.place));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Elige un lugar" className="modal--picker">
      <div className="picker">
        <label className="field">
          <Icon name="search" size={18} />
          <input
            ref={input}
            type="search"
            placeholder="Busca un país o región…"
            value={query}
            role="combobox"
            aria-expanded="true"
            aria-controls="picker-list"
            aria-activedescendant={results[active] ? `picker-${active}` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                choose(results[active]);
              }
            }}
          />
        </label>
        {results.length === 0 ? (
          <p className="picker__empty">Ningún lugar coincide con «{query}».</p>
        ) : (
          <ul ref={list} id="picker-list" role="listbox" className="picker__list">
            {results.map((o, i) => (
              <li
                key={`${o.place.kind}:${o.place.code}`}
                id={`picker-${i}`}
                role="option"
                aria-selected={i === active}
                className="picker__option"
                onPointerMove={() => setActive(i)}
                onClick={() => choose(o)}
              >
                {o.flag ? <Flag code={o.flag} /> : <Icon name={o.place.kind === 'world' ? 'globe' : 'pin'} />}
                <span className="picker__name">{o.place.name}</span>
                <span className="picker__hint">{o.hint}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
