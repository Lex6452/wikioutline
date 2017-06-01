# Atlas

## Installation

 1. Install dependencies with `yarn`
 1. Register a Slack app at https://api.slack.com/apps
 1. Copy the file `.env.sample` to `.env` and fill out the keys
 1. Run DB migrations `yarn run sequelize -- db:migrate`
 1. Start the development server `yarn start`


## Migrations

Sequelize is used to create and run migrations, for example:

```
yarn run sequelize -- migration:create
yarn run sequelize -- db:migrate
```
