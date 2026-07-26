import NotFoundScreen from "@/components/common/not-found-screen";

export default function AdminNotFound() {
  return (
    <NotFoundScreen
      badge="Admin Area"
      title="Admin page not found"
      message="The admin page you’re looking for is unavailable. It may have been removed, renamed, or the URL may be invalid."
      primaryHref="/admin/pitch-folders"
      primaryLabel="Back to Admin Dashboard"
      secondaryHref="/"
      secondaryLabel="Go Home"
    />
  );
}