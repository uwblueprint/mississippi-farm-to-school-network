import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = ['strong', 'em', 'u', 'a'];
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

/**
 * Server-side counterpart to $lib/utils/rich-text.ts's serializeRichText whitelist.
 * The client already sanitizes editor output before sending it, but requests can
 * bypass the client entirely (direct API calls), so the trust boundary has to be
 * enforced here too before the message is stored and later rendered via {@html}.
 */
export function sanitizeAnnouncementMessage(message: string): string {
	return sanitizeHtml(message, {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: { a: ['href'] },
		allowedSchemes: ALLOWED_SCHEMES,
		allowProtocolRelative: false,
		transformTags: {
			a: (_tagName, attribs) => ({
				tagName: 'a',
				attribs: {
					...(attribs.href ? { href: attribs.href } : {}),
					target: '_blank',
					rel: 'noreferrer noopener'
				}
			})
		}
	});
}
