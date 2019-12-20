require('dotenv').config();
const arg = require('arg');
const request = require('request-promise');
const { each, map, flatten, find, findLast, concat, includes, uniqBy, first, isEmpty } = require('lodash');

const BUILDKITE_TOKEN = process.env.BUILDKITE_TOKEN,
    BUILDKITE_API = process.env.BUILDKITE_API,
    GITHUB_TOKEN = process.env.GITHUB_TOKEN,
    GITHUB_API = process.env.GITHUB_API,
    DEFAULT_BUILDKITE_PAGE_SIZE = 30;


/*
startTime: 2019-12-01
endTime: 2019-12-08
pipeline: [organization]/[pipeline]
prodJob: Prod
*/
const {startTime, endTime, pipeline, prodJob = 'Prod'} = args();

requestBuildUntilDeployed(pipeline, startTime, endTime)
    .then(filterInBeforeEnd)
    .then(filterInAfterStart)
    .then(filterUndeployed)
    .then(addDeployBuild)
    .then(mergeWithGithub)
    .then(excelLog);


function prCommits(build) {
    return function(commits) {
        return map(commits, c => ({
            build_id: build.build_id,
            commit: c.sha,
            committed_at: c.commit.author.date,
            repository: build.repository,
            finished_at: build.finished_at,
            deployed_at: build.deployed_at,
            deploy_build: build.deploy_build
        }));
    };
}

function getPrCommits(pr) {
    return request({
        uri: `${GITHUB_API}/repos/${pr.head.repo.full_name}/pulls/${pr.number}/commits`,
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    }).then(toJSON);
}

function getPR(build) {
    return request({
        uri: `${GITHUB_API}/repos/${build.repository}/commits/${build.commit}/pulls`,
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.groot-preview+json'
        }
    }).then(toJSON).then(first);
    //TODO support complex branch model. only deal with PR merge to master now.
}

function mergeWithGithub(builds) {
    return Promise.all(map(builds, build => {
        return getPR(build).then(pr => {
            if(pr) {
                return getPrCommits(pr).then(prCommits(build));
            } else {
                return build;
            }
        })
    })).then(flatten);
}

function addDeployBuild(data) {
    var currDeployId = '', currDeployedAt = '';
    data.forEach(d => {
        if(d.deployed_at) {
            currDeployId = d.build_id;
            currDeployedAt = d.deployed_at;
        } 
        d.deploy_build = currDeployId;
        d.deployed_at = currDeployedAt;
    });

    return data;
}

function filterUndeployed(data) {
    return data.slice(data.findIndex(d => d.deployed_at));
}

function filterInAfterStart(data) {
    return data.slice(0, data.findIndex(d => isDateEarly(d.deployed_at, startTime)));
}

function filterInBeforeEnd(data) {
    return data.filter(d => isDateEarly(d.finished_at, endTime));
}

function isDateEarly(d1, d2) {
    return new Date(d1) < new Date(d2);
}

function cleanData(data) {
    return map(data, d => {
        return {
            build_id: `${d.pipeline.slug}/${d.number}`,
            commit: d.commit,
            committed_at: isEmpty(d.meta_data) ? d.created_at : d.meta_data['buildkite:git:commit'].match(/\nCommitDate: (.+)\n/)[1],
            repository: d.pipeline.provider.settings.repository,
            finished_at: d.finished_at,
            deployed_at: (find(d.jobs, j => j.state == 'passed' && includes(j.name, prodJob)) || {}).finished_at,
            deploy_build: undefined
        }
    });
}

function toJSON(data) {
    return JSON.parse(data);
}

function requestBuildForOnePage(pipeline, startTime, endTime, page) {
    return request({
        uri: `${BUILDKITE_API}/v2/organizations/${pipeline.split('/').join('/pipelines/')}/builds`,
        headers: {
            'Authorization': `Bearer ${BUILDKITE_TOKEN}`
        },
        qs: {
            finished_from: startTime,
            created_to: endTime,
            page: page,
            per_page: DEFAULT_BUILDKITE_PAGE_SIZE
        }
    }).then(toJSON).then(cleanData);
}

function requestBuildForAllPages(pipeline, startTime, endTime, page, until) {
    return requestBuildForOnePage(pipeline, startTime, endTime, page)
        .then(data => {
            if (data.length < DEFAULT_BUILDKITE_PAGE_SIZE || findLast(data, until)) { 
                return data;
            } else {
                return requestBuildForAllPages(pipeline, startTime, endTime, page + 1, until)
                    .then(dataNextPage => uniqBy(concat(data, dataNextPage), d => d.build_id));
            }
        });
}

function requestBuildUntilDeployed(pipeline, startTime, endTime) {
    return requestBuildForAllPages(pipeline, yearAgo(startTime), endTime, 1, d => new Date(d.deployed_at) < new Date(startTime));
}

function yearAgo(time) {
    return new Date(new Date(time) - 365 * 86400 * 1000);
}

function formatTime(time) {
    return new Date(time).toGMTString().replace(/ GMT/, '');
}

function debugLog(data) {
    console.log(data);
    return data;
}

function excelLog(data) {
    each(data, d => console.log(`${d.repository}	${d.commit}	${formatTime(d.committed_at)}	${formatTime(d.deployed_at)}	${d.deploy_build}`));
    return data;
}

function args() {
    const argWithDash = arg({
        // Types
        '--startTime': String,
        '--endTime': String,
        '--pipeline': String,
        '--prodJob': String
    });

    return {
        startTime: argWithDash['--startTime'],
        endTime: argWithDash['--endTime'],
        pipeline: argWithDash['--pipeline'],
        prodJob: argWithDash['--prodJob']
    };
}