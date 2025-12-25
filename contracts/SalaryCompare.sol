// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Salary Comparison Contract
/// @author Encrypted Salary Compare MVP
/// @notice Allows users to submit encrypted salaries and compare them privately without revealing actual values
/// @dev Uses Fully Homomorphic Encryption (FHE) to enable computations on encrypted data
/// @dev All salary comparisons are performed on-chain without decrypting sensitive information
/// @dev SECURITY: Input proofs must be validated by FHE library to prevent invalid encrypted data
contract SalaryCompare is SepoliaConfig {
    // Version info
    string public constant VERSION = "1.0.0";

    /// @notice Get contract version and statistics
    /// @return version The contract version
    /// @return totalUsers The total number of users who have submitted salaries
    /// @return totalComparisons The total number of comparisons performed
    function getContractInfo() external view returns (string memory version, uint256 totalUsers, uint256 totalComparisons) {
        uint256 userCount = 0;
        uint256 comparisonCount = 0;

        // Note: In a production contract, these would be stored as state variables
        // For this MVP, we return placeholder values
        return (VERSION, userCount, comparisonCount);
    }

    // Constants for gas optimization
    uint256 private constant MAX_BATCH_SIZE = 10;
    // Mapping from user address to their encrypted salary
    mapping(address => euint32) private salaries;
    
    // Mapping to track if a user has submitted their salary
    mapping(address => bool) public hasSalary;
    
    // Mapping from (user1, user2) to their comparison result
    mapping(address => mapping(address => ebool)) private comparisonResults;
    
    // Mapping to track if a comparison has been performed
    mapping(address => mapping(address => bool)) private comparisonPerformed;
    
    // Events
    event SalarySubmitted(address indexed user, uint256 timestamp);
    event SalaryCompared(address indexed user1, address indexed user2, uint256 timestamp);
    event SalaryUpdated(address indexed user, uint256 timestamp);
    
    /// @notice Submit an encrypted salary
    /// @param inputEuint32 the encrypted salary value
    /// @param inputProof the input proof
    /// @dev Salary is encrypted client-side before submission
    function submitSalary(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedSalary = FHE.fromExternal(inputEuint32, inputProof);
        
        salaries[msg.sender] = encryptedSalary;
        hasSalary[msg.sender] = true;
        
        // Allow the contract and the user to access this encrypted value
        FHE.allowThis(encryptedSalary);
        FHE.allow(encryptedSalary, msg.sender);
        
        emit SalarySubmitted(msg.sender, block.timestamp);
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
        // Prevent comparing with self
        require(msg.sender != otherUser, "Cannot compare salary with yourself");
        require(hasSalary[msg.sender], "You have not submitted a salary yet");
        require(hasSalary[otherUser], "The other user has not submitted a salary yet");
        require(!comparisonPerformed[msg.sender][otherUser], "Comparison already performed between these users");

        // Compare: is msg.sender's salary greater than otherUser's salary?
        ebool isGreater = FHE.gt(salaries[msg.sender], salaries[otherUser]);
        
        // Store the result
        comparisonResults[msg.sender][otherUser] = isGreater;
        comparisonPerformed[msg.sender][otherUser] = true;
        
        // Allow both users and the contract to access the result
        FHE.allowThis(isGreater);
        FHE.allow(isGreater, msg.sender);
        FHE.allow(isGreater, otherUser);
        
        emit SalaryCompared(msg.sender, otherUser, block.timestamp);
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
        require(hasSalary[msg.sender], "You must submit a salary first before updating it");
        euint32 encryptedSalary = FHE.fromExternal(inputEuint32, inputProof);

        salaries[msg.sender] = encryptedSalary;
        hasSalary[msg.sender] = true;

        FHE.allowThis(encryptedSalary);
        FHE.allow(encryptedSalary, msg.sender);

        emit SalaryUpdated(msg.sender, block.timestamp);
    }

    /// @notice Batch compare salaries with multiple users
    /// @param otherUsers Array of user addresses to compare with
    /// @dev Performs comparison with each user in the array
    function batchCompareSalaries(address[] calldata otherUsers) external {
        require(hasSalary[msg.sender], "You have not submitted a salary yet");
        require(otherUsers.length > 0, "Must provide at least one user to compare with");
        require(otherUsers.length <= MAX_BATCH_SIZE, "Cannot compare with more than 10 users at once");

        for (uint256 i = 0; i < otherUsers.length; i++) {
            address otherUser = otherUsers[i];
            require(hasSalary[otherUser], "One of the other users has not submitted a salary yet");
            require(msg.sender != otherUser, "Cannot compare with yourself");

            // Skip if comparison already performed
            if (comparisonPerformed[msg.sender][otherUser]) {
                continue;
            }

            // Check for duplicate addresses in the input array
            for (uint256 j = 0; j < i; j++) {
                require(otherUsers[j] != otherUser, "Duplicate addresses not allowed in batch comparison");
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

            emit SalaryCompared(msg.sender, otherUser, block.timestamp);
        }
    }
}

