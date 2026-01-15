'use client';

import { TemplateDefinition } from '@/lib/types';

type AppCardProps = {
  template: TemplateDefinition;
  coverImage?: string;
  coverGradient?: string;
  onClick: () => void;
};

// Default gradients for each template type
const defaultGradients: Record<string, string> = {
  'address-snapshot': 'from-blue-500 via-blue-600 to-indigo-700',
  'plain-language': 'from-emerald-500 via-teal-600 to-cyan-700',
  'neighbor-notification': 'from-amber-500 via-orange-600 to-red-700',
};

export function AppCard({ template, coverImage, coverGradient, onClick }: AppCardProps) {
  const gradient = coverGradient || defaultGradients[template.id] || 'from-gray-500 to-gray-700';

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white"
    >
      {/* Cover Image/Gradient Area */}
      <div className="relative h-40 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-500`}>
            {/* Abstract pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <pattern id={`grid-${template.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#grid-${template.id})`} />
              </svg>
            </div>
            {/* Floating icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-90 drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                {template.icon}
              </span>
            </div>
          </div>
        )}
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {template.name}
        </h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {template.description}
        </p>

        {/* Category badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {template.id === 'address-snapshot' && 'Property Report'}
            {template.id === 'plain-language' && 'AI Summary'}
            {template.id === 'neighbor-notification' && 'Planning Tool'}
          </span>
        </div>
      </div>
    </button>
  );
}
