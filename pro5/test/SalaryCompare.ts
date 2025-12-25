import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SalaryCompare, SalaryCompare__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SalaryCompare")) as SalaryCompare__factory;
  const salaryCompareContract = (await factory.deploy()) as SalaryCompare;
  const salaryCompareContractAddress = await salaryCompareContract.getAddress();

  return { salaryCompareContract, salaryCompareContractAddress };
}

describe("SalaryCompare", function () {
  let signers: Signers;
  let salaryCompareContract: SalaryCompare;
  let salaryCompareContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ salaryCompareContract, salaryCompareContractAddress } = await deployFixture());
  });

  it("should allow a user to submit an encrypted salary", async function () {
    const clearSalary = 50000; // $50,000
    
    const encryptedSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(clearSalary)
      .encrypt();

    const tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedSalary.handles[0], encryptedSalary.inputProof);
    await tx.wait();

    // Check that Alice has submitted a salary
    const hasSalary = await salaryCompareContract.hasSalary(signers.alice.address);
    expect(hasSalary).to.be.true;

    // Get and decrypt Alice's salary
    const encryptedSalaryHandle = await salaryCompareContract.connect(signers.alice).getMySalary();
    const decryptedSalary = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSalaryHandle,
      salaryCompareContractAddress,
      signers.alice,
    );

    expect(decryptedSalary).to.eq(clearSalary);
  });

  it("should allow two users to compare salaries", async function () {
    const aliceSalary = 60000; // $60,000
    const bobSalary = 50000;   // $50,000

    // Alice submits her salary
    const encryptedAliceSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(aliceSalary)
      .encrypt();

    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedAliceSalary.handles[0], encryptedAliceSalary.inputProof);
    await tx.wait();

    // Bob submits his salary
    const encryptedBobSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.bob.address)
      .add32(bobSalary)
      .encrypt();

    tx = await salaryCompareContract
      .connect(signers.bob)
      .submitSalary(encryptedBobSalary.handles[0], encryptedBobSalary.inputProof);
    await tx.wait();

    // Alice compares her salary with Bob's
    tx = await salaryCompareContract
      .connect(signers.alice)
      .compareSalaries(signers.bob.address);
    await tx.wait();

    // Check that the comparison was performed
    const hasComparison = await salaryCompareContract.hasComparison(
      signers.alice.address,
      signers.bob.address
    );
    expect(hasComparison).to.be.true;

    // Get and decrypt the comparison result
    const encryptedResult = await salaryCompareContract
      .connect(signers.alice)
      .getComparisonResult(signers.alice.address, signers.bob.address);
    
    const decryptedResult = await fhevm.userDecryptEbool(
      FhevmType.ebool,
      encryptedResult,
      salaryCompareContractAddress,
      signers.alice,
    );

    // Alice's salary (60000) > Bob's salary (50000) should be true
    expect(decryptedResult).to.be.true;
  });

  it("should show correct comparison when Bob earns more", async function () {
    const aliceSalary = 45000; // $45,000
    const bobSalary = 55000;   // $55,000

    // Alice submits her salary
    const encryptedAliceSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(aliceSalary)
      .encrypt();

    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedAliceSalary.handles[0], encryptedAliceSalary.inputProof);
    await tx.wait();

    // Bob submits his salary
    const encryptedBobSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.bob.address)
      .add32(bobSalary)
      .encrypt();

    tx = await salaryCompareContract
      .connect(signers.bob)
      .submitSalary(encryptedBobSalary.handles[0], encryptedBobSalary.inputProof);
    await tx.wait();

    // Alice compares her salary with Bob's
    tx = await salaryCompareContract
      .connect(signers.alice)
      .compareSalaries(signers.bob.address);
    await tx.wait();

    // Get and decrypt the comparison result
    const encryptedResult = await salaryCompareContract
      .connect(signers.alice)
      .getComparisonResult(signers.alice.address, signers.bob.address);
    
    const decryptedResult = await fhevm.userDecryptEbool(
      FhevmType.ebool,
      encryptedResult,
      salaryCompareContractAddress,
      signers.alice,
    );

    // Alice's salary (45000) > Bob's salary (55000) should be false
    expect(decryptedResult).to.be.false;
  });

  it("should allow users to update their salary", async function () {
    const initialSalary = 50000;
    const updatedSalary = 60000;

    // Alice submits initial salary
    const encryptedInitialSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(initialSalary)
      .encrypt();

    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedInitialSalary.handles[0], encryptedInitialSalary.inputProof);
    await tx.wait();

    // Alice updates her salary
    const encryptedUpdatedSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(updatedSalary)
      .encrypt();

    tx = await salaryCompareContract
      .connect(signers.alice)
      .updateSalary(encryptedUpdatedSalary.handles[0], encryptedUpdatedSalary.inputProof);
    await tx.wait();

    // Get and decrypt Alice's updated salary
    const encryptedSalaryHandle = await salaryCompareContract.connect(signers.alice).getMySalary();
    const decryptedSalary = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedSalaryHandle,
      salaryCompareContractAddress,
      signers.alice,
    );

    expect(decryptedSalary).to.eq(updatedSalary);
  });

  it("should not allow comparing without submitting salary", async function () {
    const bobSalary = 50000;

    // Bob submits his salary
    const encryptedBobSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.bob.address)
      .add32(bobSalary)
      .encrypt();

    const tx = await salaryCompareContract
      .connect(signers.bob)
      .submitSalary(encryptedBobSalary.handles[0], encryptedBobSalary.inputProof);
    await tx.wait();

    // Alice tries to compare without submitting her salary
    await expect(
      salaryCompareContract.connect(signers.alice).compareSalaries(signers.bob.address)
    ).to.be.revertedWith("You have not submitted a salary yet");
  });

  it("should not allow viewing comparison result by unauthorized user", async function () {
    const aliceSalary = 60000;
    const bobSalary = 50000;

    // Alice and Bob submit salaries
    const encryptedAliceSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(aliceSalary)
      .encrypt();

    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedAliceSalary.handles[0], encryptedAliceSalary.inputProof);
    await tx.wait();

    const encryptedBobSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.bob.address)
      .add32(bobSalary)
      .encrypt();

    tx = await salaryCompareContract
      .connect(signers.bob)
      .submitSalary(encryptedBobSalary.handles[0], encryptedBobSalary.inputProof);
    await tx.wait();

    // Alice compares with Bob
    tx = await salaryCompareContract
      .connect(signers.alice)
      .compareSalaries(signers.bob.address);
    await tx.wait();

    // Deployer (not part of comparison) tries to view result
    await expect(
      salaryCompareContract
        .connect(signers.deployer)
        .getComparisonResult(signers.alice.address, signers.bob.address)
    ).to.be.revertedWith("You can only view comparisons you are part of");
  });

  it("should allow batch salary comparison with multiple users", async function () {
    // Alice submits salary ($50,000)
    const aliceSalary = 50000;
    const encryptedAliceSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(aliceSalary)
      .encrypt();

    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedAliceSalary.handles[0], encryptedAliceSalary.inputProof);
    await tx.wait();

    // Bob submits salary ($60,000)
    const bobSalary = 60000;
    const encryptedBobSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.bob.address)
      .add32(bobSalary)
      .encrypt();

    tx = await salaryCompareContract
      .connect(signers.bob)
      .submitSalary(encryptedBobSalary.handles[0], encryptedBobSalary.inputProof);
    await tx.wait();

    // Deployer submits salary ($40,000)
    const deployerSalary = 40000;
    const encryptedDeployerSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.deployer.address)
      .add32(deployerSalary)
      .encrypt();

    tx = await salaryCompareContract
      .connect(signers.deployer)
      .submitSalary(encryptedDeployerSalary.handles[0], encryptedDeployerSalary.inputProof);
    await tx.wait();

    // Alice performs batch comparison with Bob and Deployer
    tx = await salaryCompareContract
      .connect(signers.alice)
      .batchCompareSalaries([signers.bob.address, signers.deployer.address]);
    await tx.wait();

    // Verify Alice earns more than Deployer (50k > 40k)
    const aliceVsDeployerResult = await fhevm.decryptBool(
      await salaryCompareContract
        .connect(signers.alice)
        .getComparisonResult(signers.alice.address, signers.deployer.address)
    );
    expect(aliceVsDeployerResult).to.equal(true);

    // Verify Alice earns less than Bob (50k < 60k)
    const aliceVsBobResult = await fhevm.decryptBool(
      await salaryCompareContract
        .connect(signers.alice)
        .getComparisonResult(signers.alice.address, signers.bob.address)
    );
    expect(aliceVsBobResult).to.equal(false);
  });

  it("should emit SalaryUpdated event when updating salary", async function () {
    // First submit salary
    const initialSalary = 50000;
    const encryptedInitialSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(initialSalary)
      .encrypt();

    let tx = await salaryCompareContract
      .connect(signers.alice)
      .submitSalary(encryptedInitialSalary.handles[0], encryptedInitialSalary.inputProof);
    await tx.wait();

    // Now update salary
    const updatedSalary = 60000;
    const encryptedUpdatedSalary = await fhevm
      .createEncryptedInput(salaryCompareContractAddress, signers.alice.address)
      .add32(updatedSalary)
      .encrypt();

    // Update should emit SalaryUpdated event
    await expect(
      salaryCompareContract
        .connect(signers.alice)
        .updateSalary(encryptedUpdatedSalary.handles[0], encryptedUpdatedSalary.inputProof)
    )
      .to.emit(salaryCompareContract, "SalaryUpdated")
      .withArgs(signers.alice.address);
  });
});

