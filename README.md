## A sensible semantic-release configuration

To integrate, create a `release.config.js` at the root level of your project:

```js
const semanticReleaseConfig = require('@kengoldfarb/semantic-release-config')

const config = semanticReleaseConfig.default()

module.exports = config
```