const inqurer = require('inquirer');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');

const INTERVAL = 4000;

const isRequired = message => value => {
  if (value) {
    return true;
  }

  return message;
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const getRepos = async (octokit, org) => {
  const repos = [];

  for await (const { data } of octokit.paginate.iterator(
    'GET /orgs/:org/repos',
    {
      org
    }
  )) {
    repos.push(...data.map(({ full_name }) => full_name));
  }

  return repos;
};

const getFile = async (octokit, owner, repo, path) => {
  const content = await octokit.repos.getContent({
    owner,
    repo,
    path,
    headers: {
      Accept: 'application/vnd.github.v3.raw'
    }
  });

  return content.data;
};

const processPackageJson = (json, dependency) => {
  const { dependencies, devDependencies } = JSON.parse(json);
  const filterNotDep = (obj = {}) =>
    Object.keys(obj)
      .filter(key => key.includes(dependency))
      .reduce((result, key) => ({ ...result, [key]: obj[key] }), {});

  return {
    ...filterNotDep(dependencies),
    ...filterNotDep(devDependencies)
  };
};

const findDependencies = async (octokit, repos, dependency) => {
  const result = [];

  for (const full_name of repos) {
    await sleep(INTERVAL);

    const search = async full_name =>
      await octokit.search
        .code({
          q: `${dependency}+in:file+language:json+repo:${full_name}`
        })
        .catch(err => {
          console.log('Error:', err);
          return {};
        });

    const { data } = await search(full_name);

    console.log(
      `Fetched ${repos.indexOf(full_name) + 1}/${
        repos.length
      } - ${full_name}, result:`,
      JSON.stringify(data)
    );

    if (data && data.total_count > 0) {
      for (const { path } of data.items) {
        const [owner, repo] = full_name.split('/');

        await sleep(INTERVAL);

        const packageJson = await getFile(octokit, owner, repo, path);

        const finalData = {
          repo,
          dependencies: processPackageJson(packageJson, dependency)
        };

        if (Object.keys(finalData.dependencies).length > 0) {
          console.log('Found dependencies:', finalData);
          result.push(finalData);
        }
      }
    }
  }

  return result;
};

inquirer
  .prompt([
    {
      type: 'input',
      message:
        'Enter the Github Organization where we will search for the dependecy:',
      name: 'org',
      validade: isRequired(
        'You need to insert the Github Organization to run this script'
      )
    },
    {
      type: 'input',
      message: 'Enter the dependecy name:',
      name: 'dependency',
      validade: isRequired(
        'You need to insert the dependency name to run this script'
      )
    },
    {
      type: 'password',
      message: 'Enter your Github personal token:',
      name: 'personalToken',
      mask: '*',
      validade: isRequired(
        'You need to insert your Github personal token to run this script'
      )
    }
  ])
  .then(async ({ personalToken, org, dependency }) => {
    const octokit = new Octokit({
      auth: personalToken
    });

    console.log(`Getting repositories list of ${org}...`);
    const repos = await getRepos(octokit, org);

    console.log(
      `Repositories list fetched, estimated time: ${(repos.length * INTERVAL) /
        60000} minutes.`
    );

    const result = await findDependencies(octokit, repos, dependency);

    console.log('Finished processing, generating data.json file!');
    fs.writeFileSync('data.json', JSON.stringify(result));
  });
