const { MessageFlags } = require('discord.js');

const BRAND_FOOTER = '-# [Self-hosted bot by Core](https://discord.gg/YF8krDPCZh)';
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

  if (!components.length) return next;

  if (components.some(hasBrandFooter)) return next;

  if (isV2 || components.some((component) => component?.type === COMPONENT_TYPES.Container)) {
    next.flags = flags | MessageFlags.IsComponentsV2;
    next.components = components.map((component, index) => {
      if (component?.type === COMPONENT_TYPES.Container) return appendFooterToContainer(component);
      if (index === 0) {
        return containerWithText(hasContent ? next.content : '\u200b');
      }
      return component;
    });
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
