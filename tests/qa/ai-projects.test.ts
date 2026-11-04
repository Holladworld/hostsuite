import { describe, expect, it } from 'vitest';
import { mergeGeneratedSiteIntoProjectMetadata } from '../../lib/ai-projects';
import type { GeneratedSite } from '../../lib/ai-site';
import { AI_PROJECT_GENERATION_CLAIMABLE_STATUSES, canFinalizeAiProjectGeneration } from '../../lib/ai-project-state';

const generatedSite: GeneratedSite = {
  siteName: 'Northstar Foods',
  tagline: 'Fresh food for every table',
  navigation: ['Home', 'About', 'Contact'],
  blocks: [
    { type: 'hero', eyebrow: 'Welcome', title: 'Fresh choices', description: 'Locally sourced food.', primaryCta: 'Shop now', secondaryCta: 'Learn more' },
    { type: 'features', title: 'What we offer', items: [{ title: 'Fresh', description: 'Fresh produce.' }, { title: 'Local', description: 'Local suppliers.' }] },
    { type: 'about', title: 'Our story', body: 'A family food business.' },
  ],
};

describe('AI project persistence', () => {
  it('preserves the customer brief when generated content is saved', () => {
    const brief = {
      businessName: 'Northstar Foods',
      businessType: 'Food retailer',
      description: 'A local food shop serving families.',
      source: 'hostsuite-website-builder',
    };

    const result = mergeGeneratedSiteIntoProjectMetadata(brief, generatedSite, '2026-11-04T00:00:00.000Z');

    expect(result.businessName).toBe(brief.businessName);
    expect(result.businessType).toBe(brief.businessType);
    expect(result.description).toBe(brief.description);
    expect(result.generatedSite).toEqual(generatedSite);
    expect(result.generation).toEqual({
      status: 'ready',
      schemaVersion: 1,
      generatedAt: '2026-11-04T00:00:00.000Z',
    });
  });

  it('safely starts from empty metadata when stored metadata is not an object', () => {
    const result = mergeGeneratedSiteIntoProjectMetadata(null, generatedSite, '2026-11-04T00:00:00.000Z');

    expect(result.generatedSite).toEqual(generatedSite);
    expect(result.generation).toEqual({
      status: 'ready',
      schemaVersion: 1,
      generatedAt: '2026-11-04T00:00:00.000Z',
    });
  });
});


describe('AI project generation state rules', () => {
  it('allows generation claims only from draft, ready and failed projects', () => {
    expect(AI_PROJECT_GENERATION_CLAIMABLE_STATUSES).toEqual(['draft', 'ready', 'failed']);
    expect(AI_PROJECT_GENERATION_CLAIMABLE_STATUSES).not.toContain('generating');
    expect(AI_PROJECT_GENERATION_CLAIMABLE_STATUSES).not.toContain('deployed');
    expect(AI_PROJECT_GENERATION_CLAIMABLE_STATUSES).not.toContain('archived');
  });

  it('allows completion or failure only while the project is generating', () => {
    expect(canFinalizeAiProjectGeneration('generating')).toBe(true);
    expect(canFinalizeAiProjectGeneration('draft')).toBe(false);
    expect(canFinalizeAiProjectGeneration('ready')).toBe(false);
    expect(canFinalizeAiProjectGeneration('deployed')).toBe(false);
    expect(canFinalizeAiProjectGeneration('archived')).toBe(false);
    expect(canFinalizeAiProjectGeneration('failed')).toBe(false);
  });
});
