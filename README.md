Github Org JS Dependency Search
====================
Ever wondered how many projects in a given Github organization have a specific lib dependency, but there are too many projects to look for? This script was created to solve this problem.

This project will search in all projects of an organization for a specific dependency inside the `package.json` files.


Output example of a search for `lib-dependency`:
```json
[
   {
      "repo":"repo-name-a",
      "dependencies":{
         "lib-dependency":"^2.5.0"
      }
   },
   {
      "repo":"repo-name-b",
      "dependencies":{
         "lib-dependency":"^1.5.0"
      }
   }
]

```
# Personal Token
To run this project you will need to generate a [Github Personal Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token), please give at least projects and files reading permission.

# Install
Clone this repository and install it dependencies:
```
$ npm install
```

# Running
Just execute the command bellow, answer the questions and wait for the `data.json` output file:
```
$ npm start
```

# License

This project is [MIT licensed](./LICENSE).
