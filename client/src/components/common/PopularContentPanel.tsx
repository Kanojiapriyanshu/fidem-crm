import { SectionCard } from "./SectionCard";
import {
  formatCompactNumber,
  truncateText,
  type SocialPost,
} from "./viewModashShared";

export function PopularContentPanel({ posts }: { posts: SocialPost[] }) {
  const openPost = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <SectionCard
      title="Popular Content"
      action={<button className="text-xs font-semibold text-[#7d7569]">View all</button>}
    >
      <div className="space-y-4">
        {posts.length ? (
          posts.slice(0, 2).map((post, index) => (
            <div
              key={`${post.text || "popular"}-${index}`}
              onClick={() => openPost(post.url)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPost(post.url);
                }
              }}
              tabIndex={post.url ? 0 : -1}
              role={post.url ? "button" : undefined}
              className={`overflow-hidden rounded-[20px] border border-[#efe8dd] bg-[#fffdfa] transition ${
                post.url ? "cursor-pointer hover:shadow-sm" : ""
              }`}
            >
              <div className="relative aspect-[16/10] bg-[#ece4d8]">
                {post.image || post.thumbnail ? (
                  <img
                    src={post.image || post.thumbnail}
                    alt={post.text || "Popular content"}
                    className="h-full w-full object-cover"
                  />
                ) : null}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                  <div className="text-sm font-semibold">{truncateText(post.text, 32)}</div>
                  <div className="mt-1 text-xs text-white/80">
                    {formatCompactNumber(post.views ?? post.likes)} views
                    {post.likes ? ` · ${formatCompactNumber(post.likes)} likes` : ""}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e8dfd2] px-4 py-10 text-center text-sm text-[#8b857b]">
            No popular content data available.
          </div>
        )}
      </div>
    </SectionCard>
  );
}