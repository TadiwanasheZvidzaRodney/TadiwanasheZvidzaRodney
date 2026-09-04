import { readFile, writeFile } from "node:fs/promises";

const username = process.env.GITHUB_ACTOR ?? "TadiwanasheZvidzaRodney";
const readmePath = new URL("../README.md", import.meta.url);
const response = await fetch(
  `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
  {
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }),
    },
  },
);

if (!response.ok) {
  throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
}

const repositories = (await response.json())
  .filter((repository) => !repository.fork && !repository.archived)
  .slice(0, 5);

const projects = repositories.length
  ? repositories
      .map((repository) => {
        const description = repository.description ?? "A project currently in development.";
        const language = repository.language ? ` | ${repository.language}` : "";
        const stars = repository.stargazers_count ? ` | ${repository.stargazers_count} stars` : "";

        return `- [**${repository.name}**](${repository.html_url}) - ${description}${language}${stars}`;
      })
      .join("\n")
  : "_No public repositories found yet._";

const readme = await readFile(readmePath, "utf8");
const startMarker = "<!-- START:latest-projects -->";
const endMarker = "<!-- END:latest-projects -->";
const sectionPattern = new RegExp(`(${startMarker})[\\s\\S]*?(${endMarker})`);

if (!sectionPattern.test(readme)) {
  throw new Error("README markers for latest projects were not found.");
}

await writeFile(readmePath, readme.replace(sectionPattern, `$1\n${projects}\n$2`));