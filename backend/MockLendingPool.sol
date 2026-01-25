// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockLPToken is ERC20 {
    address public immutable pool;
    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        pool = msg.sender;
        _decimals = decimals_;
    }

    modifier onlyPool() {
        require(msg.sender == pool, "NOT_POOL");
        _;
    }

    function mint(address to, uint256 amount) external onlyPool {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyPool {
        _burn(from, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}

contract MockLendingPool {
    using SafeERC20 for IERC20;

    uint256 public constant WAD = 1e18;

    address public immutable owner;
    IERC20 public immutable underlying;
    MockLPToken public immutable lpToken;

    uint256 public aprBps; // e.g. 500 = 5% APR
    uint256 public lastAccrual;
    uint256 public totalUnderlying;
    uint256 public totalShares;

    event Deposit(address indexed sender, address indexed onBehalfOf, uint256 amount, uint256 shares);
    event Withdraw(address indexed sender, address indexed to, uint256 amount, uint256 shares);
    event AprUpdated(uint256 oldAprBps, uint256 newAprBps);

    constructor(address _underlying, uint256 _aprBps, string memory lpName, string memory lpSymbol, uint8 lpDecimals) {
        require(_underlying != address(0), "UNDERLYING_ZERO");
        owner = msg.sender;
        underlying = IERC20(_underlying);
        lpToken = new MockLPToken(lpName, lpSymbol, lpDecimals);
        aprBps = _aprBps;
        lastAccrual = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    function setAprBps(uint256 newAprBps) external onlyOwner {
        uint256 old = aprBps;
        _accrue();
        aprBps = newAprBps;
        emit AprUpdated(old, newAprBps);
    }

    function deposit(uint256 amount, address onBehalfOf) external returns (uint256 shares) {
        require(amount > 0, "AMOUNT_ZERO");
        _accrue();
        underlying.safeTransferFrom(msg.sender, address(this), amount);

        if (totalShares == 0 || totalUnderlying == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalUnderlying;
        }

        totalUnderlying += amount;
        totalShares += shares;

        lpToken.mint(onBehalfOf, shares);
        emit Deposit(msg.sender, onBehalfOf, amount, shares);
    }

    function withdraw(uint256 shares, address to) external returns (uint256 amountOut) {
        require(shares > 0, "SHARES_ZERO");
        _accrue();

        lpToken.burn(msg.sender, shares);

        amountOut = (shares * totalUnderlying) / totalShares;
        totalShares -= shares;
        totalUnderlying -= amountOut;

        underlying.safeTransfer(to, amountOut);
        emit Withdraw(msg.sender, to, amountOut, shares);
    }

    function previewDeposit(uint256 amount) external view returns (uint256 shares) {
        if (amount == 0) return 0;
        uint256 accrued = _accruedUnderlying();
        if (totalShares == 0 || accrued == 0) {
            return amount;
        }
        shares = (amount * totalShares) / accrued;
    }

    function previewWithdraw(uint256 shares) external view returns (uint256 amountOut) {
        if (shares == 0) return 0;
        uint256 accrued = _accruedUnderlying();
        amountOut = (shares * accrued) / totalShares;
    }

    function getUserData(address user) external view returns (uint256 shares, uint256 underlyingBalance, uint256 exchangeRateWad) {
        shares = lpToken.balanceOf(user);
        uint256 accrued = _accruedUnderlying();
        if (totalShares == 0) {
            exchangeRateWad = WAD;
            underlyingBalance = 0;
        } else {
            exchangeRateWad = (accrued * WAD) / totalShares;
            underlyingBalance = (shares * accrued) / totalShares;
        }
    }

    function _accrue() internal {
        if (totalUnderlying == 0) {
            lastAccrual = block.timestamp;
            return;
        }
        uint256 dt = block.timestamp - lastAccrual;
        if (dt == 0) return;
        uint256 interest = (totalUnderlying * aprBps * dt) / 10000 / 365 days;
        totalUnderlying += interest;
        lastAccrual = block.timestamp;
    }

    function _accruedUnderlying() internal view returns (uint256) {
        if (totalUnderlying == 0) return 0;
        uint256 dt = block.timestamp - lastAccrual;
        uint256 interest = (totalUnderlying * aprBps * dt) / 10000 / 365 days;
        return totalUnderlying + interest;
    }
}
