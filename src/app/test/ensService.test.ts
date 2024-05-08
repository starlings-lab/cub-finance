import { isValidEnsAddress, EOAFromENS } from "../service/ensService";

describe("isValidEnsAddress function", () => {
  it("should return true for a valid ENS name", async () => {
    const validEnsName = "vitalik.eth";
    const isValid = await isValidEnsAddress(validEnsName);
    expect(isValid).toBe(true);
  });

  it("should return false for an invalid ENS name", async () => {
    const invalidEnsName = "hahahahahaha.dad";
    const isValid = await isValidEnsAddress(invalidEnsName);
    expect(isValid).toBe(false);
  });
});

describe("EOAFromENS function", () => {
  it("should resolve to the correct EOA address for a valid ENS name", async () => {
    const ensName = "vitalik.eth";
    const expectedEOA = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // Example EOA address for the ENS name
    const result = await EOAFromENS(ensName);
    expect(result).toEqual(expectedEOA);
  });

  it("should resolve to null for an invalid ENS name", async () => {
    const invalidEnsName = "hahahahahaha.dad";
    const result = await EOAFromENS(invalidEnsName);
    expect(result).toBeNull();
  });
});
