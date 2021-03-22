import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
	region: "us-east-1",
});
export { client };
