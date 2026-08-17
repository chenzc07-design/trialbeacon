'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import type { Messages } from '@/lib/messages/en';

import candidatesData from '@/lib/data/frontier-trials.json';
import matrixData from '@/lib/data/frontier-phase-matrix.json';

type Candidate = (typeof candidatesData)[number];
type MatrixRow = (typeof matrixData.cancers)[number];
type Phase = Exclude<keyof MatrixRow, 'cancer' | 'label' | 'total'>;
const phases = matrixData.phases as Phase[];
type Modality = 'targeted' | 'immunotherapy';

const phaseKey: Record<string, keyof Messages['research']['phaseLabels']> = {
  'Early Phase 1': 'earlyPhase1',
  'Phase 1': 'phase1',
  'Phase 1/2': 'phase1_2',
  'Phase 2': 'phase2',
  'Phase 2/3': 'phase2_3',
  'Phase 3': 'phase3',
  'Phase 4': 'phase4',
  'Not applicable': 'notApplicable',
  'Not specified': 'notSpecified',
};

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink-900">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slateish-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
      >
        {children}
      </select>
    </label>
  );
}

function CandidateCard({ candidate, messages: m }: { candidate: Candidate; messages: Messages }) {
  const cancerLabels = candidate.cancers.map((slug) => m.cancers[slug]?.label ?? slug).join(' · ');
  const modalityLabels = candidate.modality.map((modality) =>
    modality === 'targeted' ? m.research.targeted : m.research.immunotherapy,
  );
  const evidence = [...candidate.targetedEvidence, ...candidate.immuneEvidence, ...candidate.frontierEvidence];

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slateish-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {modalityLabels.map((label) => (
            <span key={label} className="chip border-navy-100 bg-navy-50 text-navy-800">
              {label}
            </span>
          ))}
        </div>
        <span className="font-mono text-[11px] font-semibold text-slateish-400">{candidate.id}</span>
      </div>
      <h3 className="mt-4 line-clamp-3 text-base font-semibold leading-snug text-ink-950">{candidate.title}</h3>
      <div className="mt-4 grid gap-2 text-xs text-slateish-500">
        <div className="flex items-center justify-between gap-3 border-b border-slateish-100 pb-2">
          <span>{m.research.cancerFilter}</span>
          <span className="text-right font-medium text-slateish-700">{cancerLabels}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slateish-100 pb-2">
          <span>{m.research.studyPhase}</span>
          <span className="font-medium text-slateish-700">{candidate.phase || m.research.phaseLabels.notSpecified}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slateish-100 pb-2">
          <span>{m.research.sponsor}</span>
          <span className="max-w-[62%] truncate text-right font-medium text-slateish-700">{candidate.sponsor || '—'}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {evidence.slice(0, 5).map((item) => (
          <span key={item} className="rounded-full bg-slateish-50 px-2 py-1 text-[10px] text-slateish-600">
            {item}
          </span>
        ))}
      </div>
      <a
        href={candidate.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto flex items-center justify-between pt-5 text-sm font-semibold text-navy-700 transition group-hover:text-navy-900"
      >
        <span>{m.research.viewRegistry}</span>
        <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

function PhaseMatrix({ messages: m }: { messages: Messages }) {
  const max = Math.max(...matrixData.cancers.flatMap((row) => phases.map((phase) => row[phase] ?? 0)), 1);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slateish-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="min-w-[760px]">
        <div className="grid" style={{ gridTemplateColumns: `minmax(150px, 1.4fr) repeat(${phases.length}, minmax(72px, 1fr))` }}>
          <div className="border-b border-slateish-200 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slateish-400">{m.research.cancerFilter}</div>
          {phases.map((phase) => (
            <div key={phase} className="border-b border-slateish-200 px-1 pb-3 text-center text-[11px] font-semibold leading-tight text-slateish-500">
              {m.research.phaseLabels[phaseKey[phase]]}
            </div>
          ))}
          {matrixData.cancers.map((row: MatrixRow) => (
            <div key={row.cancer} className="contents">
              <div className="border-b border-slateish-100 py-3 pr-3 text-sm font-medium text-ink-900">{m.cancers[row.cancer]?.label ?? row.label}</div>
              {phases.map((phase: Phase) => {
                const value = row[phase] ?? 0;
                const intensity = value / max;
                return (
                  <div
                    key={`${row.cancer}-${phase}`}
                    className="border-b border-slateish-100 px-1 py-3 text-center text-xs font-semibold text-navy-900"
                    style={{ backgroundColor: `rgba(49, 104, 142, ${0.04 + intensity * 0.28})` }}
                  >
                    {value}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResearchAnalyticsClient() {
  const { messages: m } = useI18n();
  const [cancer, setCancer] = useState('all');
  const [phase, setPhase] = useState('all');
  const [modality, setModality] = useState<'all' | Modality>('all');

  const cancerOptions = useMemo(() => Array.from(new Set(candidatesData.flatMap((candidate) => candidate.cancers))).sort(), []);
  const phaseOptions = matrixData.phases;
  const filtered = useMemo(() => candidatesData.filter((candidate) => {
    const cancerMatch = cancer === 'all' || candidate.cancers.includes(cancer);
    const phaseMatch = phase === 'all' || candidate.phase === phase;
    const modalityMatch = modality === 'all' || candidate.modality.includes(modality);
    return cancerMatch && phaseMatch && modalityMatch;
  }), [cancer, phase, modality]);

  return (
    <div className="container-page pb-16 sm:pb-20">
      <section className="rounded-2xl border border-slateish-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-600">{m.research.filters}</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-ink-950">{m.research.candidatesTitle}</h2>
          </div>
          <p className="text-sm text-slateish-500">{m.research.candidatesCount.replace('{n}', String(filtered.length))}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SelectField label={m.research.cancerFilter} value={cancer} onChange={setCancer}>
            <option value="all">{m.research.allCancers}</option>
            {cancerOptions.map((slug) => <option key={slug} value={slug}>{m.cancers[slug]?.label ?? slug}</option>)}
          </SelectField>
          <SelectField label={m.research.phaseFilter} value={phase} onChange={setPhase}>
            <option value="all">{m.research.allPhases}</option>
            {phaseOptions.map((item) => <option key={item} value={item}>{m.research.phaseLabels[phaseKey[item]]}</option>)}
          </SelectField>
          <SelectField label={m.research.modalityFilter} value={modality} onChange={(value) => setModality(value as 'all' | Modality)}>
            <option value="all">{m.research.allModalities}</option>
            <option value="targeted">{m.research.targeted}</option>
            <option value="immunotherapy">{m.research.immunotherapy}</option>
          </SelectField>
        </div>
      </section>

      <section className="mt-10">
        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} messages={m} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slateish-300 bg-slateish-50 p-10 text-center text-sm text-slateish-600">{m.research.noMatches}</div>
        )}
      </section>

      <section className="mt-16 border-t border-slateish-200 pt-10">
        <div className="mb-5 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-600">{m.research.studyPhase}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-950">{m.research.phaseMatrixTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slateish-500">{m.research.phaseMatrixCaption}</p>
        </div>
        <PhaseMatrix messages={m} />
      </section>

      <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm leading-relaxed text-amber-950">
        <strong>{m.research.officialSource}:</strong> {m.research.indexDisclaimer}
      </aside>
    </div>
  );
}
