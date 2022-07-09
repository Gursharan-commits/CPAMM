//SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

//the contract will take 2 ERC20 tokens
//import IERC20
import "./interfaces/IERC20.sol";

contract CPAMM {
    //immutable- token will not change after we set them inside constructor
    // the two tokens we will be trading- token0 & 1
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    //reserve- internal balance of the two tokens (state variables)
    uint256 public reserve0;
    uint256 public reserve1;

    //mint and burn shares when the liquidity is added or removed
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function _mint(address _to, uint256 _amount) private {
        balanceOf[_to] += _amount;
        totalSupply += _amount;
    }

    function _burn(address _from, uint256 _amount) private {
        balanceOf[_from] -= _amount;
        totalSupply -= _amount;
    }

    function _update(uint256 _reserve0, uint256 _reserve1) private {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    function swap(address _tokenIn, uint256 _amountIn)
        external
        returns (uint256 amountOut)
    {
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            "invalid token"
        );
        require(_amountIn > 0, "amount in=0");

        // Pull in tokenIn
        bool isToken0 = _tokenIn == address(token0);
        (
            IERC20 tokenIn,
            IERC20 tokenOut,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isToken0
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);

        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        //calculate tokenOut (include fees), fee 0.3%
        uint256 amountInWithFee = (_amountIn * 997) / 1000;
        // ydx / (x = dx) = dy
        amountOut =
            (reserveOut * amountInWithFee) /
            (reserveIn + amountInWithFee);

        //transfer token out to msg.sender
        tokenOut.transfer(msg.sender, amountOut);

        //update the reserve
        _update(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
    }

    function addLiquidity(uint256 _amount0, uint256 _amount1)
        external
        returns (uint256 shares)
    {
        //Pull in token0 and token1
        token0.transferFrom(msg.sender, address(this), _amount0);
        token1.transferFrom(msg.sender, address(this), _amount1);

        // dy/dx = y/x
        if (reserve0 > 0 || reserve1 > 0) {
            require(reserve0 * _amount1 == reserve1 * _amount0, "dy/dx != y/x");
        }

        //Mint shares
        // f(x,y) =value of liquidity = sqrt(xy) for totalSupply == 0
        // s = dx /x * T = dy / y * T (s- amount of shares to mint, t- total supply)
        if (totalSupply == 0) {
            shares = _sqrt((_amount0 * _amount1));
        } else {
            shares = _min(
                (_amount0 * totalSupply) / reserve0,
                (_amount1 * totalSupply) / reserve1
            );
        }
        require(shares > 0, "shares = 0");
        _mint(msg.sender, shares);

        //update reserves
        _update(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
    }

    function removeLiquidity(uint256 _shares)
        external
        returns (uint256 amount0, uint256 amount1)
    {
        //calculate amount0 and amount1 to withdraw
        //dx = s / T * x
        // dy = s / T * y
        uint256 bal0 = token0.balanceOf(address(this));
        uint256 bal1 = token1.balanceOf(address(this));

        amount0 = (_shares * bal0) / totalSupply;
        amount1 = (_shares * bal1) / totalSupply;
        require(amount0 > 0 && amount1 > 0, "amount0 or 1 is = 0");

        //burn shares
        _burn(msg.sender, _shares);

        //update reserve
        _update(bal0 - amount0, bal1 - amount1);

        //transfer tokens to msg.sender
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
    }

    //From Uniswap CodeBase
    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x > y ? x : y;
    }
}
