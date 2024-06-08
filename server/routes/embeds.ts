import { Context, Next } from "koa";

/**
 * Resize observer script that sends a message to the parent window when content is resized. Inject
 * this script into the iframe to receive resize events.
 */
const resizeObserverScript = (
  ctx: Context
) => `<script nonce="${ctx.state.cspNonce}">
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      window.parent.postMessage({ "type": "frame-resized", "value": entry.contentRect.height }, '*');
    }
  });
  resizeObserver.observe(document.body);
</script>`;

/**
 * Script that checks if the iframe is being loaded in an iframe. If it is not, it redirects to the
 * origin URL.
 */
const iframeCheckScript = (
  ctx: Context
) => `<script nonce="${ctx.state.cspNonce}">
  if (window.self === window.top) {
    window.location.href = window.location.origin;
  }
</script>`;

/**
 * Render an embed for a GitLab or GitHub snippet, injecting the necessary scripts to handle resizing
 * and iframe checks.
 *
 * @param ctx The koa context
 * @param next The next middleware in the stack
 * @returns The response body
 */
export const renderEmbed = async (ctx: Context, next: Next) => {
  const url = String(ctx.query.url);

  if (!url) {
    ctx.throw(400, "url is required");
  }

  if (url.startsWith("https://gitlab.com") && ctx.path === "/embeds/gitlab") {
    const snippetUrl = new URL(url);
    const snippetLink = `${snippetUrl}.js`;
    const csp = ctx.response.get("Content-Security-Policy");

    // inject gitlab.com into the script-src and style-src directives
    ctx.set(
      "Content-Security-Policy",
      csp
        .replace("script-src", "script-src gitlab.com")
        .replace("style-src", "style-src gitlab.com")
    );
    ctx.set("X-Frame-Options", "sameorigin");

    ctx.type = "html";
    ctx.body = `
<html>
<head>
<style>body { margin: 0; .gitlab-embed-snippets { margin: 0; } }</style>
<base target="_parent">
${iframeCheckScript(ctx)}
</head>
<body>
<script type="text/javascript" src="${snippetLink}"></script>
${resizeObserverScript(ctx)}
</body>
`;
    return;
  }

  if (
    url.startsWith("https://gist.github.com") &&
    ctx.path === "/embeds/github"
  ) {
    const gistUrl = new URL(url);
    const id = gistUrl.pathname.split("/")[2];
    const gistLink = `https://gist.github.com/${id}.js`;
    const csp = ctx.response.get("Content-Security-Policy");

    // inject gist.github.com into the script-src and style-src directives
    ctx.set(
      "Content-Security-Policy",
      csp
        .replace("script-src", "script-src gist.github.com")
        .replace("style-src", "style-src gist.github.com")
    );

    ctx.type = "html";
    ctx.body = `
<html>
<head>
<style>*{ font-size:12px; } body { margin: 0; } .gist .blob-wrapper.data { max-height:300px; overflow:auto; }</style>
<base target="_parent">
${iframeCheckScript(ctx)}
</head>
<body>
<script type="text/javascript" src="${gistLink}"></script>
${resizeObserverScript(ctx)}
</body>
`;
    return;
  }

  return next();
};
