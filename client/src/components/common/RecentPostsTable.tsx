import { SectionCard } from "./SectionCard";
import {
  formatCompactNumber,
  formatDate,
  truncateText,
  type SocialPost,
} from "./viewModashShared";

export function RecentPostsTable({ posts }: { posts: SocialPost[] }) {
  const openPost = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  console.log("POSTS",posts)
  return (
    <SectionCard
      title="Recent Posts Performance"
      action={<button className="text-xs font-semibold text-[#7d7569]">View all</button>}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-left">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ab9f8e]">
              <th className="px-3">Media</th>
              <th className="px-3">Post details</th>
              <th className="px-3">Views / Plays</th>
              <th className="px-3">Likes</th>
              <th className="px-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {posts.length ? (
              posts.map((post, index) => (
                <tr
                  key={`${post.text || "post"}-${index}`}
                  onClick={() => openPost(post.url)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPost(post.url);
                    }
                  }}
                  tabIndex={post.url ? 0 : -1}
                  role={post.url ? "button" : undefined}
                  className={`rounded-2xl bg-[#fffdfa] text-sm text-[#5d564d] ${
                    post.url ? "cursor-pointer transition hover:bg-[#fdf8f1]" : ""
                  }`}
                >
                  <td className="rounded-l-2xl px-3 py-3">
                    <div className="h-11 w-11 overflow-hidden rounded-xl bg-[#ece4d8]">
                      {post.image || post.thumbnail ? (
                        <img
                          src={post.image || post.thumbnail}
                          alt={post.text || "Post"}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-medium text-[#1f1f1f]">
                      {truncateText(post.text, 30)}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#a49684]">
                      {post.type || "Post"}
                    </div>
                  </td>

                  <td className="px-3 py-3 font-medium text-[#1f1f1f]">
                    {formatCompactNumber(post.views ?? post.likes)}
                  </td>

                  <td className="px-3 py-3 font-medium text-[#1f1f1f]">
                    {formatCompactNumber(post.likes)}
                  </td>

                  <td className="rounded-r-2xl px-3 py-3">
                    {formatDate(
                      post.publishedAt || post.postedAt || post.createdAt || post.date
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="rounded-2xl border border-dashed border-[#e8dfd2] px-4 py-10 text-center text-sm text-[#8b857b]"
                >
                  No recent post data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}