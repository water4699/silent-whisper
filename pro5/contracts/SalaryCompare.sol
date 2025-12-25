// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Salary Comparison Contract
/// @author Encrypted Salary Compare MVP
/// @notice Allows users to submit encrypted salaries and compare them privately without revealing actual values
contract SalaryCompare is SepoliaConfig {
    // Mapping from user address to their encrypted salary
    mapping(address => euint32) private salaries;
    
    // Mapping to track if a user has submitted their salary
    mapping(address => bool) public hasSalary;
    
    // Mapping from (user1, user2) to their comparison result
    mapping(address => mapping(address => ebool)) private comparisonResults;
    
    // Mapping to track if a comparison has been performed
    mapping(address => mapping(address => bool)) private comparisonPerformed;
    
    // Events
    event SalarySubmitted(address indexed user);
    event SalaryCompared(address indexed user1, address indexed user2);
    event SalaryUpdated(address indexed user);
    
    /// @notice Submit an encrypted salary
    /// @param inputEuint32 the encrypted salary value
    /// @param inputProof the input proof
    function submitSalary(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedSalary = FHE.fromExternal(inputEuint32, inputProof);
        
        salaries[msg.sender] = encryptedSalary;
        hasSalary[msg.sender] = true;
        
        // Allow the contract and the user to access this encrypted value
        FHE.allowThis(encryptedSalary);
        FHE.allow(encryptedSalary, msg.sender);
        
        emit SalarySubmitted(msg.sender);
    }
    
    /// @notice Get your own encrypted salary
    /// @return The encrypted salary of the caller
    function getMySalary() external view returns (euint32) {
        require(hasSalary[msg.sender], "You have not submitted a salary yet");
        return salaries[msg.sender];
    }
    
    /// @notice Compare your salary with another user's salary
    /// @param otherUser The address of the user to compare with
    /// @dev Stores an encrypted boolean: true if msg.sender's salary > otherUser's salary
    function compareSalaries(address otherUser) external {
        require(hasSalary[msg.sender], "You have not submitted a salary yet");
        require(hasSalary[otherUser], "The other user has not submitted a salary yet");
        require(msg.sender != otherUser, "Cannot compare with yourself");
        
        // Compare: is msg.sender's salary greater than otherUser's salary?
        ebool isGreater = FHE.gt(salaries[msg.sender], salaries[otherUser]);
        
        // Store the result
        comparisonResults[msg.sender][otherUser] = isGreater;
        comparisonPerformed[msg.sender][otherUser] = true;
        
        // Allow both users and the contract to access the result
        FHE.allowThis(isGreater);
        FHE.allow(isGreater, msg.sender);
        FHE.allow(isGreater, otherUser);
        
        emit SalaryCompared(msg.sender, otherUser);
    }
    
    /// @notice Get the encrypted comparison result
    /// @param user1 The first user in the comparison
    /// @param user2 The second user in the comparison
    /// @return An encrypted boolean: true if user1's salary > user2's salary
    /// @dev Only user1 and user2 can call this function
    function getComparisonResult(address user1, address user2) external view returns (ebool) {
        require(
            msg.sender == user1 || msg.sender == user2,
            "You can only view comparisons you are part of"
        );
        require(
            comparisonPerformed[user1][user2],
            "Comparison has not been performed yet"
        );
        
        return comparisonResults[user1][user2];
    }
    
    /// @notice Check if a comparison has been performed
    /// @param user1 The first user in the comparison
    /// @param user2 The second user in the comparison
    /// @return True if the comparison has been performed
    function hasComparison(address user1, address user2) external view returns (bool) {
        return comparisonPerformed[user1][user2];
    }
    
    /// @notice Update your encrypted salary
    /// @param inputEuint32 the new encrypted salary value
    /// @param inputProof the input proof
    function updateSalary(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedSalary = FHE.fromExternal(inputEuint32, inputProof);

        salaries[msg.sender] = encryptedSalary;
        hasSalary[msg.sender] = true;

        FHE.allowThis(encryptedSalary);
        FHE.allow(encryptedSalary, msg.sender);

        emit SalaryUpdated(msg.sender);
    }

    /// @notice Batch compare salaries with multiple users
    /// @param otherUsers Array of user addresses to compare with
    /// @dev Performs comparison with each user in the array
    function batchCompareSalaries(address[] calldata otherUsers) external {
        require(hasSalary[msg.sender], "You have not submitted a salary yet");

        for (uint256 i = 0; i < otherUsers.length; i++) {
            address otherUser = otherUsers[i];
            require(hasSalary[otherUser], "One of the other users has not submitted a salary yet");
            require(msg.sender != otherUser, "Cannot compare with yourself");

            // Skip if comparison already performed
            if (comparisonPerformed[msg.sender][otherUser]) {
                continue;
            }

            // Compare: is msg.sender's salary greater than otherUser's salary?
            ebool isGreater = FHE.gt(salaries[msg.sender], salaries[otherUser]);

            // Store the result
            comparisonResults[msg.sender][otherUser] = isGreater;
            comparisonPerformed[msg.sender][otherUser] = true;

            // Allow both users and the contract to access the result
            FHE.allowThis(isGreater);
            FHE.allow(isGreater, msg.sender);
            FHE.allow(isGreater, otherUser);

            emit SalaryCompared(msg.sender, otherUser);
        }
    }
}

