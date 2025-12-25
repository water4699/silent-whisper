import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:submitSalary")
  .addParam("salary", "The salary amount to submit (in dollars)")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { salary } = taskArguments;
    const SalaryCompare = await ethers.getContractFactory("SalaryCompare");
    const salaryCompare = await SalaryCompare.deploy();
    await salaryCompare.waitForDeployment();
    const salaryCompareAddress = await salaryCompare.getAddress();
    
    const [signer] = await ethers.getSigners();
    
    console.log(`Submitting salary ${salary} for address ${signer.address}...`);
    
    const encryptedSalary = await fhevm
      .createEncryptedInput(salaryCompareAddress, signer.address)
      .add32(parseInt(salary))
      .encrypt();
    
    const tx = await salaryCompare.submitSalary(
      encryptedSalary.handles[0],
      encryptedSalary.inputProof
    );
    
    await tx.wait();
    console.log(`Salary submitted successfully! Transaction: ${tx.hash}`);
  });

task("task:compareSalaries")
  .addParam("other", "The address to compare with")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { other } = taskArguments;
    const SalaryCompare = await ethers.getContractFactory("SalaryCompare");
    const salaryCompare = await SalaryCompare.deploy();
    await salaryCompare.waitForDeployment();
    
    const [signer] = await ethers.getSigners();
    
    console.log(`Comparing salary of ${signer.address} with ${other}...`);
    
    const tx = await salaryCompare.compareSalaries(other);
    await tx.wait();
    
    console.log(`Comparison completed! Transaction: ${tx.hash}`);
  });

task("task:getComparisonResult")
  .addParam("user1", "First user address")
  .addParam("user2", "Second user address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm }) {
    const { user1, user2 } = taskArguments;
    const SalaryCompare = await ethers.getContractFactory("SalaryCompare");
    const salaryCompare = await SalaryCompare.deploy();
    await salaryCompare.waitForDeployment();
    const salaryCompareAddress = await salaryCompare.getAddress();
    
    const [signer] = await ethers.getSigners();
    
    console.log(`Getting comparison result between ${user1} and ${user2}...`);
    
    const encryptedResult = await salaryCompare.getComparisonResult(user1, user2);
    
    console.log(`Encrypted result: ${encryptedResult}`);
    console.log(`Decrypting result...`);
    
    // Decrypt the result
    const decryptedResult = await fhevm.userDecryptEbool(
      0, // FhevmType.ebool
      encryptedResult,
      salaryCompareAddress,
      signer
    );
    
    console.log(`Result (${user1} > ${user2}): ${decryptedResult}`);
  });

task("task:batchCompareSalaries")
  .addVariadicPositionalParam("others", "List of addresses to compare with")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const { others } = taskArguments;
    const SalaryCompare = await ethers.getContractFactory("SalaryCompare");
    const salaryCompare = await SalaryCompare.deploy();
    await salaryCompare.waitForDeployment();

    const [signer] = await ethers.getSigners();

    console.log(`Batch comparing salary of ${signer.address} with ${others.length} users...`);

    const tx = await salaryCompare.batchCompareSalaries(others);
    await tx.wait();

    console.log(`Batch comparison completed! Transaction: ${tx.hash}`);
  });

