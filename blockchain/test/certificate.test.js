const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateVerification", function () {
  let contract, admin, other;

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();
    const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
    contract = await CertificateVerification.deploy();
    await contract.waitForDeployment();
  });

  it("should set deployer as admin", async function () {
    expect(await contract.admin()).to.equal(admin.address);
  });

  it("should issue a certificate", async function () {
    await contract.issueCertificate("CERT001", "Yuvraj", "CSE", "hash123");
    const cert = await contract.getCertificate("CERT001");
    expect(cert.studentName).to.equal("Yuvraj");
    expect(cert.exists).to.equal(true);
  });

  it("should verify a correct certificate hash", async function () {
    await contract.issueCertificate("CERT001", "Yuvraj", "CSE", "hash123");
    const result = await contract.verifyCertificate("CERT001", "hash123");
    expect(result.isValid).to.equal(true);
  });

  it("should fail verification for wrong hash", async function () {
    await contract.issueCertificate("CERT001", "Yuvraj", "CSE", "hash123");
    const result = await contract.verifyCertificate("CERT001", "wronghash");
    expect(result.isValid).to.equal(false);
  });

  it("should not allow non-admin to issue certificate", async function () {
    await expect(
      contract.connect(other).issueCertificate("CERT002", "Someone", "ECE", "hashxyz")
    ).to.be.revertedWith("Only admin can perform this action");
  });

  it("should not allow duplicate certificate IDs", async function () {
    await contract.issueCertificate("CERT001", "Yuvraj", "CSE", "hash123");
    await expect(
      contract.issueCertificate("CERT001", "Someone", "ECE", "hash999")
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("should revoke a certificate", async function () {
    await contract.issueCertificate("CERT001", "Yuvraj", "CSE", "hash123");
    await contract.revokeCertificate("CERT001");
    const cert = await contract.getCertificate("CERT001");
    expect(cert.exists).to.equal(false);
  });
});
