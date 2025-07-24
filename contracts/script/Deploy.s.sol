// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import {TetrisGame} from "../src/TetrisGame.sol";

contract DeployScript is Script {
    address public proxy;
    address public implementation;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying TetrisGame with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the upgradeable proxy
        proxy = Upgrades.deployUUPSProxy(
            "TetrisGame.sol",
            abi.encodeCall(TetrisGame.initialize, ())
        );
        
        vm.stopBroadcast();
        
        console.log("TetrisGame proxy deployed at:", proxy);
        console.log("Implementation deployed at:", Upgrades.getImplementationAddress(proxy));
        
        // Verify the deployment
        TetrisGame tetrisGame = TetrisGame(proxy);
        console.log("Current round:", tetrisGame.getCurrentRound());
        console.log("Entry fee:", tetrisGame.ENTRY_FEE());
        console.log("Owner:", tetrisGame.owner());
    }
}