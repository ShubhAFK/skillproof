// Server-only GitHub Evidence Fetcher

export interface ParsedRepo {
  owner: string;
  repo: string;
  fullRepo: string;
}

export interface CommitItem {
  sha: string;
  author: string;
  date: string;
  message: string;
}

export interface CommitStats {
  total: number;
  distinctDays: number;
  firstDate: string | null;
  lastDate: string | null;
  authors: string[];
}

export interface RepoEvidenceSuccess {
  ok: true;
  repo: string;
  isFork: boolean;
  archived: boolean;
  defaultBranch: string;
  createdAt: string;
  pushedAt: string;
  stars: number;
  languages: Record<string, number>;
  fileCount: number;
  fileList: string[];
  readme: string;
  commits: CommitItem[];
  commitStats: CommitStats;
  fetchedAt: number;
}

export interface RepoEvidenceFailure {
  ok: false;
  reason: string;
}

export type RepoEvidenceResult = RepoEvidenceSuccess | RepoEvidenceFailure;

/**
 * Validates and parses a repository URL.
 * Only accepts https://github.com/{owner}/{repo} (stripping .git, trailing slashes, /tree/...).
 * Rejects any non-GitHub or non-https URLs to prevent SSRF / arbitrary host requests.
 */
export function parseRepoUrl(url: string): ParsedRepo | null {
  if (!url || typeof url !== "string") return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return null;
    if (parsed.hostname.toLowerCase() !== "github.com") return null;

    const segments = parsed.pathname
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean);

    if (segments.length < 2) return null;

    const owner = segments[0];
    let repo = segments[1];
    if (repo.endsWith(".git")) {
      repo = repo.slice(0, -4);
    }

    const validIdentifier = /^[a-zA-Z0-9_.-]+$/;
    if (!validIdentifier.test(owner) || !validIdentifier.test(repo)) {
      return null;
    }

    return {
      owner,
      repo,
      fullRepo: `${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

function getSignal(timeoutMs = 8000): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

const IGNORED_PATH_REGEX = /(^|\/)(node_modules|dist|\.next|build|\.git)(\/|$)/i;
const IGNORED_LOCK_REGEX = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|Cargo\.lock|composer\.lock|Gemfile\.lock|poetry\.lock)$/i;

async function fetchGithub(url: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (netErr: any) {
    const msg = (netErr?.message || "").slice(0, 300);
    console.error("github", 0, "none", msg);
    throw netErr;
  }
  if (!res.ok) {
    try {
      const text = await res.clone().text();
      const body = text.slice(0, 300);
      console.error("github", res.status, "none", body);
    } catch {
      console.error("github", res.status, "none", "");
    }
  }
  return res;
}

/**
 * Fetches repository evidence in parallel from the GitHub REST API.
 * Uses 8s timeout per call. Works authenticated if GITHUB_TOKEN exists, or unauthenticated.
 * Handles failures gracefully without throwing.
 */
export async function fetchRepoEvidence(url: string): Promise<RepoEvidenceResult> {
  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return {
      ok: false,
      reason: "Invalid GitHub repository URL. Expected format: https://github.com/{owner}/{repo}",
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "SkillProof-Evidence-Fetcher/1.0",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const [repoRes, readmeRes, treeRes, commitsRes, languagesRes] = await Promise.allSettled([
      fetchGithub(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
        headers,
        signal: getSignal(8000),
      }),
      fetchGithub(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, {
        headers: { ...headers, Accept: "application/vnd.github.raw+json" },
        signal: getSignal(8000),
      }),
      fetchGithub(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/HEAD?recursive=1`, {
        headers,
        signal: getSignal(8000),
      }),
      fetchGithub(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=30`, {
        headers,
        signal: getSignal(8000),
      }),
      fetchGithub(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`, {
        headers,
        signal: getSignal(8000),
      }),
    ]);

    // Check repository metadata response first
    if (repoRes.status === "rejected") {
      const isTimeout = repoRes.reason?.name === "TimeoutError" || repoRes.reason?.name === "AbortError";
      return {
        ok: false,
        reason: isTimeout
          ? "GitHub API request timed out (8s limit exceeded)."
          : "Could not connect to GitHub API.",
      };
    }

    const repoHttp = repoRes.value;
    if (repoHttp.status === 404) {
      return { ok: false, reason: "Repository not found or is private on GitHub." };
    }
    if (repoHttp.status === 403) {
      return { ok: false, reason: "GitHub API rate limit exceeded or access forbidden." };
    }
    if (!repoHttp.ok) {
      return { ok: false, reason: `GitHub API returned HTTP ${repoHttp.status}.` };
    }

    const repoData = await repoHttp.json();

    // Parse README
    let readme = "";
    if (readmeRes.status === "fulfilled" && readmeRes.value.ok) {
      try {
        const rawReadme = await readmeRes.value.text();
        readme = rawReadme.slice(0, 6000);
      } catch {
        readme = "";
      }
    }

    // Parse File Tree
    let fileCount = 0;
    let fileList: string[] = [];
    if (treeRes.status === "fulfilled" && treeRes.value.ok) {
      try {
        const treeJson = await treeRes.value.json();
        const rawTree = Array.isArray(treeJson?.tree) ? treeJson.tree : [];
        const validFiles = rawTree
          .filter((item: any) => item.type === "blob" && typeof item.path === "string")
          .map((item: any) => item.path as string)
          .filter((p: string) => !IGNORED_PATH_REGEX.test(p) && !IGNORED_LOCK_REGEX.test(p));

        fileCount = validFiles.length;
        fileList = validFiles.slice(0, 150);
      } catch {
        fileCount = 0;
        fileList = [];
      }
    }

    // Parse Commits
    let commits: CommitItem[] = [];
    if (commitsRes.status === "fulfilled" && commitsRes.value.ok) {
      try {
        const commitsJson = await commitsRes.value.json();
        if (Array.isArray(commitsJson)) {
          commits = commitsJson.slice(0, 30).map((c: any) => ({
            sha: (c.sha || "").slice(0, 7),
            author: c.author?.login || c.commit?.author?.name || "unknown",
            date: c.commit?.author?.date || c.commit?.committer?.date || "",
            message: (c.commit?.message || "").split("\n")[0].trim().slice(0, 120),
          }));
        }
      } catch {
        commits = [];
      }
    }

    const dates = commits.map((c) => c.date).filter(Boolean);
    const distinctDays = new Set(dates.map((d) => d.slice(0, 10))).size;
    const authors = Array.from(new Set(commits.map((c) => c.author).filter(Boolean)));
    const sortedDates = [...dates].sort();
    const firstDate = sortedDates[0] || null;
    const lastDate = sortedDates[sortedDates.length - 1] || null;

    const commitStats: CommitStats = {
      total: commits.length,
      distinctDays,
      firstDate,
      lastDate,
      authors,
    };

    // Parse Languages
    let languages: Record<string, number> = {};
    if (languagesRes.status === "fulfilled" && languagesRes.value.ok) {
      try {
        languages = await languagesRes.value.json();
      } catch {
        languages = {};
      }
    }

    return {
      ok: true,
      repo: parsed.fullRepo,
      isFork: Boolean(repoData.fork),
      archived: Boolean(repoData.archived),
      defaultBranch: repoData.default_branch || "main",
      createdAt: repoData.created_at || "",
      pushedAt: repoData.pushed_at || "",
      stars: repoData.stargazers_count || 0,
      languages,
      fileCount,
      fileList,
      readme,
      commits,
      commitStats,
      fetchedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      ok: false,
      reason: err?.message || "Unexpected error while fetching GitHub evidence.",
    };
  }
}
