/**
 * sync-meta-to-github
 * ─────────────────────────────────────────────────────────────────────────────
 * Triggered by a Supabase Database Webhook on the `site_settings` table
 * (INSERT or UPDATE). Reads the latest row, patches the static index.html in
 * the GitHub repo so Google & other crawlers always see fresh meta tags.
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   GITHUB_PAT          – Fine-grained PAT with repo Contents write permission
 *   SUPABASE_URL        – auto-injected by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY – auto-injected by Supabase runtime
 *
 * Optional env (hardcoded fallback below):
 *   GITHUB_OWNER        – e.g. buildingmari
 *   GITHUB_REPO         – e.g. Mira
 *   GITHUB_BRANCH       – e.g. main
 *   GITHUB_FILE_PATH    – e.g. index.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GITHUB_OWNER     = Deno.env.get('GITHUB_OWNER')     ?? 'buildingmari';
const GITHUB_REPO      = Deno.env.get('GITHUB_REPO')      ?? 'Mira';
const GITHUB_BRANCH    = Deno.env.get('GITHUB_BRANCH')    ?? 'main';
const GITHUB_FILE_PATH = Deno.env.get('GITHUB_FILE_PATH') ?? 'index.html';
const GITHUB_PAT       = Deno.env.get('GITHUB_PAT')       ?? '';

const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Replace a single <meta> tag's content attribute. */
function replaceMeta(html: string, attrs: Record<string, string>, newContent: string): string {
  // Build a regex that matches <meta ...attrs... content="..."> in any attribute order.
  // We handle the two common patterns: name/property + content.
  const attrPattern = Object.entries(attrs)
    .map(([k, v]) => `(?=[^>]*${k}=["']${v}["'])`)
    .join('');
  const re = new RegExp(`(<meta${attrPattern}[^>]*content=["'])[^"']*(["'])`, 'i');
  return html.replace(re, `$1${escHtml(newContent)}$2`);
}

/** Replace the <title> tag. */
function replaceTitle(html: string, newTitle: string): string {
  return html.replace(/(<title>)[^<]*/i, `$1${escHtml(newTitle)}`);
}

/** Replace href on a <link rel="icon"> tag. */
function replaceFavicon(html: string, href: string): string {
  return html.replace(
    /(<link[^>]*rel=["']icon["'][^>]*href=["'])[^"']*(["'])/i,
    `$1${href}$2`,
  );
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── main ─────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow manual GET trigger too (handy for testing / first-time sync)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!GITHUB_PAT) {
    return new Response(
      JSON.stringify({ error: 'GITHUB_PAT secret not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    // 1. Fetch the latest site_settings row from Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: rows, error: dbErr } = await supabase
      .from('site_settings')
      .select('site_title,meta_description,og_title,og_description,og_image,favicon_url')
      .limit(1)
      .single();

    if (dbErr) throw new Error(`Supabase error: ${dbErr.message}`);
    const s = rows as {
      site_title?: string;
      meta_description?: string;
      og_title?: string;
      og_description?: string;
      og_image?: string;
      favicon_url?: string;
    };

    // 2. Fetch the current index.html from GitHub (need the sha for the commit)
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_PAT}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'mira-sync-meta',
    };

    const fileRes = await fetch(`${GITHUB_API}?ref=${GITHUB_BRANCH}`, { headers: ghHeaders });
    if (!fileRes.ok) throw new Error(`GitHub GET failed: ${fileRes.status} ${await fileRes.text()}`);

    const fileData: { content: string; sha: string } = await fileRes.json();
    // GitHub returns base64 with newlines
    let html = atob(fileData.content.replace(/\n/g, ''));
    const currentSha = fileData.sha;

    // 3. Patch the HTML
    if (s.site_title)        html = replaceTitle(html, s.site_title);
    if (s.meta_description)  html = replaceMeta(html,  { name: 'description' },      s.meta_description);
    if (s.og_title)          html = replaceMeta(html,  { property: 'og:title' },      s.og_title);
    if (s.og_description)    html = replaceMeta(html,  { property: 'og:description' }, s.og_description);
    if (s.og_image)          html = replaceMeta(html,  { property: 'og:image' },       s.og_image);
    if (s.favicon_url)       html = replaceFavicon(html, s.favicon_url);

    // 4. Commit back to GitHub
    const encoded = btoa(unescape(encodeURIComponent(html)));
    const putRes = await fetch(GITHUB_API, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'chore: sync meta tags from admin site_settings',
        content: encoded,
        sha: currentSha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status} ${await putRes.text()}`);

    return new Response(
      JSON.stringify({ ok: true, message: 'index.html updated on GitHub' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sync-meta-to-github]', msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
