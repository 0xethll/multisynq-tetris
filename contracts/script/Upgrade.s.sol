// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {Upgrades} from "openzeppelin-foundry-upgrades/Upgrades.sol";
import {TetrisGame} from "../src/TetrisGame.sol";

contract UpgradeScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        
        console.log("Upgrading TetrisGame at proxy:", proxyAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Upgrade the proxy to a new implementation
        Upgrades.upgradeProxy(
            proxyAddress,
            "TetrisGame.sol",
            ""
        );
        
        vm.stopBroadcast();
        
        console.log("TetrisGame upgraded successfully");
        console.log("New implementation at:", Upgrades.getImplementationAddress(proxyAddress));
        
        // Verify the upgrade
        TetrisGame tetrisGame = TetrisGame(proxyAddress);
        console.log("Current round after upgrade:", tetrisGame.getCurrentRound());
        console.log("Owner after upgrade:", tetrisGame.owner());
    }
}