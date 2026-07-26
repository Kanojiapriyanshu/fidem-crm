import { NextRequest, NextResponse } from 'next/server';
import type { Platform } from '@/features/discovery/browse-influencer/types';

const USERS_ENDPOINT: Record<Platform, string> = {
  instagram: 'https://api.modash.io/v1/instagram/users',
  tiktok:    'https://api.modash.io/v1/tiktok/users',
  youtube:   'https://api.modash.io/v1/youtube/users',
};

function corsHeaders() {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

type AnyUser = {
  platform: Platform;
  userId?: string;
  username?: string;   // Modash “handle” for the account
  handle?: string;     // some payloads may also use `handle`
  fullname?: string;
  followers?: number;
  isVerified?: boolean;
  picture?: string;
  url?: string;
};

/** Compute a per-query score so we can prefer exact handle, then prefix, then fuzzy */
function scoreForQuery(u: AnyUser, qLower: string) {
  const uname = (u.username || u.handle || '').toLowerCase();
  const full  = (u.fullname || '').toLowerCase();
  const url   = (u.url || '').toLowerCase();

  // Strict handle comparisons first
  if (uname === qLower) return 100;
  if (url.includes(`/@${qLower}`)) return 95;

  // Name / handle quality tiers
  if (full === qLower) return 90;
  if (uname.startsWith(qLower)) return 70;
  if (full.startsWith(qLower))  return 60;
  if (uname.includes(qLower))   return 45;
  if (full.includes(qLower))    return 35;

  // Weak match
  return 10;
}

/** Merge duplicates by platform+username, keeping the highest-score version */
function dedupeByBest(items: (AnyUser & { __score: number })[]) {
  const map = new Map<string, AnyUser & { __score: number }>();
  for (const it of items) {
    const uname = (it.username || it.handle || '').toLowerCase();
    const key = `${it.platform}:${uname}`;
    const prev = map.get(key);
    if (!prev || it.__score > prev.__score) map.set(key, it);
  }
  return Array.from(map.values());
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.MODASH_API_KEY;
  if (!apiKey) {
    // Hide server configuration details from the client
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500, headers: corsHeaders() });
  }

  const { searchParams } = new URL(req.url);

  // SUPPORT MULTIPLE HANDLES: ?q=techwiser,worldofcolorx,@audreyvictoria
  const queries = (searchParams.get('q') || '')
    .split(',')
    .map(s => s.replace(/^@/, '').trim().toLowerCase())
    .filter(Boolean);

  const platforms = (searchParams.get('platforms') || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean) as Platform[];

  const strict = searchParams.get('strict') === '1';
  // default strategy: exact-first (then fuzzy)
  const matchMode = (searchParams.get('match') || 'exact-first').toLowerCase();

  if (!queries.length || platforms.length === 0) {
    return NextResponse.json(
      { error: 'Provide ?q=<handle>[,handle...]&platforms=instagram,tiktok,youtube' },
      { status: 400, headers: corsHeaders() }
    );
  }

  const collected: (AnyUser & { __score: number })[] = [];

  try {
    for (const p of platforms) {
      for (const q of queries) {
        const url = `${USERS_ENDPOINT[p]}?limit=10&query=${encodeURIComponent(q)}`;
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          cache: 'no-store',
        });

        const data = await r.json().catch(() => ({}));
        const users = Array.isArray(data?.users) ? data.users : [];

        for (const raw of users) {
          const username = raw.username || raw.handle || '';
          const u: AnyUser = {
            platform: p,
            userId: raw.userId,
            username,
            handle: raw.handle,
            fullname: raw.fullname,
            followers: raw.followers,
            isVerified: !!raw.isVerified,
            picture: raw.picture,
            url:
              p === 'instagram'
                ? `https://instagram.com/${username}`
                : p === 'tiktok'
                ? `https://www.tiktok.com/@${username}`
                : `https://www.youtube.com/@${username}`,
          };

          const s = scoreForQuery(u, q);
          collected.push({ ...u, __score: s });
        }
      }
    }

    // If strict, keep only exact handle matches against ANY provided q
    let results = dedupeByBest(collected);
    if (strict) {
      const qset = new Set(queries);
      results = results.filter(u => {
        const uname = (u.username || u.handle || '').toLowerCase();
        const url   = (u.url || '').toLowerCase();
        return qset.has(uname) || Array.from(qset).some(q => url.includes(`/@${q}`));
      });
    }

    // Sort results: exact-first (or by score) + tie-breakers
    results.sort((a, b) => {
      // higher score first
      const scoreDiff = (b as any).__score - (a as any).__score;
      if (scoreDiff !== 0) return scoreDiff;

      // prefer verified
      if (!!b.isVerified !== !!a.isVerified) return b.isVerified ? 1 : -1;

      // prefer more followers
      const af = a.followers ?? 0, bf = b.followers ?? 0;
      if (bf !== af) return bf - af;

      // stable but deterministic
      return String(a.username || '').localeCompare(String(b.username || ''));
    });

    // If match=exact and strict wasn’t set, simulate exact-only
    if (!strict && matchMode === 'exact') {
      const qset = new Set(queries);
      results = results.filter(u => {
        const uname = (u.username || u.handle || '').toLowerCase();
        const url   = (u.url || '').toLowerCase();
        return qset.has(uname) || Array.from(qset).some(q => url.includes(`/@${q}`));
      });
    }

    return NextResponse.json(
      { results: results.map(({ __score, ...rest }) => rest) },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err: any) {
    const raw = err?.message as string | undefined;
    const isSensitive = /api token|developer section|modash|authorization|bearer|modash_api_key/i.test(String(raw));
    const safe = isSensitive ? 'Lookup failed' : (raw || 'Lookup failed');
    return NextResponse.json(
      { error: safe },
      { status: 400, headers: corsHeaders() }
    );
  }
}

// If you also want OPTIONS here:
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
