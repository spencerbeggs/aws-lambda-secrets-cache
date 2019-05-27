jest.mock("aws-sdk");

function createClient(mock) {
  return {
    getParameters: mock
  };
}

describe("AWS Secrets Cache", () => {
  let getSecrets;
  beforeEach(() => {
    ({ getSecrets } = require("../src"));
    jest.resetModules();
  });
  it("Rejects with an error if keys argument is not an string or an array of strings", async () => {
    await expect(getSecrets(undefined, null)).rejects.toThrowError(
      "You must pass a string of array of strings as the first argument"
    );
    await expect(getSecrets({}, null)).rejects.toThrowError(
      "You must pass a string of array of strings as the first argument"
    );
    await expect(getSecrets(null, null)).rejects.toThrowError(
      "You must pass a string of array of strings as the first argument"
    );
  });
  it("Rejects with an error on AWS error", async () => {
    await expect(
      getSecrets(
        "/foo",
        createClient(jest.fn((params, cb) => cb(new Error("AWS error"))))
      )
    ).rejects.toThrowError("AWS error");
  });
  it("It resolves a string when called with a string", async () => {
    await expect(
      getSecrets(
        "/foo",
        createClient(
          jest.fn((params, cb) =>
            cb(null, {
              Parameters: [{ Name: "/foo", Value: "foo" }]
            })
          )
        )
      )
    ).resolves.toEqual("foo");
  });
  it("It resolves a string from the cache when called multiple time with the same string", async () => {
    let callback = jest.fn((params, cb) =>
      cb(null, {
        Parameters: [{ Name: "/foo", Value: "foo" }]
      })
    );
    let mock = createClient(callback);
    await expect(getSecrets("/foo", mock)).resolves.toEqual("foo");
    await expect(getSecrets("/foo", mock)).resolves.toEqual("foo");
    await expect(callback.mock.calls.length).toBe(1);
  });
  it("It resolves an array of strings when called with an array", async () => {
    let callWithArray = getSecrets(
      ["/foo", "/bar"],
      createClient(
        jest.fn((params, cb) =>
          cb(null, {
            Parameters: [
              { Name: "/foo", Value: "foo" },
              { Name: "/bar", Value: "bar" }
            ]
          })
        )
      )
    );
    await expect(callWithArray).resolves.toEqual(["foo", "bar"]);
    await expect(callWithArray).resolves.toContain("foo");
    await expect(callWithArray).resolves.toContain("bar");
  });
  it("It resolves an array from the cache when called with the same values, even out of order", async () => {
    let callback = jest.fn((params, cb) =>
      cb(null, {
        Parameters: [
          { Name: "/foo", Value: "foo" },
          { Name: "/bar", Value: "bar" }
        ]
      })
    );
    let mock = createClient(callback);
    await expect(getSecrets(["/foo", "/bar"], mock)).resolves.toEqual([
      "foo",
      "bar"
    ]);
    await expect(getSecrets(["/bar", "/foo"], mock)).resolves.toEqual([
      "bar",
      "foo"
    ]);
    expect(callback.mock.calls.length).toBe(1);
  });
  it("resolves null if SSM has a request error", async () => {
    let callback = jest.fn((params, cb) => cb(null, null));
    let mock = createClient(callback);
    await expect(getSecrets("/foo", mock)).resolves.toBe(null);
  });
});
