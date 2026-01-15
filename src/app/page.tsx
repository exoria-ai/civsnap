'use client';

import { useState } from 'react';
import { templates } from '@/lib/templates';
import { InfographicSpec } from '@/lib/types';
import { TemplateCard } from '@/components/TemplateCard';
import { AddressInput, AddressSelection } from '@/components/AddressInput';
import { AddressSnapshot } from '@/components/AddressSnapshot';
import { ExportButtons } from '@/components/ExportButtons';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('address-snapshot');
  const [spec, setSpec] = useState<InfographicSpec | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (selection: AddressSelection) => {
    setIsLoading(true);
    setError(null);
    setSpec(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: selection.address,
          templateId: selectedTemplate,
          options: {},
          // Pass lat/lon if available (from autocomplete selection)
          ...(selection.lat !== undefined && selection.lon !== undefined
            ? { lat: selection.lat, lon: selection.lon }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      setSpec(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPNG = async () => {
    const element = document.getElementById('snapshot-container');
    if (!element) return;

    // Dynamic import to reduce initial bundle size
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `civsnap-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('snapshot-container');
    if (!element) return;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    });

    // Calculate dimensions to fit letter size
    const imgWidth = 8.5;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 11));
    pdf.save(`civsnap-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CivicSnap</h1>
              <p className="text-sm text-gray-500">GIS-grounded infographics with AI-assisted presentation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!spec ? (
          // Template selection and address input view
          <div className="space-y-8">
            {/* Template Selection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a template</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedTemplate === template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                  />
                ))}
              </div>
            </section>

            {/* Address Input */}
            <section className="max-w-2xl">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter an address</h2>
              <AddressInput
                onSubmit={handleGenerate}
                isLoading={isLoading}
                error={error}
              />
              <p className="mt-3 text-sm text-gray-500">
                Start typing a Solano County address to see suggestions (e.g., &quot;675 Texas&quot;)
              </p>
            </section>
          </div>
        ) : (
          // Preview view
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSpec(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to templates
              </button>
              <ExportButtons
                onExportPNG={handleExportPNG}
                onExportPDF={handleExportPDF}
              />
            </div>

            {/* Preview */}
            <AddressSnapshot spec={spec} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-sm text-gray-500 text-center">
            CivicSnap Demo - AI handles presentation, not facts. All data from authoritative GIS sources.
          </p>
        </div>
      </footer>
    </div>
  );
}
