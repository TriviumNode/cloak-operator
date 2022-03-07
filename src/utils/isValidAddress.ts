import { Bech32 } from "@iov/encoding";

function isValidAddress(address: string): Boolean {
    try {
      const { prefix, data } = Bech32.decode(address);
      if (prefix !== "secret") {
        return false;
      }
      return data.length === 20;
    } catch {
      return false;
    }
  }

  export default isValidAddress;