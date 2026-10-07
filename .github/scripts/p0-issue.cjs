// Opens or updates one P0 issue per check while it is failing, and closes it
// when the check passes again, so the issue history doubles as an incident log.
// Called from actions/github-script.

module.exports = async ({ github, context, title, failed, details }) => {
  const { owner, repo } = context.repo;
  const run = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;

  const { data: open } = await github.rest.issues.listForRepo({ owner, repo, state: "open", labels: "P0", per_page: 100 });
  const existing = open.find((issue) => issue.title === title);

  if (!failed) {
    if (existing) {
      await github.rest.issues.createComment({ owner, repo, issue_number: existing.number, body: `Recovered: ${run}` });
      await github.rest.issues.update({ owner, repo, issue_number: existing.number, state: "closed" });
    }
    return;
  }

  const body = `${details}\n\nFailing run: ${run}`;
  if (existing) {
    await github.rest.issues.createComment({ owner, repo, issue_number: existing.number, body: `Still failing. ${body}` });
    return;
  }

  try {
    await github.rest.issues.getLabel({ owner, repo, name: "P0" });
  } catch {
    await github.rest.issues.createLabel({ owner, repo, name: "P0", color: "b60205", description: "Production is broken or leaking" });
  }
  await github.rest.issues.create({ owner, repo, title, labels: ["P0"], body });
};
