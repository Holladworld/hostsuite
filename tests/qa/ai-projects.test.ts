import { describe, expect, it } from 'vitest';
import { mergeGeneratedSiteIntoProjectMetadata } from '../../lib/ai-projects';
import type { GeneratedSite } from '../../lib/ai-site';

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
