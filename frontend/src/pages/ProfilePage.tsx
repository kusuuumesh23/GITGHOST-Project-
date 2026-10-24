import React, { useState, useEffect } from 'react';
import { useBusiness } from '../hooks/useBusiness';
import { useCrawl } from '../hooks/useCrawl';
import { Globe, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { activeBusiness, activeBusinessId, updateProfile, isLoading: isBusinessLoading } = useBusiness();
  const { crawlData, isLoading: isCrawling, startCrawl, retryCrawl, confirm } = useCrawl(activeBusinessId);

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [location, setLocation] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setName(activeBusiness.name || '');
      setWebsiteUrl(activeBusiness.websiteUrl || '');
      setIndustry(activeBusiness.industry || '');
      setDescription(activeBusiness.description || '');
      setBrandTone(activeBusiness.brandTone || '');
      setTargetAudience(activeBusiness.targetAudience || '');
      setLocation(activeBusiness.location || '');
    }
  }, [activeBusiness]);

  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl) return;
    await startCrawl(websiteUrl);
  };

  const handleApplyExtractedData = async () => {
    if (!crawlData?.extractedData) return;
    const extracted = crawlData.extractedData;
    setName(extracted.name || name);
    setIndustry(extracted.category || industry);
    setDescription(extracted.description || description);
    setBrandTone(extracted.brandVoiceAndTone || brandTone);
    setTargetAudience(extracted.targetAudience || targetAudience);
    if (extracted.contactInfo?.address) {
      setLocation(extracted.contactInfo.address);
    }

    await confirm({
      name: extracted.name,
      industry: extracted.category,
      description: extracted.description,
      brandTone: extracted.brandVoiceAndTone,
      targetAudience: extracted.targetAudience,
      location: extracted.contactInfo?.address,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name,
      websiteUrl,
      industry,
      description,
      brandTone,
      targetAudience,
      location,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isBusinessLoading && !activeBusiness) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded w-1/4"></div>
        <div className="h-48 bg-surface rounded"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Business Profile</h1>
          <p className="text-sm text-muted">
            Define the brand identity and ground truth context that guides daily AI post generation
          </p>
        </div>
      </div>

      {/* Section 1: TinyFish Website Crawler */}
      <div className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold text-charcoal">Extract Context via TinyFish Website Crawling</h2>
        </div>
        <p className="text-sm text-muted">
          Enter your public business website. TinyFish will safely crawl public pages to extract your business name, offerings, brand voice, and visual identity.
        </p>

        <form onSubmit={handleStartCrawl} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://example-cafe.com"
            required
            className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={isCrawling || !websiteUrl}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors shrink-0"
          >
            {isCrawling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Crawling Website...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Crawl Website
              </>
            )}
          </button>
        </form>

        {/* Crawl Results Banner */}
        {crawlData?.status === 'PROCESSING' && (
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-3 text-sm text-accent">
            <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
            <span>TinyFish browser automation is actively inspecting your website and extracting profile data...</span>
          </div>
        )}

        {crawlData?.status === 'FAILED' && (
          <div className="p-4 bg-status-failed-bg border border-status-failed-border rounded-lg flex items-start gap-3 text-sm text-status-failed-text">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Website crawl failed</p>
              <p className="text-xs opacity-90 mt-0.5">{crawlData.errorDetails || 'Could not extract data from the provided URL.'}</p>
            </div>
            <button
              onClick={retryCrawl}
              className="text-xs underline font-medium hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {crawlData?.status === 'COMPLETED' && crawlData.extractedData && (
          <div className="p-5 bg-background border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-status-published-text text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Extracted business data ready for review</span>
              </div>
              <button
                type="button"
                onClick={handleApplyExtractedData}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                Apply to Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-charcoal pt-1">
              <div>
                <span className="font-semibold text-muted">Brand Name:</span> {crawlData.extractedData.name}
              </div>
              <div>
                <span className="font-semibold text-muted">Industry:</span> {crawlData.extractedData.category}
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-muted">Description:</span> {crawlData.extractedData.description}
              </div>
              <div>
                <span className="font-semibold text-muted">Brand Tone:</span> {crawlData.extractedData.brandVoiceAndTone}
              </div>
              <div>
                <span className="font-semibold text-muted">Target Audience:</span> {crawlData.extractedData.targetAudience}
              </div>
              {crawlData.extractedData.brandColors && crawlData.extractedData.brandColors.length > 0 && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <span className="font-semibold text-muted">Extracted Colors:</span>
                  <div className="flex gap-1.5">
                    {crawlData.extractedData.brandColors.map((color, i) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-full border border-border inline-block shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Confirmed Profile Form */}
      <form onSubmit={handleSaveProfile} className="p-6 bg-surface border border-border rounded-xl shadow-subtle space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-base font-semibold text-charcoal">Confirmed Business Profile</h2>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-published-text">
              <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-charcoal">Business Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-charcoal">Industry / Category</label>
            <input
              type="text"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. Specialty Coffee & Roastery"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-charcoal">Business Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell us what makes your business unique..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-charcoal">Brand Voice & Tone</label>
            <input
              type="text"
              value={brandTone}
              onChange={e => setBrandTone(e.target.value)}
              placeholder="e.g. Warm, artisanal, grounded, and welcoming"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-charcoal">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="e.g. Local neighborhood residents and coffee enthusiasts"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-charcoal">Location / Neighborhood</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Portland, OR"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Business Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
