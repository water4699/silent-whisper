import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedSalaryCompare = await deploy("SalaryCompare", {
    from: deployer,
    log: true,
    gasLimit: 3000000,
    waitConfirmations: 1,
  });

  console.log(`SalaryCompare contract: `, deployedSalaryCompare.address);
};
export default func;
func.id = "deploy_salaryCompare"; // id required to prevent reexecution
func.tags = ["SalaryCompare"];
