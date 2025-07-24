// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract TetrisGame is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    uint256 public constant ENTRY_FEE = 0.01 ether;
    uint256 public currentRound;
    
    mapping(uint256 => mapping(address => bool)) public hasPlayerPaid;
    mapping(uint256 => address[]) public roundPlayers;
    mapping(uint256 => uint256) public roundStartTime;
    
    event PlayerEntered(address indexed player, uint256 indexed round, uint256 amount);
    event RoundStarted(uint256 indexed round);
    
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        currentRound = 1;
    }
    
    modifier onlyValidPayment() {
        require(msg.value == ENTRY_FEE, "Must pay exactly 0.01 ETH");
        _;
    }
    
    function enterGame() external payable onlyValidPayment nonReentrant {
        require(!hasPlayerPaid[currentRound][msg.sender], "Already paid for this round");
        
        hasPlayerPaid[currentRound][msg.sender] = true;
        roundPlayers[currentRound].push(msg.sender);
        
        emit PlayerEntered(msg.sender, currentRound, msg.value);
    }
    
    function hasPlayerPaidForRound(address player, uint256 round) external view returns (bool) {
        return hasPlayerPaid[round][player];
    }
    
    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }
    
    function getRoundPlayers(uint256 round) external view returns (address[] memory) {
        return roundPlayers[round];
    }
    
    function startNewRound() external onlyOwner {
        currentRound++;
        roundStartTime[currentRound] = block.timestamp;
        emit RoundStarted(currentRound);
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    uint256[50] private __gap;
}