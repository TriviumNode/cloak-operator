import { cleanEnv, port, str, num } from 'envalid';

const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    PORT: port(),
    SECRET_REST_URL: str(),
    CHAIN_ID: str(),
    MNEMONIC: str(),
    CLOAK_ADDR: str(),
    GAS_LIMIT: num(),
    GAS_PRICE: num(),
    EXEC_WAIT: num()
  });
};

export default validateEnv;
