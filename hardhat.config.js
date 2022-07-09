require("@nomiclabs/hardhat-waffle")

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/1d2bk3J2jGur10WJlqFsnQS148UAKywD",
      },
    },
  },
  // mocha: {
  //   timeout: 100000000,
  // },
}