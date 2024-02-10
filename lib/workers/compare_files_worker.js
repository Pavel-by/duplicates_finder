path = require('path');

require('ts-node').register();
require(path.join(__dirname, path.basename(__filename, '.js') + '.ts'));