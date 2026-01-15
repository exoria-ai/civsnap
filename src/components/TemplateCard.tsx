'use client';

import { TemplateDefinition } from '@/lib/types';

type TemplateCardProps = {
  template: TemplateDefinition;
  selected?: boolean;
  onClick: () => void;
};

export function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-6 rounded-lg border-2 transition-all
        hover:shadow-md hover:border-blue-400
        ${selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{template.icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          <p className="mt-1 text-sm text-gray-600">{template.description}</p>
        </div>
      </div>
    </button>
  );
}
