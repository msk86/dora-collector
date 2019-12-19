# Collect commit and deployment info from BuildKite and Github(or Enterprise)

# How to start

1. `npm install`

2. copy and make your own `.env` files from `.env-example`

    * Make sure you generate API TOKEN for `Github` and `BuildKite` with right access

3. `node index.js --startTime 2019-12-16 --endTime 2019-12-23 --pipeline aaa/application-ui --prodJob Prod`

    * `startTime` and `endTime` specifies the date range of the deployments
    * `pipeline` should be in `[organization]/[pipeline]` format, `organization` and `pipeline` are all variables in BuildKite
    * `prodJob` indicates the name of the pipeline job which does the production deployment

# Output

It prints a table:

| Repo | Commit | Committed At | Deployed At | Deployment Build Id |
|------|--------|--------------|-------------|---------------------|

Then you can use what every tools to analyse the data (E.g. Excel)

# Please notice

* Because of the API limitation of BuildKite, the performance of loading old builds are very bad. Please make sure you only retrive the data for latest 30 days.