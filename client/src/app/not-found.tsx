import NotFoundScreen from "@/components/common/not-found-screen";

export default function GlobalNotFound() {
  return (
    <NotFoundScreen
      badge="Page Missing"
      title="Page not found"
      message="The page you requested could not be found. It may have been moved, deleted, or never existed."
      primaryHref="/"
      primaryLabel="Back to Home"
      secondaryHref="/login"
      secondaryLabel="Go to Login"
    />
  );
}