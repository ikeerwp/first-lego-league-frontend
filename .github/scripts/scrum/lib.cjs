const fs = require("node:fs");
const path = require("node:path");

const TEAMS_FILE = path.join(process.cwd(), ".github", "teams.txt");

const IN_PROGRESS_TASKS_LIMIT = 2

const STORY_POINTS_RE =
	/time estimation:?\r?\n+(0\.25|0\.5|1|2|3|4) story points?/;

const STORY_POINTS_LABELS = new Map([
	["0.25", "story-points-0_25"],
	["0.5", "story-points-0_5"],
	["1", "story-points-1"],
	["2", "story-points-2"],
	["3", "story-points-3"],
	["4", "story-points-4"],
]);

const INVALID_STORY_POINTS_LABEL = "invalid-story-points"

const ALL_STORY_POINTS_LABELS = Array.from(STORY_POINTS_LABELS.values());

const COIN_LABEL = "🪙";

const BUDGET_REPOS = [
	{ owner: "UdL-EPS-SoftArch-Igualada", repo: "first-lego-league-frontend" },
	{ owner: "UdL-EPS-SoftArch-Igualada", repo: "first-lego-league-backend" },
];

function requireTeamsFile(core) {
	if (!fs.existsSync(TEAMS_FILE)) {
		core.setFailed(
			`Missing required file: ${TEAMS_FILE}\n` +
			`Create it with one team per line, GitHub usernames separated by spaces.`
		);
		return null;
	}
	return fs.readFileSync(TEAMS_FILE, "utf8");
}

/** 
 * @param {string} teamsTxt
 */
function parseTeams(teamsTxt) {
	/** @type {Map<string, string[]>} */
	const userToTeam = new Map();
	/** @type {string[][]} */
	const teams = [];

	/** @type {string[]} */
	const lines = teamsTxt
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith("#"));

	for (const line of lines) {
		/** @type {string[]} */
		const members = line.split(/\s+/).filter(Boolean);
		if (members.length === 0) continue;

		teams.push(members);

		for (const u of members) {
			const key = u.toLowerCase();
			// First occurrence wins to avoid accidental reshuffles.
			if (!userToTeam.has(key)) userToTeam.set(key, members);
		}
	}

	return { userToTeam, teams };
}

/**
 * @param {{ userToTeam: Map<string, string[]> }} teamsIndex
 * @param {string} login
 */
function getTeamMembersOrNull(teamsIndex, login) {
	if (!login) return null;
	return teamsIndex.userToTeam.get(login.toLowerCase()) || null;
}

/**
 * @param {string} issueBody
 */
function extractStoryPointsOrNull(issueBody) {
	const bodyLc = (issueBody || "").toLowerCase();
	const m = STORY_POINTS_RE.exec(bodyLc);
	if (!m) return null;
	return m[1]; // capturing group (0.25|0.5|1|2|3|4)
}

/**
 * @param {string} points
 */
function storyPointsLabel(points) {
	return STORY_POINTS_LABELS.get(points) || null;
}

/**
 * @param {string} labelName
 */
function getPointsFromLabel(labelName) {
	for (const [points, label] of STORY_POINTS_LABELS.entries()) {
		if (label === labelName) return parseFloat(points);
	}
	return null;
}

/**
 * @param {string[]} team
 */
async function fetchTeamBudgetTasks(github, team) {
	const teamLower = team.map(u => u.toLowerCase());
	const tasks = [];

	for (const { owner, repo } of BUDGET_REPOS) {
		let page = 1;
		while (true) {
			const { data: issues } = await github.rest.issues.listForRepo({
				owner,
				repo,
				labels: COIN_LABEL,
				state: "all",
				per_page: 100,
				page,
			});
			if (issues.length === 0) break;
			for (const issue of issues) {
				if (issue.pull_request) continue;
				if (!teamLower.includes((issue.user?.login || "").toLowerCase())) continue;
				const spLabel = (issue.labels || []).find(l => ALL_STORY_POINTS_LABELS.includes(l.name));
				if (!spLabel) continue;
				const points = getPointsFromLabel(spLabel.name);
				if (points === null) continue;
				tasks.push({ number: issue.number, owner, repo, points });
			}
			if (issues.length < 100) break;
			page++;
		}
	}

	return tasks;
}

/**
 * Finds the optimal combination of available tasks covering requiredBudget.
 * Minimizes waste (sum - required); breaks ties by highest single-task value.
 * Returns the selected task objects, or null if total budget is insufficient.
 *
 * @param {number} requiredBudget
 * @param {{ number: number, owner: string, repo: string, points: number }[]} availableTasks
 */
function getBudgetTasks(requiredBudget, availableTasks) {
	const intRequired = Math.round(requiredBudget * 4);
	if (intRequired === 0) return [];

	const n = availableTasks.length;
	if (n === 0) return null;

	const taskInts = availableTasks.map(t => Math.round(t.points * 4));
	const maxSum = taskInts.reduce((s, v) => s + v, 0);
	if (maxSum < intRequired) return null;

	// 0/1 knapsack: dp[s] = best combination achieving sum exactly s
	// "best" at a given sum = highest maxTask (tie-breaker per spec)
	const dp = new Array(maxSum + 1).fill(null);
	dp[0] = { indices: [], maxTask: 0 };

	for (let i = 0; i < n; i++) {
		const v = taskInts[i];
		for (let s = maxSum; s >= v; s--) {
			if (dp[s - v] === null) continue;
			const prev = dp[s - v];
			const newMax = Math.max(prev.maxTask, v);
			if (dp[s] === null || newMax > dp[s].maxTask) {
				dp[s] = { indices: [...prev.indices, i], maxTask: newMax };
			}
		}
	}

	// Pick minimum sum >= intRequired; break ties by highest maxTask
	let bestSum = -1;
	let bestWaste = Infinity;
	let bestMaxTask = -1;

	for (let s = intRequired; s <= maxSum; s++) {
		if (dp[s] === null) continue;
		const waste = s - intRequired;
		if (waste < bestWaste || (waste === bestWaste && dp[s].maxTask > bestMaxTask)) {
			bestWaste = waste;
			bestMaxTask = dp[s].maxTask;
			bestSum = s;
		}
	}

	if (bestSum === -1) return null;
	return dp[bestSum].indices.map(i => availableTasks[i]);
}

/**
 * Removes a label from an issue in any repo (not just the current context repo).
 */
async function removeLabelFromIssue(github, owner, repo, issueNumber, labelName) {
	try {
		await github.rest.issues.removeLabel({
			owner,
			repo,
			issue_number: issueNumber,
			name: labelName,
		});
	} catch (e) {
		console.warn(`Failed to remove label "${labelName}" from ${owner}/${repo}#${issueNumber}:`, e);
	}
}

async function addComment(github, context, body) {
	await github.rest.issues.createComment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: context.payload.issue.number,
		body,
	});
}

async function closeIssue(github, context) {
	await github.rest.issues.update({
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: context.payload.issue.number,
		state: "closed",
		state_reason: "not_planned"
	});
}

async function addLabels(github, context, labels) {
	const wanted = labels.filter(Boolean);
	if (wanted.length === 0) return;

	const existing = new Set(
		(context.payload.issue.labels || []).map((l) => l.name)
	);
	const toAdd = wanted.filter((l) => !existing.has(l));
	if (toAdd.length === 0) return;

	await github.rest.issues.addLabels({
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: context.payload.issue.number,
		labels: toAdd,
	});
}

/**
 * @param {string} label
 */
async function removeLabelSafe(github, context, label) {
	try {
		await github.rest.issues.removeLabel({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.payload.issue.number,
			name: label,
		});
		return true
	} catch (e) {
		// ignore missing label (404) and other non-critical failures
		console.warn(e);
		return false
	}
}

function hasLabel(issue, labelName) {
	const labels = issue.labels || [];
	return labels.some((l) => (l.name || "").toLowerCase() === labelName.toLowerCase());
}

/**
 * Projects v2 helpers (GraphQL)
 */

async function getSingleRepoProjectV2(github, context) {
	const { owner, repo } = context.repo;

	const q = `
    query($owner:String!, $repo:String!) {
      repository(owner:$owner, name:$repo) {
        projectsV2(first: 10) {
          nodes { id title }
        }
      }
    }
  `;

	const res = await github.graphql(q, { owner, repo });
	const nodes = res.repository.projectsV2.nodes || [];

	if (nodes.length !== 1) {
		throw new Error(
			`Repository must have exactly 1 linked Projects v2 project, found ${nodes.length}.`
		);
	}
	return nodes[0];
}

async function getStatusFieldConfig(github, projectId) {
	const q = `
    query($projectId:ID!) {
      node(id:$projectId) {
        ... on ProjectV2 {
          fields(first: 100) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
              ... on ProjectV2Field {
                id
                name
              }
            }
          }
        }
      }
    }
  `;
	const res = await github.graphql(q, { projectId });
	const fields = res.node.fields.nodes || [];

	const status = fields.find((f) => f.name === "Status" && f.options);
	if (!status) throw new Error(`Project is missing a single-select field named "Status".`);

	return {
		fieldId: status.id,
		options: status.options || [],
	};
}

function findSingleStatusOptionId(options, needleLower) {
	const matches = options.filter((o) =>
		(o.name || "").toLowerCase().includes(needleLower)
	);
	if (matches.length !== 1) {
		throw new Error(
			`Expected exactly 1 Status option containing "${needleLower}", found ${matches.length}.`
		);
	}
	return matches[0].id;
}

async function getProjectItemIdForIssue(github, issueId, projectId) {
	const q = `
    query($issueId:ID!) {
      node(id:$issueId) {
        ... on Issue {
          projectItems(first: 50) {
            nodes {
              id
              project { id }
            }
          }
        }
      }
    }
  `;
	const res = await github.graphql(q, { issueId });
	const nodes = res.node.projectItems.nodes || [];
	const match = nodes.find((n) => n.project.id === projectId);
	return match ? match.id : null;
}

async function addIssueToProject(github, projectId, issueNodeId) {
	const m = `
    mutation($projectId:ID!, $contentId:ID!) {
      addProjectV2ItemById(input:{ projectId:$projectId, contentId:$contentId }) {
        item { id }
      }
    }
  `;
	const res = await github.graphql(m, { projectId, contentId: issueNodeId });
	return res.addProjectV2ItemById.item.id;
}

async function setProjectItemSingleSelect(github, projectId, itemId, fieldId, optionId) {
	const m = `
    mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $optionId:String!) {
      updateProjectV2ItemFieldValue(input:{
        projectId:$projectId,
        itemId:$itemId,
        fieldId:$fieldId,
        value:{ singleSelectOptionId:$optionId }
      }) {
        projectV2Item { id }
      }
    }
  `;
	await github.graphql(m, {
		projectId,
		itemId,
		fieldId,
		optionId,
	});
}

async function deleteProjectItem(github, projectId, itemId) {
	const m = `
    mutation($projectId:ID!, $itemId:ID!) {
      deleteProjectV2Item(input:{ projectId:$projectId, itemId:$itemId }) {
        deletedItemId
      }
    }
  `;
	await github.graphql(m, { projectId, itemId });
}

async function listProjectItemsWithStatusAndAssignees(github, projectId) {
	const items = [];
	let cursor = '';

	const q = `
    query($projectId:ID!, $cursor:String) {
		node(id:$projectId) {
			... on ProjectV2 {
				items(first: 100, after: $cursor) {
					pageInfo { hasNextPage endCursor }
					nodes {
						id
						status: fieldValueByName(name: "Status") {
							... on ProjectV2ItemFieldSingleSelectValue { name }
						}
						content {
							... on Issue {
								id
								number
								assignees(first: 50) { nodes { login } }
							}
						}
					}
				}
			}
		}
	}
  	`;

	while (true) {
		const res = await github.graphql(q, { projectId, cursor });
		const conn = res.node.items;
		items.push(...(conn.nodes || []));
		if (!conn.pageInfo.hasNextPage) break;
		cursor = conn.pageInfo.endCursor;
	}

	// Only return items that are Issues.
	return items.filter((it) => it.content && it.content.number);
}

module.exports = {
	IN_PROGRESS_TASKS_LIMIT,
	COIN_LABEL,

	// teams + story points
	requireTeamsFile,
	parseTeams,
	getTeamMembersOrNull,
	extractStoryPointsOrNull,
	storyPointsLabel,
	getPointsFromLabel,
	ALL_STORY_POINTS_LABELS,
	INVALID_STORY_POINTS_LABEL,

	// issues
	addComment,
	closeIssue,
	addLabels,
	removeLabelSafe,
	removeLabelFromIssue,
	hasLabel,

	// budget
	fetchTeamBudgetTasks,
	getBudgetTasks,

	// projects v2
	getSingleRepoProjectV2,
	getStatusFieldConfig,
	findSingleStatusOptionId,
	getProjectItemIdForIssue,
	addIssueToProject,
	setProjectItemSingleSelect,
	deleteProjectItem,
	listProjectItemsWithStatusAndAssignees,
};
