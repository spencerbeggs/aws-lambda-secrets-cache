import AWS from "aws-sdk";

const SECRETS = {};

function fetchSecrets(
  decyrpt,
  keys,
  /* istanbul ignore next */ ssm = new AWS.SSM()
) {
  return new Promise((resolve, reject) => {
    if (!keys || (typeof keys !== "string" && !Array.isArray(keys))) {
      reject(
        new Error(
          "You must pass a string of array of strings as the first argument"
        )
      );
    }
    let isSingle = typeof keys === "string";
    if (isSingle) {
      keys = [keys];
    }
    if (keys.every(key => !SECRETS[key])) {
      ssm.getParameters(
        {
          Names: keys,
          WithDecryption: decyrpt
        },
        (err, data) => {
          if (err) {
            return reject(err);
          }
          if (!data) {
            return resolve(null);
          }
          data.Parameters.forEach(item => {
            SECRETS[item.Name] = item.Value;
          });
          return resolve(
            isSingle ? SECRETS[keys[0]] : keys.map(key => SECRETS[key])
          );
        }
      );
    } else {
      return resolve(
        isSingle ? SECRETS[keys[0]] : keys.map(key => SECRETS[key])
      );
    }
  });
}

export const getSecret = fetchSecrets.bind(null, false);
export const getSecrets = fetchSecrets.bind(null, false);
export const getSecureSecret = fetchSecrets.bind(null, true);
export const getSecureSecrets = fetchSecrets.bind(null, true);
