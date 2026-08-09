const INLINE_TAGS: Record<string, string> = {
	B: 'strong',
	STRONG: 'strong',
	I: 'em',
	EM: 'em',
	U: 'u'
};

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:'];

export function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function safeHref(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const url = new URL(candidate);
		return SAFE_PROTOCOLS.includes(url.protocol) ? url.href : null;
	} catch {
		return null;
	}
}

export function serializeRichText(root: Node): string {
	let output = '';

	root.childNodes.forEach((node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			output += escapeHtml(node.textContent ?? '');
			return;
		}
		if (node.nodeType !== Node.ELEMENT_NODE) return;

		const element = node as HTMLElement;
		if (element.tagName === 'BR') {
			output += ' ';
			return;
		}

		const inner = serializeRichText(element);
		if (!inner) return;

		if (element.tagName === 'A') {
			const href = safeHref(element.getAttribute('href') ?? '');
			output += href
				? `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${inner}</a>`
				: inner;
			return;
		}

		const tag = INLINE_TAGS[element.tagName];
		output += tag ? `<${tag}>${inner}</${tag}>` : inner;
	});

	return output;
}

export function stripHtml(value: string): string {
	return value
		.replace(/<[^>]*>/g, '')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}
