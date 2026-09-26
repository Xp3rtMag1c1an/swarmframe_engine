import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.js';

export default function SignalLog() {
  const log = useStore((s) => s.log);
  const [open, setOpen] = useState(true);
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log, open]);
  const t0 = log[0]?.t;

  return (
    <section className={`signal-log ${open ? 'is-open' : ''}`}>
      <button className="signal-head" onClick={() => setOpen(!open)}>
        <span className="pulse" /> Signal bus <span className="muted">· {log.length} events</span>
        <span className="grow" />
        <span className="muted">{open ? '▾' : '▴'}</span>
      </button>
      {open && (
        <div className="signal-lines" ref={ref}>
          {log.length === 0 && <div className="line muted">Idle. Events from every layer stream here during a run.</div>}
          {log.map((l, i) => (
            <div key={i} className={`line lv-${l.level}`}>
              <span className="ts">+{((l.t - t0) / 1000).toFixed(1)}s</span>
              {l.id && <span className="lid">{l.id}</span>}
              <span>{l.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
