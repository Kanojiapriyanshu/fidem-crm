import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { MiniUser } from '../types';
import { nfmt } from '../utils';

interface MiniUserSectionProps {
  title: string;
  users?: MiniUser[];
  max?: number; // optional cap (defaults to 12)
}

export const MiniUserSection = React.memo<MiniUserSectionProps>(({ title, users, max = 12 }) => {
  if (!users || users.length === 0) return null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {users.slice(0, max).map((u) => (
          <a
            key={u.userId}
            href={u.url || '#'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          >
            {u.picture ? (
              <img
                src={u.picture}
                alt={String(u.fullname || u.username || u.userId)}  // ← ensure string
                className="h-10 w-10 rounded-lg object-cover"
                loading="lazy"
              />

            ) : (
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
            )}

            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {u.fullname || u.username || u.userId}
              </div>
              <div className="truncate text-xs text-gray-600">
                {u.username ? `@${u.username}` : '—'}
              </div>
              {typeof u.followers === 'number' && (
                <div className="text-[10px] text-gray-500">{nfmt(u.followers)} followers</div>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
});

MiniUserSection.displayName = 'MiniUserSection';
