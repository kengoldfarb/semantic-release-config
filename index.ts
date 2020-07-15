export type Branch =
	| string
	| { name: string; prerelease?: boolean; channel?: string }

export type Plugin = string | [string, Record<string, any>]

export enum ReleaseConfiguration {
	Package = 'package',
}

export const defaultOptions = {
	[ReleaseConfiguration.Package]: {
		npmPublish: true,
		branches: [{ name: 'master', channel: 'latest' }],
		releaseMessage: 'chore(release): ${nextRelease.version} [skip-ci-version]',
	},
}

function semanticRelease(options?: {
	/** Use a pre-defined release configuration as your base options. */
	config?: ReleaseConfiguration
	/** Override the default branch configuration. */
	branches?: Branch[]
	/** Set the changelog filename to use. Default is CHANGELOG.md */
	changelogFile?: string
	/** Must be set to true to publish the package to NPM */
	npmPublish?: boolean
	/**
	 * Git message to use when creating a new release.
	 *
	 * Default: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
	 */
	releaseMessage?: string
}) {
	if (!options) {
		options = {}
	}

	if (options.config && defaultOptions[options.config]) {
		options = defaultOptions[options.config]
	}

	const branches: Branch[] =
		options.branches || defaultOptions[ReleaseConfiguration.Package].branches

	const currentBranch = require('child_process')
		.execSync('git rev-parse --abbrev-ref HEAD')
		.toString()
		.trim()

	const isReleaseBranch = branches.find((b) => {
		if (
			b === currentBranch ||
			(typeof b === 'object' &&
				b.name === currentBranch &&
				b.prerelease !== true)
		) {
			return true
		}

		return false
	})

	const verifyConditions = [
		'@semantic-release/changelog',
		'@semantic-release/github',
	]

	const publish = ['@semantic-release/github']

	const prepare = []

	const plugins: Plugin[] = [
		'@semantic-release/commit-analyzer',
		'@semantic-release/release-notes-generator',
	]

	// Only bump the package.json version and write the changelog if this is a release branch
	if (isReleaseBranch) {
		prepare.push({
			path: '@semantic-release/changelog',
			changelogFile: options.changelogFile || 'CHANGELOG.md',
		})

		// NPM plugin handles bumping the package.json version
		plugins.push([
			'@semantic-release/npm',
			{ npmPublish: options.npmPublish === true },
		])

		prepare.push([
			'@semantic-release/npm',
			{ npmPublish: options.npmPublish === true },
		])

		prepare.push([
			'@semantic-release/git',
			{
				message:
					options.releaseMessage ||
					'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
			},
		])

		plugins.push('@semantic-release/git')

		plugins.push('@semantic-release/github')
	}

	if (options.npmPublish === true) {
		publish.unshift('@semantic-release/npm')
		verifyConditions.unshift('@semantic-release/npm')
	}

	return {
		branches,
		plugins,
		publishConfig: {
			registry: 'https://registry.npmjs.org/',
			tag: 'beta',
		},
		verifyConditions,
		prepare,
		publish,
		success: ['@semantic-release/github'],
		fail: ['@semantic-release/github'],
		generateNotes: {
			config: 'conventional-changelog-kengoldfarb',
		},
		analyzeCommits: {
			config: 'conventional-changelog-kengoldfarb',
			releaseRules: [
				// Custom Rules
				{ type: 'BREAKING', release: 'major' },
				{ type: 'breaking', release: 'major' },
				{ type: 'major', release: 'major' },

				// Angular
				{ type: 'feat', release: 'minor' },
				{ type: 'minor', release: 'minor' },

				// Custom default catch-all, treat it as a patch version
				{ release: 'patch' },
			],
		},
	}
}

export default semanticRelease
