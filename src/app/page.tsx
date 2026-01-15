'use client';

import { useState } from 'react';
import { templates } from '@/lib/templates';
import { InfographicSpec } from '@/lib/types';
import { AppCard } from '@/components/AppCard';
import { AddressInput, AddressSelection } from '@/components/AddressInput';
import { AddressSnapshot } from '@/components/AddressSnapshot';
import { ExportButtons } from '@/components/ExportButtons';
import { DebugPanel } from '@/components/DebugPanel';
import { Modal } from '@/components/Modal';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [spec, setSpec] = useState<InfographicSpec | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleGenerate = async (selection: AddressSelection) => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: selection.address,
          templateId: selectedTemplate,
          options: {},
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

    const imgWidth = 8.5;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 11));
    pdf.save(`civsnap-${Date.now()}.pdf`);
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setSpec(null);
    setError(null);
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="relative">
        {/* Hero Background - Gradient with pattern (can be replaced with actual image) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
          {/* Topographic pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="topo" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0 50 Q 25 25, 50 50 T 100 50" stroke="white" strokeWidth="0.5" fill="none" />
                  <path d="M0 70 Q 25 45, 50 70 T 100 70" stroke="white" strokeWidth="0.5" fill="none" />
                  <path d="M0 30 Q 25 5, 50 30 T 100 30" stroke="white" strokeWidth="0.5" fill="none" />
                  <circle cx="20" cy="20" r="2" fill="white" opacity="0.3" />
                  <circle cx="80" cy="80" r="2" fill="white" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#topo)" />
            </svg>
          </div>
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10">
          {/* Top bar */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <span className="text-white font-bold text-lg">CS</span>
                </div>
                <span className="text-white/90 font-semibold text-lg">CivicSnap</span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <a href="#apps" className="text-white/70 hover:text-white transition-colors">Apps</a>
                <a href="#about" className="text-white/70 hover:text-white transition-colors">About</a>
              </nav>
            </div>
          </div>

          {/* Hero Text */}
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Solano County GIS
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Property reports, zoning lookups, and civic data tools powered by authoritative GIS sources
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative -mt-8 z-20">
        {/* Floating card container */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 id="apps" className="text-2xl font-bold text-gray-900">
                  Public Applications
                </h2>
                <p className="mt-1 text-gray-600">
                  Maps and tools for the public to use
                </p>
              </div>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <AppCard
                  key={template.id}
                  template={template}
                  onClick={() => setSelectedTemplate(template.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div id="about" className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900">About CivicSnap</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                CivicSnap transforms authoritative GIS data into clear, actionable property reports.
                AI handles presentation and formatting, but the facts come directly from verified
                government sources: parcel data, zoning layers, flood zones, and more.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white text-gray-700 shadow-sm">
                  Solano County Parcels
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white text-gray-700 shadow-sm">
                  FEMA Flood Data
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white text-gray-700 shadow-sm">
                  CAL FIRE Hazard Zones
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white text-gray-700 shadow-sm">
                  City Zoning Layers
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              CivicSnap - AI handles presentation, not facts. All data from authoritative GIS sources.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Solano County, California</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Address Input Modal */}
      <Modal
        isOpen={selectedTemplate !== null && spec === null}
        onClose={closeModal}
        title={selectedTemplateData?.name}
        size="md"
      >
        <div className="p-6">
          {/* Template description */}
          <p className="text-gray-600 mb-6">
            {selectedTemplateData?.description}
          </p>

          {/* Address Input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Enter a Solano County address
            </label>
            <AddressInput
              onSubmit={handleGenerate}
              isLoading={isLoading}
              error={error}
            />
            <p className="text-sm text-gray-500">
              Start typing to see address suggestions (e.g., &quot;675 Texas&quot;)
            </p>
          </div>
        </div>
      </Modal>

      {/* Results Modal */}
      <Modal
        isOpen={spec !== null}
        onClose={closeModal}
        size="full"
      >
        <div className="p-6">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {spec?.copy.title}
              </h2>
              <p className="text-gray-600">{spec?.copy.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showDebug
                    ? 'bg-yellow-500 text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Debug {showDebug ? 'ON' : 'OFF'}
              </button>
              <ExportButtons
                onExportPNG={handleExportPNG}
                onExportPDF={handleExportPDF}
              />
            </div>
          </div>

          {/* Report Content */}
          {spec && <AddressSnapshot spec={spec} />}

          {/* Debug Panel */}
          {showDebug && spec && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <DebugPanel spec={spec} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
