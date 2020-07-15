const semanticReleaseConfig = require('./build/index')

const config = semanticReleaseConfig.default({
	config: semanticReleaseConfig.ReleaseConfiguration.Package
})

module.exports = config
