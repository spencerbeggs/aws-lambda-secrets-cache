import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { inspect } from "util";
import { client } from "./client";

type SecretMap = Record<string, string>;
type Secret = string | SecretMap;
type Secrets = Secret | Secret[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SecretValues = any | any[];
type LogPayload = string | Array<string> | Record<symbol, unknown> | Error;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transform = (secret: Secret) => any;
interface AWSLambdaSecretsCacheClientOptions {
	ignoreErrors?: boolean;
	manager?: typeof client;
	debug?: boolean;
}

export class AWSLambdaSecretsCacheClient {
	protected AWS_LAMBDA_SECRETS_CACHE: Map<string, Promise<Secret>>;
	protected readonly name: string;
	protected readonly manager: typeof client;
	protected readonly ignoreErrors: boolean;
	protected readonly debug: boolean;
	/**
	 * Constructs a AWSLambdaSecretsCacheClient object
	 */
	constructor(options?: AWSLambdaSecretsCacheClientOptions) {
		this.AWS_LAMBDA_SECRETS_CACHE = new Map();
		const { name, manager, ignoreErrors, debug } = this.init(options);
		this.name = name;
		this.manager = manager;
		this.ignoreErrors = ignoreErrors;
		this.debug = debug;
	}

	private init(options: AWSLambdaSecretsCacheClientOptions | undefined) {
		return Object.assign(
			{},
			{
				name: "AWS Lambda Secrets Cache",
				ignoreErrors: true,
				manager: client,
				debug: false,
			},
			options ?? {}
		);
	}

	private log(value: LogPayload): void {
		const isString = (value: LogPayload): value is string => {
			return (typeof value as LogPayload) === "string";
		};
		let msg;
		if (isString(value)) {
			msg = value;
		} else {
			msg = inspect(value, false, 7, true);
		}
		if (this.debug) {
			console.log(msg);
		}
	}

	private info(msg: string, obj?: LogPayload): void {
		this.log(`[${this.name}] ${msg}`);
		if (obj) {
			this.log(obj);
		}
	}

	public secret = async (secrets: Secrets, transforms?: Transform | Transform[]): Promise<SecretValues> => {
		// eslint-disable-next-line
		function singleSecret(secrets): secrets is Secret {
			return !Array.isArray(secrets as Secret);
		}
		if (singleSecret(secrets)) {
			secrets = [secrets];
		}
		const values = await this.fetchAll(secrets, transforms);
		return values.length === 1 ? values[0] : values;
	};

	private async fetchAll(secrets: Secret[], transforms?: Transform | Transform[]) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const singleTransform = (transforms): transforms is Transform => {
			return !Array.isArray(transforms as Transform);
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const multiTransform = (transforms): transforms is Transform[] => {
			return Array.isArray(transforms as Transform[]);
		};
		return secrets.reduce(async (accp, secret, i) => {
			const acc = await accp;
			let transformer: Transform | undefined;
			if (transforms && singleTransform(transforms)) {
				transformer = transforms;
			} else if (transforms && multiTransform(transforms)) {
				transformer = transforms[i] ? transforms[i] : undefined;
			}
			const isString = (value: Secret): value is string => {
				return (typeof value as Secret) === "string";
			};
			const isObject = (value: Secret): value is SecretMap => {
				return (typeof value as Secret) === "object";
			};
			if (isString(secret)) {
				const secretValue = await this.fetch(secret, transformer ?? undefined);
				acc.push(secretValue);
			}
			if (isObject(secret)) {
				console.log(secret);
				const secretValue = await Object.entries(secret).reduce(async (accp, [key, SecretId]) => {
					const acc = await accp;
					acc[key] = await this.fetch(SecretId, transformer);
					return acc;
				}, Promise.resolve({}));
				acc.push(secretValue);
			}
			return Promise.resolve(acc);
		}, Promise.resolve([] as SecretValues));
	}

	private async fetch(SecretId: string, transformer?: Transform): Promise<Secret | undefined> {
		this.info(`requested SecretId "${SecretId}"`);
		if (this.AWS_LAMBDA_SECRETS_CACHE.has(SecretId)) {
			const value = await this.AWS_LAMBDA_SECRETS_CACHE.get(SecretId);
			this.info(`found SecretId "${SecretId}" in cache with value:`, value);
			return value;
		}
		this.info(`fetching new value from SecretId "${SecretId}"`);
		const { SecretString } = await client.send(
			new GetSecretValueCommand({
				SecretId,
			})
		);
		let secret;
		if (SecretString) {
			try {
				secret = JSON.parse(SecretString);
			} catch (err) {
				secret = SecretString;
			}
		}
		if (transformer) {
			secret = transformer(secret);
		}
		this.AWS_LAMBDA_SECRETS_CACHE.set(SecretId, secret);
		this.info(`set SecretId "${SecretId}" in cache with value:`, secret);
		return secret;
	}
}

const defaultClient = new AWSLambdaSecretsCacheClient();
export const secret = defaultClient.secret;
export default defaultClient;
