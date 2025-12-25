import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { SalaryCompare } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("SalaryCompareSepolia", function () {
  let signers: Signers;
  let salaryCompareContract: SalaryCompare;
  let salaryCompareContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const SalaryCompareDeployment = await deployments.get("SalaryCompare");
      salaryCompareContractAddress = SalaryCompareDeployment.address;
      salaryCompareContract = await ethers.getContractAt("SalaryCompare", SalaryCompareDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0], bob: ethSigners[1] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should allow salary submission and comparison", async function () {
    steps = 12;

    this.timeout(5 * 60000); // 5 minutes timeout

    const aliceSalary = 65000; // $65,000
    const bobSalary = 58000;   // $58,000

    // Alice submits her salary
    progress(`Encrypting Alice's salary (${aliceSalary})...`);
    const encryptedAliceSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(aliceSalary)
      .encrypt();

    progress(
      `Call submitSalary() for Alice - SalaryCompare=${salaryCompareContractAddress} handle=${ethers.hexlify(encryptedAliceSalary.handles[0])} signer=${signers.alice.address}...`,
    );
    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedAliceSalary.handles[0], encryptedAliceSalary.inputProof);
    await tx.wait();

    progress(`Verify Alice has submitted salary...`);
    const aliceHasSalary = await salaryCompareContract.hasSalary(signers.alice.address);
    expect(aliceHasSalary).to.be.true;
    progress(`Alice has submitted salary: ${aliceHasSalary}`);

    // Bob submits his salary
    progress(`Encrypting Bob's salary (${bobSalary})...`);
    const encryptedBobSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.bob.address)
      .add32(bobSalary)
      .encrypt();

    progress(
      `Call submitSalary() for Bob - SalaryCompare=${salaryCompareContractAddress} handle=${ethers.hexlify(encryptedBobSalary.handles[0])} signer=${signers.bob.address}...`,
    );
    tx = await salaryCompareContract
      .connect(signers.bob)
      .submitSalary(encryptedBobSalary.handles[0], encryptedBobSalary.inputProof);
    await tx.wait();

    progress(`Verify Bob has submitted salary...`);
    const bobHasSalary = await salaryCompareContract.hasSalary(signers.bob.address);
    expect(bobHasSalary).to.be.true;
    progress(`Bob has submitted salary: ${bobHasSalary}`);

    // Alice compares her salary with Bob's
    progress(`Call compareSalaries() - Alice comparing with Bob...`);
    tx = await salaryCompareContract
      .connect(signers.alice)
      .compareSalaries(signers.bob.address);
    await tx.wait();

    progress(`Verify comparison was performed...`);
    const hasComparison = await salaryCompareContract.hasComparison(
      signers.alice.address,
      signers.bob.address
    );
    expect(hasComparison).to.be.true;
    progress(`Comparison exists: ${hasComparison}`);

    // Get the comparison result
    progress(`Call getComparisonResult()...`);
    const encryptedResult = await salaryCompareContract
      .connect(signers.alice)
      .getComparisonResult(signers.alice.address, signers.bob.address);

    progress(`Decrypting comparison result...`);
    const decryptedResult = await fhevm.userDecryptEbool(
      FhevmType.ebool,
      encryptedResult,
      salaryCompareContractAddress,
      signers.alice,
    );
    progress(`Comparison result (Alice > Bob): ${decryptedResult}`);

    // Alice's salary (65000) > Bob's salary (58000) should be true
    expect(decryptedResult).to.be.true;
  });

  it("should allow updating salary", async function () {
    steps = 8;

    this.timeout(5 * 60000); // 5 minutes timeout

    const initialSalary = 50000;
    const updatedSalary = 70000;

    progress(`Encrypting Alice's initial salary (${initialSalary})...`);
    const encryptedInitialSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(initialSalary)
      .encrypt();

    progress(`Call submitSalary() for Alice...`);
    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedInitialSalary.handles[0], encryptedInitialSalary.inputProof);
    await tx.wait();

    progress(`Encrypting Alice's updated salary (${updatedSalary})...`);
    const encryptedUpdatedSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(updatedSalary)
      .encrypt();

    progress(`Call updateSalary() for Alice...`);
    tx = await salaryCompareContract
      .connect(signers.alice)
      .updateSalary(encryptedUpdatedSalary.handles[0], encryptedUpdatedSalary.inputProof);
    await tx.wait();

    progress(`Call getMySalary()...`);
    const encryptedSalaryHandle = await salaryCompareContract.connect(signers.alice).getMySalary();

    progress(`Decrypting Alice's salary...`);
    const decryptedSalary = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSalaryHandle,
      salaryCompareContractAddress,
      signers.alice,
    );
    progress(`Alice's updated salary: ${decryptedSalary}`);

    expect(decryptedSalary).to.eq(updatedSalary);
  });
});

