const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateVerification contract...");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "POL");

  const feeData = await hre.ethers.provider.getFeeData();

  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy({
    gasLimit: 1500000,
    gasPrice: feeData.gasPrice,
  });

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CertificateVerification deployed to:", address);
  console.log("\nSave this address + the ABI (in artifacts/contracts/CertificateVerification.sol/CertificateVerification.json) — the backend needs both.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});