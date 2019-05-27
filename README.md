# AWS Lambda Secrets Cache

It's best not to hardcode secrets into your serverless functions as anyone with access to your souce code will need to be trusted with your sensative data and also it requires redeployment if you want to change or rotate values. Luckily, AWS makes it easy to progamatically manages secrets by storing them in [AWS Systems Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html). Looking up values is straightforeward with the SDK, but each call requires a network request. Mocking out getting secrets in testing libraries like Jest can also be a chore.

This module offers up simple utility functions that will request new secrets from Parameter Store and cache the values for subsaquent calls. The cache is a singelton, so all calls made from a single container will share the same store. Mocking this module is an easy way to abstract the secret-fetching in tests.

### Basic Usage

```js
const { getSecret } = require("@spencerbeggs/aws-lambda-secrets-cache");

module.export.handler = async (event, context, callback) {
  let mySecret = await getSecret("/some/secret");
  callback(null, {
    statusCode: 200.
    body: mySecret
  });
};
```
