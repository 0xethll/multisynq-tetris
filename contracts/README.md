## Deploy contract

```
forge create src/TetrisGame.sol:TetrisGame --account deployer --broadcast
```

## Contract address

TetrisGame 0x040F7B65Ab01323a5228127d781387DF1c99A1F8

## Verify contract

```
forge verify-contract \
    0x040F7B65Ab01323a5228127d781387DF1c99A1F8 \
    src/TetrisGame.sol:TetrisGame \
    --verifier sourcify \
    --verifier-url https://sourcify-api-monad.blockvision.org
```

## Upgrade

```
forge script script/Upgrade.s.sol --account deployer --broadcast
```
