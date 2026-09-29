const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateVerification contract...");

  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CertificateVerification deployed to:", address);
  console.log("\nSave this address + the ABI (in artifacts/contracts/CertificateVerification.sol/CertificateVerification.json) — the backend needs both.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
