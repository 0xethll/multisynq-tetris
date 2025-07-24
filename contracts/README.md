## Deploy contract

```
forge create src/TetrisGame.sol:TetrisGame --account deployer --broadcast
```

## Contract address

TetrisGame 0x05043820CD7fD278154831Ff919a295AF24cb706

## Verify contract

```
forge verify-contract \
    0x05043820CD7fD278154831Ff919a295AF24cb706 \
    src/TetrisGame.sol:TetrisGame \
    --verifier sourcify \
    --verifier-url https://sourcify-api-monad.blockvision.org
```
