import EmailService from '@/services/implementations/emailService';

describe('EmailService', () => {
  it('renders the richer layout payload with CTA and reason text', () => {
    const service = new EmailService({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'test@example.com',
        clientId: 'client-id',
        clientSecret: 'client-secret',
        refreshToken: 'refresh-token',
      },
    });

    const html = service.renderTemplate({
      title: 'Your Farm Has Been Approved!',
      previewText: 'Your farm is now live on the map.',
      body: 'Congratulations! Your farm is ready to be viewed by buyers.',
      recipientName: 'Mara',
      reasonText: 'This farm was reviewed and approved by the MFSN team.',
      ctaText: 'View your farm',
      ctaUrl: 'https://example.com/farms/123',
      isFarmerEmail: true,
    });

    expect(html).toContain('Hi Mara,');
    expect(html).toContain('Your Farm Has Been Approved!');
    expect(html).toContain('Your farm is now live on the map.');
    expect(html).toContain('View your farm');
    expect(html).toContain('https://example.com/farms/123');
    expect(html).toContain('This farm was reviewed and approved by the MFSN team.');
    expect(html).toContain('info@uwblueprint.org');
  });
});
