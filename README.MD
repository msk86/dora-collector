# Collect commit and deployment info from BuildKite and Github(or Enterprise), and show the statistics result dashboard

# How to start

1. Install kubernetes

2. Modify deploy/dora-secret.yml to configure the API tokens of github and buildkite.

3. Modify deploy/dora-collector.yml to configure the cronjobs to collect your build/commit data.

4. Run `./deploy.sh`

5. Open `http://localhost:30080` in browser, login with admin/admin to view the dashboard.