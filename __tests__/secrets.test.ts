import { AWSLambdaSecretsCacheClient } from "../src/index";

const getSecretValue = jest.fn();

jest.mock("aws-sdk", function () {
  return {
    SecretsManager: function () {
      return {
        getSecretValue: function () {
          return {
            promise: getSecretValue,
          };
        },
      };
    },
  };
});

describe("AWS Lambda Secrets Cache", () => {
  let spy;
  beforeEach(() => {
    spy = jest.spyOn(console, "log").mockImplementation();
  });
  afterEach(() => {
    spy.mockRestore();
    getSecretValue.mockReset();
  });
  it("It resolves a secret from the cache, calling getSecretValue once for the same SecretId", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue.mockResolvedValue({
      SecretString: "bar",
    });
    await expect(secret("foo")).resolves.toBe("bar");
    await expect(secret("foo")).resolves.toBe("bar");
    expect(getSecretValue.mock.calls.length).toBe(1);
  });
  it("It resolves an object if the SecretId is a key-value pair, calling getSecretValue once for the same SecretId", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue.mockResolvedValue({
      SecretString: JSON.stringify({
        foo: "bar",
        boo: "baz",
      }),
    });
    await expect(secret("foo")).resolves.toEqual({
      foo: "bar",
      boo: "baz",
    });
    await expect(secret("foo")).resolves.toEqual({
      foo: "bar",
      boo: "baz",
    });
    expect(getSecretValue.mock.calls.length).toBe(1);
  });
  it("It resolves an object with key[value] equal to SecretId, calling getSecretValue once for the same SecretId", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue
      .mockResolvedValueOnce({
        SecretString: "bar",
      })
      .mockResolvedValueOnce({
        SecretString: "maz",
      });
    await expect(
      secret({
        foo: "foo",
        moo: "moo",
      })
    ).resolves.toEqual({
      foo: "bar",
      moo: "maz",
    });
    await expect(secret("foo")).resolves.toBe("bar");
    await expect(secret("moo")).resolves.toBe("maz");
    expect(getSecretValue.mock.calls.length).toBe(2);
  });
  it("It resolves an array of secrets from the cache, calling getSecretValue once for the same SecretId", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue
      .mockResolvedValueOnce({
        SecretString: "bar",
      })
      .mockResolvedValueOnce({
        SecretString: "baz",
      })
      .mockResolvedValueOnce({
        SecretString: "maz",
      });
    await expect(
      secret([
        "foo",
        "boo",
        {
          foo: "foo",
          moo: "moo",
        },
      ])
    ).resolves.toEqual([
      "bar",
      "baz",
      {
        foo: "bar",
        moo: "maz",
      },
    ]);
    await expect(secret("foo")).resolves.toBe("bar");
    await expect(secret("boo")).resolves.toBe("baz");
    await expect(
      secret({
        foo: "foo",
        moo: "moo",
      })
    ).resolves.toEqual({
      foo: "bar",
      moo: "maz",
    });
    expect(getSecretValue.mock.calls.length).toBe(3);
  });
  it("It transforms the resolved key-value object if a single transform is passed", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue.mockResolvedValueOnce({
      SecretString: JSON.stringify({
        today: "1604449800000",
        tomorrow: "1604536200000",
      }),
    });
    await expect(
      secret("datestring", (value) => {
        if (typeof value === "object") {
          return Object.entries(value).reduce((acc, [key, value]) => {
            const time = parseInt(value);
            const date = new Date(time);
            acc[key] = date.toUTCString();
            return acc;
          }, {});
        }
        return value;
      })
    ).resolves.toEqual({
      today: "Wed, 04 Nov 2020 00:30:00 GMT",
      tomorrow: "Thu, 05 Nov 2020 00:30:00 GMT",
    });
    expect(getSecretValue.mock.calls.length).toBe(1);
  });
  it("It transforms a secret or array of secrets if a single transform is passed", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue
      .mockResolvedValueOnce({
        SecretString: "123 321",
      })
      .mockResolvedValueOnce({
        SecretString: "456 654",
      });
    await expect(
      secret(["foo", "bar"], (value) => {
        if (typeof value === "string") {
          return value.split(" ").map((num) => parseInt(num));
        }
        return value;
      })
    ).resolves.toEqual([
      [123, 321],
      [456, 654],
    ]);
    expect(getSecretValue.mock.calls.length).toBe(2);
  });
  it("It applies an array of transforms to resolved values by index", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient();
    getSecretValue
      .mockResolvedValueOnce({
        SecretString: "123",
      })
      .mockResolvedValueOnce({
        SecretString: "Hello, world!",
      })
      .mockResolvedValueOnce({
        SecretString: "no transform",
      });
    await expect(
      secret(
        ["foo", "bar", "baz"],
        [
          (value) => {
            if (typeof value === "string") {
              return parseInt(value);
            }
            return value;
          },
          (value) => {
            if (typeof value === "string") {
              return Buffer.from(value);
            }
            return value;
          },
        ]
      )
    ).resolves.toEqual([123, Buffer.from("Hello, world!"), "no transform"]);
    expect(getSecretValue.mock.calls.length).toBe(3);
  });

  it("It debugs with a custom logger function", async () => {
    const { secret } = new AWSLambdaSecretsCacheClient({
      debug: true,
    });
    getSecretValue
      .mockResolvedValueOnce({
        SecretString: JSON.stringify({
          foo: "bar",
          boo: "baz",
        }),
      })
      .mockResolvedValueOnce({
        SecretString: "maz",
      });
    await expect(secret(["foo", "mar"])).resolves.toEqual([
      {
        foo: "bar",
        boo: "baz",
      },
      "maz",
    ]);
    expect(getSecretValue.mock.calls.length).toBe(2);
    expect(spy.mock.calls.length).toBe(8);
  });
});
