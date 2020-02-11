# Collect commit and deployment info from BuildKite and Github(or Enterprise)

# How to start

1. `npm install`

2. copy and make your own `.env` files from `.env-example`

    * Make sure you generate API TOKEN for `Github` and `BuildKite` with right access
    * Make sure you set your Github Enterpise API url if you are using GHE

3. `node index.js --startTime 2019-12-16 --endTime 2019-12-23 --pipeline aaa/application-ui --prodJob Prod --skipBuild 'Scheduled build'`

    * `startTime` and `endTime` specifies the date range of the deployments, the logic is `startTime(00:00:00) <= date < endTime(00:00:00))`
    * `pipeline` should be in `[organization]/[pipeline]` format, `organization` and `pipeline` are all variables in BuildKite
    * `prodJob` indicates the name of the pipeline job which does the production deployment
    * `skipBuild` Optional. Skip build with given message. Eg `Scheduled build`. 

# Output

It prints a table with following headers:

| Repo | Commit | Committed At | Deployed At | Deployment Build Id |
|------|--------|--------------|-------------|---------------------|

Then you can use whatever tools to analyse the data (E.g. Excel)
