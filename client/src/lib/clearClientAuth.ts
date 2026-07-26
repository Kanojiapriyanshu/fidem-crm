export function clearClientAuthStorage() {
  if (typeof window === "undefined") return;

  try {
    localStorage.clear();
  } catch {
    // ignore
  }

  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }

  try {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    const hostname = window.location.hostname;
    const hostnameParts = hostname.split(".");
    const domainCandidates = new Set<string>();

    domainCandidates.add(hostname);

    for (let i = 0; i < hostnameParts.length - 1; i += 1) {
      domainCandidates.add(`.${hostnameParts.slice(i).join(".")}`);
    }

    cookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0]?.trim();

      if (!cookieName) return;

      document.cookie = `${cookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`;

      domainCandidates.forEach((domain) => {
        document.cookie = `${cookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=${domain}`;
      });
    });
  } catch {
    // ignore
  }
}