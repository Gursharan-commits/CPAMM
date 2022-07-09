const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI_WHALE = "0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2"
const USDC_WHALE = "0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2"
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"

describe("CPAMM", function () {
  let cpamm
  let usdc
  let dai
  let uni
  before(async () => {
    accounts = await ethers.getSigners()

    const CPAMM = await ethers.getContractFactory("CPAMM")
    cpamm = await CPAMM.deploy(DAI, USDC)
    await cpamm.deployed()

    dai = await ethers.getContractAt("IERC20", DAI)
    usdc = await ethers.getContractAt("IERC20", USDC)
    uni = await ethers.getContractAt("IERC20", UNI)

    // Unlock DAI and USDC whales
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [DAI_WHALE],
    })
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    })

    const daiWhale = await ethers.getSigner(DAI_WHALE)
    const usdcWhale = await ethers.getSigner(USDC_WHALE)

    // Send DAI and USDC to accounts[0]
    const daiAmount = 110n * 10n ** 18n
    const usdcAmount = 100n * 10n ** 6n
    const daiAmountIn = 1n * 10n ** 18n

    //check if whales has balances GTE (greater than Eaqual to) the transfer amount
    expect(await dai.balanceOf(daiWhale.address)).to.gte(daiAmount)
    expect(await usdc.balanceOf(usdcWhale.address)).to.gte(usdcAmount)

    await dai.connect(daiWhale).transfer(accounts[0].address, daiAmount)
    await usdc.connect(usdcWhale).transfer(accounts[0].address, usdcAmount)
  })



  // it("can add liquidity", async function () {

  //   const usdcAmount = 100n * 10n ** 6n
  //   const daiAmount = 100n * 10n ** 18n

  //   await dai.connect(accounts[0]).approve(cpamm.address, daiAmount)
  //   await usdc.connect(accounts[0]).approve(cpamm.address, usdcAmount)
  //   await cpamm.addLiquidity(daiAmount, usdcAmount)
  //   console.log("liquidity received")

  // });

  // it("Swaps", async function () {

  //   const usdcAmount = 100n * 10n ** 6n
  //   const daiAmount = 100n * 10n ** 18n
  //   const daiAmountIn = 1n * 10n ** 18n
  //   await dai.connect(accounts[0]).approve(cpamm.address, daiAmount)
  //   await usdc.connect(accounts[0]).approve(cpamm.address, usdcAmount)
  //   await cpamm.addLiquidity(daiAmount, usdcAmount)

  //   await dai.connect(accounts[0]).approve(cpamm.address, daiAmountIn)
  //   await cpamm.swap(DAI, daiAmountIn)
  // });
  it("can remove liquidity", async function () {

    const usdcAmount = 100n * 10n ** 6n
    const daiAmount = 100n * 10n ** 18n
    await dai.connect(accounts[0]).approve(cpamm.address, daiAmount)
    await usdc.connect(accounts[0]).approve(cpamm.address, usdcAmount)
    console.log("Dai Amount before liquidity is added", await dai.balanceOf(accounts[0].address))
    console.log("USDC Amount before liquidity is added", await usdc.balanceOf(accounts[0].address))
    await cpamm.addLiquidity(daiAmount, usdcAmount)
    console.log("Dai Amount After liquidity is added", await dai.balanceOf(accounts[0].address))
    console.log("USDC Amount after liquidity is added", await usdc.balanceOf(accounts[0].address))
    const shares = await cpamm.balanceOf(accounts[0].address)
    console.log("shares minted", shares)
    await cpamm.removeLiquidity(shares)
    console.log("Dai Amount After liquidity is removed", await dai.balanceOf(accounts[0].address))
    console.log("USDC Amount after liquidity is removed", await usdc.balanceOf(accounts[0].address))
  });
});
