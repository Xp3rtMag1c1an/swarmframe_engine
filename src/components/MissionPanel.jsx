import React from 'react';
import { useStore } from '../store.js';
import { TEMPLATES } from '../../shared/templates.js';
import { NODE_ROLES } from '../../shared/layers.js';

const LAYERS = [
  { key: 'blueprint', name: 'Blueprint', sub: 'Anatomy → system prompt', color: '#5b8cff' },
  { key: 'codex', name: 'CODEX', sub: '8-layer constitution check', color: '#2dd4a7' },
  { key: 'upe', name: 'UPE', sub: '5-dimension scoring', color: '#b57bff' },
  { key: 'autoRefine', name: 'Auto-refine', sub: 'Rewrite when UPE < 72', color: '#ffb547' },
];

function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default function MissionPanel() {
  const mission = useStore((s) => s.mission);
  const options = useStore((s) => s.options);
  const templateId = useStore((s) => s.templateId);
  const running = useStore((s) => s.run.status === 'running');
  const { setMission, setOption, loadTemplate, addNode } = useStore.getState();

  return (
    <aside className="panel left">
      <section>
        <h3 className="section-title">Template</h3>
        <div className="templates">
          {TEMPLATES.map((t) => (
            <button key={t.id} className={`template ${t.id === templateId ? 'is-active' : ''}`} onClick={() => loadTemplate(t.id)} disabled={running} title={t.blurb}>
              <span className="template-name">{t.name}</span>
              <span className="template-meta">{t.nodes.length} nodes</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">Signal bus · mission</h3>
        <Field label="Goal">
          <textarea rows={3} value={mission.goal} onChange={(e) => setMission({ goal: e.target.value })} disabled={running} />
        </Field>
        <Field label="Tone">
          <input value={mission.tone} onChange={(e) => setMission({ tone: e.target.value })} disabled={running} />
        </Field>
        <Field label="Constraints">
          <textarea rows={2} value={mission.constraints} onChange={(e) => setMission({ constraints: e.target.value })} disabled={running} />
        </Field>
        <Field label="Target output">
          <input value={mission.targetOutput} onChange={(e) => setMission({ targetOutput: e.target.value })} disabled={running} />
        </Field>
      </section>

      <section>
        <h3 className="section-title">Cognitive layers</h3>
        {LAYERS.map((l) => (
          <label key={l.key} className="toggle" style={{ '--c': l.color }}>
            <input type="checkbox" checked={!!options[l.key]} onChange={(e) => setOption({ [l.key]: e.target.checked })} disabled={running} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-text"><b>{l.name}</b><small>{l.sub}</small></span>
          </label>
        ))}
      </section>

      <section>
        <h3 className="section-title">Add node</h3>
        <div className="palette">
          {Object.entries(NODE_ROLES).map(([type, r]) => (
            <button key={type} className="chip" style={{ '--role': r.color }} onClick={() => addNode(type)} disabled={running} title={r.brief}>
              <span>{r.icon}</span>{r.label}
            </button>
          ))}
        </div>
        <p className="hint">Drag from a node's bottom handle to another's top to wire data. Use <code>{'{{signal.goal}}'}</code> or <code>{'{{muse}}'}</code> in prompts — unreferenced inputs are appended automatically.</p>
      </section>
    </aside>
  );
}
