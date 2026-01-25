import requests
from decimal import Decimal, getcontext
from web3 import Web3
from database import supabase
from schemas import InfoProfile
from config import settings
from agent import _fetch_live_apy_logic, _ai_recommend_protocol

getcontext().prec = 50

def get_usdc_rate() -> float:
    COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=idr"
    FALLBACK_RATE = 16500.0
    
    try:
        res = requests.get(COINGECKO_URL, timeout=5)
        res.raise_for_status()

        return res.json()["usd-coin"]['idr']
    except requests.RequestException:
        return FALLBACK_RATE
    
def convert_idr_to_usdc(amount_idr: float) -> float:
    rate = get_usdc_rate()
    return round(amount_idr / rate, 2)

def get_address_info(address: str) -> str:
    response = supabase.table("infos").select("*").eq("wallet_address", address).execute()
    
    return response.data

def verify_info(address: str) -> str:
    response =  supabase.table("infos").update({"is_verified": True}).eq("wallet_address", address).execute()
    
    return response.data

def upsert_info_data(profile: InfoProfile) -> dict:
    data = {
        "wallet_address": profile.wallet_address,
        "name": profile.name,
        "description": profile.description
    }
    
    try:
        response = supabase.table("infos").upsert(data).execute()
        
        if not response.data:
            RuntimeError("Failed to upsert info")
        
        return response.data[0]
    except Exception as e:
        raise RuntimeError(f"Supabase error: {str(e)}")


# -------- Lending helpers --------
ERC20_ABI = [
    {"name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "inputs": [{"name": "", "type": "address"}], "stateMutability": "view", "type": "function", "gas": 2146},
    {"name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "inputs": [], "stateMutability": "view", "type": "function", "gas": 2130},
    {"name": "symbol", "outputs": [{"name": "", "type": "string"}], "inputs": [], "stateMutability": "view", "type": "function"},
    {"name": "allowance", "outputs": [{"name": "", "type": "uint256"}], "inputs": [{"name": "", "type": "address"}, {"name": "", "type": "address"}], "stateMutability": "view", "type": "function", "gas": 2295},
    {"name": "approve", "outputs": [{"name": "", "type": "bool"}], "inputs": [{"name": "", "type": "address"}, {"name": "", "type": "uint256"}], "stateMutability": "nonpayable", "type": "function", "gas": 45802}
]

WETH_ABI = [
    {"inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "wad", "type": "uint256"}], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}
]

LENDING_POOL_ABI = [
    {"inputs": [{"internalType": "address", "name": "_underlying", "type": "address"}, {"internalType": "uint256", "name": "_aprBps", "type": "uint256"}, {"internalType": "string", "name": "lpName", "type": "string"}, {"internalType": "string", "name": "lpSymbol", "type": "string"}], "stateMutability": "nonpayable", "type": "constructor"},
    {"inputs": [], "name": "aprBps", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "lpToken", "outputs": [{"internalType": "contract MockLPToken", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "underlying", "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "address", "name": "onBehalfOf", "type": "address"}], "name": "deposit", "outputs": [{"internalType": "uint256", "name": "shares", "type": "uint256"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "shares", "type": "uint256"}, {"internalType": "address", "name": "to", "type": "address"}], "name": "withdraw", "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "previewDeposit", "outputs": [{"internalType": "uint256", "name": "shares", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "shares", "type": "uint256"}], "name": "previewWithdraw", "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "getUserData", "outputs": [{"internalType": "uint256", "name": "shares", "type": "uint256"}, {"internalType": "uint256", "name": "underlyingBalance", "type": "uint256"}, {"internalType": "uint256", "name": "exchangeRateWad", "type": "uint256"}], "stateMutability": "view", "type": "function"}
]

w3_lending = Web3(Web3.HTTPProvider(settings.RPC_URL))


def _calculate_profit(principal: float, apy: float, days: int) -> float:
    """
    Hitung profit: principal * apy * (days / 365)
    """
    return principal * (apy / 100) * (days / 365)


def _get_days_from_now(timestamp_str: str) -> int:
    """
    Hitung berapa hari dari timestamp hingga sekarang.
    Assume timestamp format: ISO 8601 atau timestamp number
    """
    from datetime import datetime
    try:
        if isinstance(timestamp_str, (int, float)):
            dt = datetime.fromtimestamp(timestamp_str)
        else:
            # Try ISO 8601 format
            dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        
        now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
        delta = now - dt
        return max(0, delta.days)
    except Exception:
        return 0


def _require_conn():
    if not w3_lending.is_connected():
        raise RuntimeError("RPC not connected")
    return w3_lending


def _to_units(amount: float, decimals: int) -> int:
    return int(Decimal(str(amount)) * (Decimal(10) ** decimals))


def _from_units(amount: int, decimals: int) -> float:
    return float(Decimal(amount) / (Decimal(10) ** decimals))


def _get_token_config(token: str):
    key = token.lower()
    if key == "auto":
        key = "eth"
    if key in ("eth", "weth"):
        return {
            "address": settings.WETH_ADDRESS,
            "decimals": 18,
            "symbol": "WETH",
            "is_eth": True
        }
    raise RuntimeError("Unsupported token; only eth supported")


def _erc20(address: str):
    return _require_conn().eth.contract(address=Web3.to_checksum_address(address), abi=ERC20_ABI)


def _weth():
    return _require_conn().eth.contract(address=Web3.to_checksum_address(settings.WETH_ADDRESS), abi=WETH_ABI)


def _pool():
    if not settings.LENDING_POOL_ADDRESS:
        raise RuntimeError("LENDING_POOL_ADDRESS not set")
    return _require_conn().eth.contract(address=Web3.to_checksum_address(settings.LENDING_POOL_ADDRESS), abi=LENDING_POOL_ABI)


def _build_tx(base_from: str, nonce: int):
    w3 = _require_conn()
    return {
        "from": Web3.to_checksum_address(base_from),
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
        "chainId": settings.CHAIN_ID
    }


def _send_tx(tx):
    w3 = _require_conn()
    signed = w3.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    return w3.to_hex(tx_hash)


def _wrap_eth(amount_wei: int, nonce: int, sender: str):
    if amount_wei <= 0:
        raise RuntimeError("Invalid wrap amount")
    tx = _weth().functions.deposit().build_transaction(
        {**_build_tx(sender, nonce), "gas": 120000, "value": amount_wei}
    )
    return _send_tx(tx)


def _unwrap_weth(amount_wei: int, nonce: int, sender: str):
    if amount_wei <= 0:
        raise RuntimeError("Invalid unwrap amount")
    tx = _weth().functions.withdraw(amount_wei).build_transaction(
        {**_build_tx(sender, nonce), "gas": 120000}
    )
    return _send_tx(tx)


def get_lending_recommendation(amount: float, token: str):
    pools = _fetch_live_apy_logic()
    if not pools:
        raise RuntimeError("No pools available from DefiLlama")
    
    recommendation = _ai_recommend_protocol(pools, amount)
    
    apy = recommendation.get("apy", 0)
    profit_2m = _calculate_profit(amount, apy, 60)
    profit_6m = _calculate_profit(amount, apy, 180)
    profit_1y = _calculate_profit(amount, apy, 365)
    
    return {
        "protocol": recommendation.get("protocol"),
        "token": "WETH",
        "apy": apy,
        "reason": recommendation.get("reason"),
        "is_safe": recommendation.get("is_safe", False),
        "amount": amount,
        "profit_2months": round(profit_2m, 8),
        "profit_6months": round(profit_6m, 8),
        "profit_1year": round(profit_1y, 8)
    }


def lending_get_positions(wallet: str):
    response = supabase.table("user_lending_positions").select("*").eq("wallet_address", wallet).execute()
    positions_data = response.data or []
    
    pool = _pool()
    total_lp_raw = pool.functions.lpToken().call()
    lp_contract = _erc20(total_lp_raw)
    total_shares = lp_contract.functions.balanceOf(Web3.to_checksum_address(wallet)).call()
    total_lp_balance = _from_units(total_shares, settings.LP_DECIMALS)
    
    positions = []
    total_deposited = 0
    for pos in positions_data:
        total_deposited += pos.get("amount", 0)
        positions.append({
            "protocol": pos["protocol"],
            "amount_deposited": pos["amount"],
            "lp_shares": pos["lp_shares"],
            "apy": pos.get("apy", 0),
            "deposited_at": pos.get("deposited_at")
        })
    
    return {
        "wallet_address": wallet,
        "positions": positions,
        "total_deposited": total_deposited,
        "total_lp_balance": total_lp_balance
    }


def lending_get_positions_with_profit(wallet: str):
    """
    Get posisi dengan profit calculation based on days held dan APY.
    """
    response = supabase.table("user_lending_positions").select("*").eq("wallet_address", wallet).execute()
    positions_data = response.data or []
    
    positions = []
    total_deposited = 0
    total_current_profit = 0
    
    for pos in positions_data:
        principal = pos.get("amount", 0)
        apy = pos.get("apy", 0)
        deposited_at = pos.get("deposited_at", "")
        
        days_held = _get_days_from_now(deposited_at)
        current_profit = _calculate_profit(principal, apy, days_held)
        profit_pct = (current_profit / principal * 100) if principal > 0 else 0
        
        total_deposited += principal
        total_current_profit += current_profit
        
        positions.append({
            "protocol": pos["protocol"],
            "amount_deposited": principal,
            "apy": apy,
            "deposited_at": deposited_at,
            "days_held": days_held,
            "current_profit": round(current_profit, 8),
            "current_profit_pct": round(profit_pct, 2)
        })
    
    return {
        "wallet_address": wallet,
        "positions": positions,
        "total_deposited": total_deposited,
        "total_current_profit": round(total_current_profit, 8)
    }


def lending_deposit(protocol: str, amount: float, token: str):
    """
    Deposit ke real protocol (Moonwell, Aave, etc.) atau fallback ke MockLendingPool.
    Tracks posisi dengan amount + APY di DB untuk profit calculation nanti.
    """
    token_conf = _get_token_config(token)
    token_contract = _erc20(token_conf["address"])
    w3 = _require_conn()
    amount_units = _to_units(amount, token_conf.get("decimals", 18))
    if amount_units <= 0:
        raise RuntimeError("Invalid amount")

    sender = Web3.to_checksum_address(settings.MY_WALLET)
    nonce = w3.eth.get_transaction_count(sender)

    # Wrap ETH to WETH
    wrap_hash = None
    if token_conf.get("is_eth"):
        wrap_hash = _wrap_eth(amount_units, nonce, sender)
        nonce += 1

    # Get target protocol address
    proto_key = protocol.lower()
    protocol_info = settings.PROTOCOL_ADDRESSES.get(proto_key)
    
    if protocol_info:
        target_address = Web3.to_checksum_address(protocol_info["address"])
    else:
        # Fallback to MockLendingPool jika protocol tidak dikenal
        target_address = Web3.to_checksum_address(settings.LENDING_POOL_ADDRESS)
    
    # Approve WETH to target address
    allowance = token_contract.functions.allowance(sender, target_address).call()
    if allowance < amount_units:
        approve_tx = token_contract.functions.approve(target_address, amount_units).build_transaction(
            {**_build_tx(sender, nonce), "gas": 120000}
        )
        approve_hash = _send_tx(approve_tx)
        nonce += 1
    else:
        approve_hash = None

    # Deposit via protocol contract (simplified: assume deposit(amount, onBehalfOf) signature)
    # For real protocols, may need different ABI/method
    try:
        if protocol_info:
            # Try generic deposit method
            protocol_contract = _require_conn().eth.contract(address=target_address, abi=LENDING_POOL_ABI)
            deposit_tx = protocol_contract.functions.deposit(amount_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 250000}
            )
        else:
            # Use MockLendingPool
            pool = _pool()
            deposit_tx = pool.functions.deposit(amount_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 250000}
            )
    except Exception as e:
        raise RuntimeError(f"Failed to build deposit tx: {str(e)}")
    
    deposit_hash = _send_tx(deposit_tx)
    
    # Get current APY dari DefiLlama untuk reference
    pools_data = _fetch_live_apy_logic()
    pool_info = next((p for p in pools_data if p["protocol"] == proto_key), None)
    current_apy = pool_info["apy"] if pool_info else 5.0
    
    # Track posisi: amount adalah principal, APY untuk nanti hitung profit
    from datetime import datetime
    deposited_time = datetime.now().isoformat()
    
    supabase.table("user_lending_positions").insert({
        "wallet_address": sender,
        "protocol": protocol,
        "amount": amount,  # Principal amount
        "lp_shares": amount,  # For now, same as amount
        "apy": current_apy,  # APY snapshot saat deposit
        "deposited_at": deposited_time
    }).execute()

    explorer = settings.EXPLORER_BASE
    return {
        "tx_hash": deposit_hash,
        "wrap_hash": wrap_hash,
        "approve_hash": approve_hash,
        "protocol_address": target_address,
        "explorer_url": f"{explorer}{deposit_hash}",
        "message": f"Deposit {amount} ETH to {protocol} submitted"
    }


def lending_withdraw(protocol: str, amount_lp: float, token: str):
    """
    Withdraw dari protocol dan hitung profit.
    amount_lp: -1 untuk withdraw semua; atau spesifik amount
    """
    token_conf = _get_token_config(token)
    w3 = _require_conn()
    sender = Web3.to_checksum_address(settings.MY_WALLET)
    
    # Cari posisi di DB
    response = supabase.table("user_lending_positions").select("*").eq("wallet_address", sender).eq("protocol", protocol).execute()
    position_data = response.data
    if not position_data:
        raise RuntimeError(f"No position found for protocol {protocol}")
    
    position = position_data[0]
    principal_amount = position["amount"]  # Amount yang di-deposit
    
    # Get target protocol address
    proto_key = protocol.lower()
    protocol_info = settings.PROTOCOL_ADDRESSES.get(proto_key)
    
    if protocol_info:
        target_address = Web3.to_checksum_address(protocol_info["address"])
        lp_address = None  # Real protocol LP token beda
    else:
        # MockLendingPool fallback
        pool = _pool()
        lp_address = pool.functions.lpToken().call()
        target_address = pool.address
    
    # Get LP balance for validation
    if lp_address:
        lp_contract = _erc20(lp_address)
        shares_raw = lp_contract.functions.balanceOf(sender).call()
    else:
        shares_raw = _to_units(principal_amount, settings.LP_DECIMALS)  # Fallback

    if amount_lp < 0:
        withdraw_units = shares_raw
    else:
        withdraw_units = _to_units(amount_lp, settings.LP_DECIMALS)
    
    if withdraw_units <= 0:
        raise RuntimeError("Invalid withdraw amount")
    if withdraw_units > shares_raw:
        raise RuntimeError("Insufficient LP balance")

    nonce = w3.eth.get_transaction_count(sender)
    
    # Build withdraw transaction
    try:
        if protocol_info:
            protocol_contract = w3.eth.contract(address=target_address, abi=LENDING_POOL_ABI)
            tx = protocol_contract.functions.withdraw(withdraw_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 250000}
            )
        else:
            pool = _pool()
            tx = pool.functions.withdraw(withdraw_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 250000}
            )
    except Exception as e:
        raise RuntimeError(f"Failed to build withdraw tx: {str(e)}")
    
    tx_hash = _send_tx(tx)
    nonce += 1

    unwrap_hash = None
    if token_conf.get("is_eth"):
        # Unwrap WETH to ETH
        preview_out = withdraw_units  # Simplified; real protocol may differ
        unwrap_hash = _unwrap_weth(preview_out, nonce, sender)
    
    # Calculate profit berdasarkan hari yang diheld FROM deposited_at hingga sekarang
    days_held = _get_days_from_now(position.get("deposited_at", ""))
    profit = _calculate_profit(principal_amount, position.get("apy", 0), days_held)
    profit_pct = (profit / principal_amount * 100) if principal_amount > 0 else 0
    
    # Delete position from DB
    supabase.table("user_lending_positions").delete().eq("id", position["id"]).execute()
    
    from datetime import datetime
    withdraw_time = datetime.now().isoformat()
    
    # Calculate withdrawn amount
    withdrawn_amount = _from_units(withdraw_units, settings.LP_DECIMALS) if protocol_info else amount_lp
    
    explorer = settings.EXPLORER_BASE
    return {
        "tx_hash": tx_hash,
        "unwrap_hash": unwrap_hash,
        "explorer_url": f"{explorer}{tx_hash}",
        "withdraw_time": withdraw_time,
        "principal": principal_amount,
        "withdrawn": withdrawn_amount if withdrawn_amount else principal_amount,
        "profit": round(profit, 8),
        "profit_pct": round(profit_pct, 2),
        "message": f"Withdraw from {protocol} submitted (Profit: {profit:.8f} ETH, {profit_pct:.2f}%)"
    }