import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
	region: "local",
});
export { client };
