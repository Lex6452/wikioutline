// @flow
import fs from 'fs-extra';
import path from 'path';

const services = {};

fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== path.basename(__filename))
  .forEach(name => {
    const servicePath = path.join(__dirname, name);
    // $FlowIssue
    const pkg = require(path.join(servicePath, 'package.json'));
    // $FlowIssue
    const Service = require(servicePath).default;
    services[pkg.name] = new Service();
  });

export default services;
