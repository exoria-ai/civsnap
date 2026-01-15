'use client';

import { Fact, HazardData } from '@/lib/types';

type InfoCardProps = {
  title: string;
  icon?: string;
  facts: Fact[];
};

export function InfoCard({ title, icon, facts }: InfoCardProps) {
  if (facts.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
        {icon && <span>{icon}</span>}
        {title}
      </h4>
      <dl className="space-y-2">
        {facts.map((fact) => (
          <div key={fact.id} className="flex flex-col">
            <dt className="text-xs text-gray-500 font-medium">{fact.label}</dt>
            <dd className="text-sm text-gray-900">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type HazardCardProps = {
  type: 'flood' | 'fire' | 'environmental';
  label: string;
  severity: HazardData['severity'];
  description: string;
};

export function HazardCard({ type, label, severity, description }: HazardCardProps) {
  const severityColors: Record<HazardData['severity'], { bg: string; text: string; badge: string }> = {
    none: { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-200 text-gray-700' },
    low: { bg: 'bg-green-50', text: 'text-green-800', badge: 'bg-green-200 text-green-800' },
    moderate: { bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-200 text-yellow-800' },
    high: { bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-200 text-orange-800' },
    very_high: { bg: 'bg-red-50', text: 'text-red-800', badge: 'bg-red-200 text-red-800' },
  };

  const colors = severityColors[severity];
  const icons: Record<string, string> = {
    flood: '🌊',
    fire: '🔥',
    environmental: '🌿',
  };

  const severityLabels: Record<HazardData['severity'], string> = {
    none: 'NONE KNOWN',
    low: 'LOW',
    moderate: 'MODERATE',
    high: 'HIGH',
    very_high: 'VERY HIGH',
  };

  return (
    <div className={`${colors.bg} border border-gray-200 rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`flex items-center gap-2 text-sm font-semibold ${colors.text}`}>
          <span>{icons[type] || '⚠️'}</span>
          {label}
        </h4>
        <span className={`px-2 py-0.5 text-xs font-bold rounded ${colors.badge}`}>
          {severityLabels[severity]}
        </span>
      </div>
      <p className="text-sm text-gray-700">{description}</p>
    </div>
  );
}
