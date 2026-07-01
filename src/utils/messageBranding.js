const { MessageFlags } = require('discord.js');

const BRAND_FOOTER = '-# Created by [Self-hosted bot by Core](https://github.com/Novogrey/Self-hosted-bot-by-Core)';
const COMPONENT_TYPES = {
  ActionRow: 1,
  TextDisplay: 10,
  Separator: 14,
  Container: 17
};

function numericFlags(flags) {
  if (typeof flags === 'number') return flags;
  if (typeof flags === 'bigint') return Number(flags);
  return Number(flags || 0);
}

function hasBrandFooter(component) {
  if (!component || typeof component !== 'object') return false;
  if (component.type === COMPONENT_TYPES.TextDisplay && String(component.content || '').includes('Self-hosted bot by Core')) {
    return true;
  }

  return Array.isArray(component.components) && component.components.some(hasBrandFooter);
}

function textDisplay(content) {
  return {
    type: COMPONENT_TYPES.TextDisplay,
    content: String(content || '').slice(0, 4000)
  };
}

function separator() {
  return { type: COMPONENT_TYPES.Separator };
}

function includesBrand(value) {
  return String(value || '').includes('Self-hosted bot by Core');
}

function appendBrandText(value) {
  const text = String(value || '').trim();
  if (includesBrand(text)) return text;
  return [text, BRAND_FOOTER].filter(Boolean).join('\n\n').slice(0, 4000);
}

function containerWithText(content) {
  return {
    type: COMPONENT_TYPES.Container,
    components: [
      textDisplay(content || '\u200b'),
      separator(),
      textDisplay(BRAND_FOOTER)
    ]
  };
}

function appendFooterToContainer(component) {
  if (!component || component.type !== COMPONENT_TYPES.Container || hasBrandFooter(component)) {
    return component;
  }

  return {
    ...component,
    components: [
      ...(Array.isArray(component.components) ? component.components : []),
      separator(),
      textDisplay(BRAND_FOOTER)
    ]
  };
}

function appendFooterComponents(components) {
  if (components.some(hasBrandFooter)) return components;
  return [
    ...components,
    separator(),
    textDisplay(BRAND_FOOTER)
  ];
}

function brandPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;

  const next = { ...payload };
  const flags = numericFlags(next.flags);
  const isV2 = Boolean(flags & MessageFlags.IsComponentsV2);
  const hasContent = typeof next.content === 'string' && next.content.length > 0;
  const components = Array.isArray(next.components) ? next.components : [];

  if (hasContent && !components.length && !next.embeds?.length) {
    next.flags = flags | MessageFlags.IsComponentsV2;
    next.components = [containerWithText(next.content)];
    delete next.content;
    return next;
  }

  if (!components.length) {
    if (typeof next.content === 'string') {
      next.content = appendBrandText(next.content);
    } else if (Array.isArray(next.embeds) && next.embeds.length) {
      const lastIndex = next.embeds.length - 1;
      const lastEmbed = { ...next.embeds[lastIndex] };
      lastEmbed.description = appendBrandText(lastEmbed.description || '\u200b');
      next.embeds = [...next.embeds.slice(0, lastIndex), lastEmbed];
    } else {
      next.content = BRAND_FOOTER;
    }
    return next;
  }

  if (components.some(hasBrandFooter)) return next;

  if (!isV2 && !components.some((component) => component?.type === COMPONENT_TYPES.Container)) {
    next.content = appendBrandText(next.content || '');
    return next;
  }

  if (isV2 || components.some((component) => component?.type === COMPONENT_TYPES.Container)) {
    next.flags = flags | MessageFlags.IsComponentsV2;
    const v2Components = hasContent ? [textDisplay(next.content), ...components] : components;
    next.components = appendFooterComponents(v2Components.map((component) => (
      component?.type === COMPONENT_TYPES.Container ? appendFooterToContainer(component) : component
    )));
    if (hasContent) delete next.content;
  }

  return next;
}

function brandRestBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;

  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return {
      ...body,
      data: brandPayload(body.data)
    };
  }

  return brandPayload(body);
}

function installMessageBranding(client) {
  if (!client?.rest || client.rest.__selfHostedBrandingInstalled) return;

  const originalRequest = client.rest.request.bind(client.rest);
  client.rest.request = function requestWithBranding(options) {
    if (options?.body) {
      return originalRequest({
        ...options,
        body: brandRestBody(options.body)
      });
    }

    return originalRequest(options);
  };

  Object.defineProperty(client.rest, '__selfHostedBrandingInstalled', {
    value: true,
    enumerable: false
  });
}

module.exports = {
  BRAND_FOOTER,
  brandPayload,
  brandRestBody,
  installMessageBranding
};
