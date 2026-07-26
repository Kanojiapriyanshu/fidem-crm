import React from 'react';
import { PlayCircle, Heart, MessageCircle, Eye } from 'lucide-react';
import { RecentPost } from '../types';
import { nfmt, titleCase } from '../utils';

interface PopularPostsProps {
  posts: RecentPost[];
}

export const PopularPosts = React.memo<PopularPostsProps>(({ posts }) => {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Popular posts</h2>
        <span className="text-xs text-gray-500">Up to 12</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {posts.map((post, idx) => (
          <PostCard key={`${post.id}-${idx}`} post={post} />  // ← safe string key
        ))}

      </div>
    </section>
  );
});

PopularPosts.displayName = 'PopularPosts';

interface PostCardProps {
  post: RecentPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const title = derivePostTitle(post);
  const hasPreview = Boolean(post.thumbnail || post.image);
  const created = post.created ? new Date(post.created).toLocaleDateString() : "";

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow transition-shadow"
    >
      {/* Preview */}
      {hasPreview ? (
        <div className="aspect-video bg-gray-100 overflow-hidden relative">
          <img
            src={post.thumbnail || post.image}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
            loading="lazy"
          />
          {post.video && (
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayCircle className="h-10 w-10 drop-shadow-sm text-white/90" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-gray-50 flex items-center justify-center text-xs text-gray-400">
          No preview
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="line-clamp-2 text-xs font-medium mb-2">{title}</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 mb-2">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" /> {nfmt(post.likes)}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> {nfmt(post.comments)}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {nfmt(post.views)}
          </div>
        </div>

        {/* Date */}
        {created && (
          <div className="text-[10px] text-gray-500 mb-2">{created}</div>
        )}

        {/* Hashtags */}
        {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
};

function derivePostTitle(post: RecentPost): string {
  const base = (post.title || post.text || "").trim();
  if (base) return base;
  if (post.type) return `${titleCase(post.type)} post`;
  return "Post";
}