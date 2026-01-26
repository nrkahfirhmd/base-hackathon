import os
import json
import random
import requests
from config import settings
from web3 import Web3
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_tool_calling_agent, tool
from langchain import hub
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from database import supabase
from decimal import Decimal

w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))

ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
    {
        "constant": False,
        "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function",
    }
]

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

def get_web3_connection():
    if not w3.is_connected():
        raise ConnectionError("Gagal Terhubung ke RPC Node")
    return w3

def _fetch_live_apy_logic():
    """Fetch real APY data dari DefiLlama untuk Base chain."""
    print("DEBUG: Fetching DefiLlama pools...")
    url = "https://yields.llama.fi/pools"
    
    trusted_protocols = ["moonwell", "moonwell-lending", "aave-v3", "aave", "compound-v3", "compound", "spark"]
    results = []
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()['data']
            pools_by_protocol = {}
            
            for pool in data:
                if pool.get('chain') != 'Base':
                    continue
                
                project = pool.get('project', '').lower()
                if project not in trusted_protocols:
                    continue
                
                apy = pool.get('apy', 0)
                if apy <= 0 or apy > 100:
                    continue
                
                proto_normalized = project
                if "moonwell" in project:
                    proto_normalized = "moonwell"
                elif "aave" in project:
                    proto_normalized = "aave-v3"
                elif "compound" in project:
                    proto_normalized = "compound-v3"
                
                if proto_normalized not in pools_by_protocol:
                    pools_by_protocol[proto_normalized] = []
                
                pools_by_protocol[proto_normalized].append({
                    "protocol": proto_normalized,
                    "apy": round(apy, 2),
                    "tvl": pool.get('tvlUsd', 0),
                    "symbol": pool.get('symbol', 'Unknown'),
                    "pool_id": pool.get('pool', '')
                })
            
            # Get top 2 APY pools per protocol
            for proto, pools_list in pools_by_protocol.items():
                pools_list.sort(key=lambda x: x['apy'], reverse=True)
                results.extend(pools_list[:2])
            
            results.sort(key=lambda x: x['apy'], reverse=True)
            print(f"\tFound {len(results)} Base pools from trusted protocols (top 2 per protocol)")
            return results
        else:
            print(f"\tDefiLlama API error: {response.status_code}")
    except Exception as e:
        print(f"\tDefiLlama error: {e}")
    
    return [
        {"protocol": "moonwell", "apy": 5.8, "tvl": 1000000, "symbol": "WETH", "pool_id": "mock"},
        {"protocol": "aave-v3", "apy": 4.2, "tvl": 5000000, "symbol": "WETH", "pool_id": "mock"}
    ]

def _ai_recommend_protocol(pools: list, amount: float):
    """AI DeFi Analyst untuk memilih protocol terbaik."""
    print(f"DEBUG: AI analyzing {len(pools)} pools for {amount} ETH deposit")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.3
    )
    
    pools_summary = "\n".join([
        f"- {p['protocol']}: APY {p['apy']}%, TVL ${p['tvl']:,.0f}, Symbol {p['symbol']}"
        for p in pools
    ])
    
    template = """
You are a DeFi Investment Analyst with 5 years of experience analyzing lending protocols on Base chain.

Available pools:
{pools}

User wants to deposit: {amount} ETH

Analyze and recommend the BEST protocol based on:
1. APY sustainability (5-15% is realistic, >50% is scam)
2. Protocol reputation (Moonwell, Aave, Compound are trusted)
3. TVL size (higher TVL = more established)
4. Risk assessment

IMPORTANT RULES:
- If APY > 50%: REJECT (likely scam)
- If protocol not in [moonwell, aave-v3, compound-v3, spark]: REJECT
- If amount > 1 ETH: WARN (high risk for testnet)

Output ONLY JSON:
{{"protocol": "protocol_name", "apy": <number>, "is_safe": true/false, "reason": "detailed explanation"}}
    """
    
    prompt = PromptTemplate(input_variables=["pools", "amount"], template=template)
    chain = prompt | llm | StrOutputParser()
    
    try:
        response = chain.invoke({"pools": pools_summary, "amount": amount})
        clean = response.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)
        print(f"\tAI Recommendation: {result.get('protocol')} (APY {result.get('apy')}%)")
        return result
    except Exception as e:
        print(f"AI Error: {e}")
        best = max(pools, key=lambda x: x['apy']) if pools else pools[0]
        return {
            "protocol": best['protocol'],
            "apy": best['apy'],
            "is_safe": best['apy'] < 50,
            "reason": "Fallback: highest APY from trusted pool"
        }
    
def _check_safety_logic(protocol: str, amount: float, current_apy: float):
    """Validasi keamanan sederhana sebelum transaksi deposit.

    Aturan:
    - Protokol harus termasuk daftar trusted.
    - APY harus realistis (0 < apy <= 50).
    - Untuk testnet, batasi jumlah deposit <= 1 ETH.
    """
    trusted = {"moonwell", "aave-v3", "compound-v3", "spark"}
    proto = (protocol or "").lower()

    if proto not in trusted:
        return {"is_safe": False, "reason": "Protocol tidak dalam daftar trusted"}
    if current_apy <= 0:
        return {"is_safe": False, "reason": "APY tidak valid atau 0"}
    if current_apy > 50:
        return {"is_safe": False, "reason": "APY terlalu tinggi (tidak realistis)"}
    if amount is None or amount <= 0:
        return {"is_safe": False, "reason": "Jumlah deposit harus > 0"}
    if amount > 1.0:
        return {"is_safe": False, "reason": "Jumlah deposit > 1 ETH tidak diizinkan di testnet"}

    return {"is_safe": True, "reason": "Lolos pengecekan keamanan"}
    
@tool
def get_defi_yields():
    """
    Fetch APY data dari DefiLlama untuk Base chain protocols.
    Returns list of pools dengan APY, TVL, dan protocol info.
    """
    return _fetch_live_apy_logic()

@tool
def recommend_best_protocol(amount: float):
    """
    AI recommendation untuk protocol lending terbaik.
    Input: amount (ETH yang mau di-deposit)
    Output: recommended protocol dengan APY dan reasoning
    """
    pools = _fetch_live_apy_logic()
    if not pools:
        return {"error": "No pools available"}
    return _ai_recommend_protocol(pools, amount)

@tool
def invest_money(protocol: str, amount: float, token_symbol: str = "USDC"):
    """
    Gunakan tool ini JIKA user ingin melakukan investasi atau deposit uang.
    Input:
    - protocol: string ('moonwell' atau 'aave')
    - amount: float (jumlah ETH/Asset yang mau dideposit)
    """
    w3_executor = get_web3_connection()
    
    token_address = settings.USDC_ADDRESS if token_symbol.upper() == "USDC" else settings.IDRX_ADDRESS
    
    yield_data = _fetch_live_apy_logic()
    proto = (protocol or "").lower()
    match = next((p for p in yield_data if p.get("protocol") == proto), None)
    current_apy = (match or {}).get("apy", 0)
    
    safety = _check_safety_logic(protocol, amount, current_apy)
    if not safety["is_safe"]:
        return f"TRANSAKSI DIBATALKAN OLEH SECURITY AI: {safety['reason']}"

    target_address = settings.MOONWELL_CONTRACT if protocol.lower() == "moonwell" else settings.AAVE_CONTRACT
    
    try:
        contract = w3_executor.eth.contract(address=token_address, abi=ERC20_ABI)
        decimals = contract.functions.decimals().call()
        amount_int = int(amount * (10 ** decimals))
        
        nonce = w3_executor.eth.get_transaction_count(settings.MY_WALLET)
        
        tx_func = contract.functions.transfer(target_address, amount_int)
        
        tx = tx_func.build_transaction({
            'chainId': settings.CHAIN_ID,
            'gas': 210000,
            'gasPrice': w3_executor.eth.gas_price,
            'nonce': nonce,
        })

        signed_tx = w3_executor.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
        tx_hash = w3_executor.eth.send_raw_transaction(signed_tx.raw_transaction)

        tx_hex = w3_executor.to_hex(tx_hash)
        
        return f"INVESTASI SUKSES! {amount} ETH dikirim ke {protocol}.\nHash: {tx_hex}"
        
    except Exception as e:
        return f"Gagal melakukan transaksi on-chain: {str(e)}"

@tool
def check_wallet_balance():
    """Gunakan tool ini untuk mengecek saldo wallet Agent sendiri."""
    w3_executor = get_web3_connection()
    balance_wei = w3_executor.eth.get_balance(settings.MY_WALLET)
    balance_eth = w3_executor.from_wei(balance_wei, 'ether')
    return f"Saldo Wallet ({settings.MY_WALLET}): {balance_eth} ETH"

@tool
def check_user_balance(target_address: str, token_symbol: str = "ETH"):
    """
    Gunakan tool ini untuk mengecek saldo ETH dari address wallet orang lain (bukan wallet agent).
    Input: target_address (string, contoh: '0x123...')
    """
    try:
        w3_executor = get_web3_connection()
        checksum_address = Web3.to_checksum_address(target_address)
        
        if token_symbol.upper() == "ETH":
            wei = w3_executor.eth.get_balance(checksum_address)
            eth = w3_executor.from_wei(wei, 'ether')
            return f"Saldo wallet {target_address} adalah: {eth} ETH"
        
        token_contract_address = None
        if token_symbol.upper() == "USDC":
            token_contract_address = settings.USDC_ADDRESS
        elif token_symbol.upper() == "IDRX":
            token_contract_address = settings.IDRX_ADDRESS
            
        if not token_contract_address:
            return "Error: Token tidak dikenali. Gunakan ETH, USDC, atau IDRX."
        
        contract = w3_executor.eth.contract(address=token_contract_address, abi=ERC20_ABI)
        
        raw_balance = contract.functions.balanceOf(checksum_address).call()
        decimals = contract.functions.decimals().call()
        
        human_balance = raw_balance / (10 ** decimals)
        
        return f"Saldo {token_symbol} di {target_address}: {human_balance}"
    except Exception as e:
        return f"Gagal mengecek saldo: {str(e)}"

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
    elif key == "idrx":
        return {
            "address": settings.IDRX_ADDRESS,
            "decimals": 18,
            "symbol": "IDRX",
            "is_eth": False
        }
    elif key == "usdc":
        return {
            "address": settings.USDC_ADDRESS,
            "decimals": 6,
            "symbol": "USDC",
            "is_eth": False
        }
    raise RuntimeError("Unsupported token; only eth supported")

def _to_units(amount: float, decimals: int) -> int:
    return int(Decimal(str(amount)) * (Decimal(10) ** decimals))

def _from_units(amount: int, decimals: int) -> float:
    return float(Decimal(amount) / (Decimal(10) ** decimals))

def _erc20(address: str):
    return get_web3_connection().eth.contract(address=Web3.to_checksum_address(address), abi=ERC20_ABI)

def _weth():
    return get_web3_connection().eth.contract(address=Web3.to_checksum_address(settings.WETH_ADDRESS), abi=WETH_ABI)

def _pool():
    if not settings.LENDING_POOL_ADDRESS:
        raise RuntimeError("LENDING_POOL_ADDRESS not set")
    return get_web3_connection().eth.contract(address=Web3.to_checksum_address(settings.LENDING_POOL_ADDRESS), abi=LENDING_POOL_ABI)

def _build_tx(base_from: str, nonce: int):
    w3 = get_web3_connection()
    return {
        "from": Web3.to_checksum_address(base_from),
        "nonce": nonce,
        "gasPrice": w3.eth.gas_price,
        "chainId": settings.CHAIN_ID
    }

def _send_tx(tx):
    w3 = get_web3_connection()
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
    
def _wait_for_tx(tx_hash):
    """Menunggu sampai transaksi dikonfirmasi di blockchain (Mining selesai)."""
    try:
        w3 = get_web3_connection()
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        if receipt.status == 0:
            raise RuntimeError(f"Transaction failed/reverted: {tx_hash}")
        return receipt
    except Exception as e:
        print(f"Error waiting for tx: {e}")
    
@tool
def lending_deposit(protocol: str, amount: float, token: str):
    """
    Gunakan tool ini untuk melakukan DEPOSIT atau INVESTASI ke protokol lending.
    
    Args:
        protocol (str): Nama protokol tujuan (contoh: 'moonwell', 'aave', atau 'auto').
        amount (float): Jumlah aset yang ingin didepositkan.
        token (str): Simbol token yang digunakan (contoh: 'IDRX', 'USDC', atau 'ETH').
        
    Returns:
        JSON string berisi status, hash transaksi, dan pesan sukses.
    """
    token_conf = _get_token_config(token) 
    token_contract = _erc20(token_conf["address"])
    
    w3 = get_web3_connection()
    amount_units = _to_units(amount, token_conf.get("decimals", 18))
    
    if amount_units <= 0:
        raise RuntimeError("Invalid amount")

    sender = Web3.to_checksum_address(settings.MY_WALLET)
    nonce = w3.eth.get_transaction_count(sender)

    wrap_hash = None
    if token_conf.get("is_eth"):
        print("Wrapping ETH...")
        wrap_hash = _wrap_eth(amount_units, nonce, sender)
        _wait_for_tx(wrap_hash) 
        nonce += 1

    proto_key = protocol.lower()
    protocol_info = None
    
    target_address = Web3.to_checksum_address(settings.LENDING_POOL_ADDRESS)
    
    user_balance = token_contract.functions.balanceOf(sender).call()
    if user_balance < amount_units:
        raise RuntimeError(f"SALDO TIDAK CUKUP! Punya: {user_balance}, Butuh: {amount_units}")
    
    allowance = token_contract.functions.allowance(sender, target_address).call()
    
    approve_hash = None
    if allowance < amount_units:
        print(f"Approving {token_conf['symbol']}...")
        approve_tx = token_contract.functions.approve(target_address, amount_units).build_transaction(
            {**_build_tx(sender, nonce), "gas": 150000}
        )
        approve_hash = _send_tx(approve_tx)
        _wait_for_tx(approve_hash)
        nonce += 1

    print(f"Depositing to {protocol}...")
    try:
        if protocol_info:
            protocol_contract = get_web3_connection().eth.contract(address=target_address, abi=LENDING_POOL_ABI)
            deposit_tx = protocol_contract.functions.deposit(amount_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 300000} 
            )
        else:
            pool = _pool()
            deposit_tx = pool.functions.deposit(amount_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 300000}
            )
    except Exception as e:
        raise RuntimeError(f"Failed to build deposit tx: {str(e)}")
    
    deposit_hash = _send_tx(deposit_tx)
    
    pools_data = _fetch_live_apy_logic()
    pool_info = next((p for p in pools_data if p["protocol"] == proto_key), None)
    
    if not pool_info:
        current_apy = 5.0 
    else:
        current_apy = pool_info.get("apy", 0)

    from datetime import datetime
    deposited_time = datetime.now().isoformat()
    
    insert_resp = supabase.table("user_lending_positions").insert({
        "wallet_address": sender,
        "protocol": proto_key,
        "amount": amount,  
        "lp_shares": amount,  
        "apy": current_apy,
        "token_symbol": token_conf["symbol"],
        "deposited_at": deposited_time
    }).execute()

    if getattr(insert_resp, "error", None):
        raise RuntimeError(f"Failed to insert position: {insert_resp.error}")

    explorer = settings.EXPLORER_BASE
    
    return {
        "tx_hash": deposit_hash,
        "wrap_hash": wrap_hash,
        "approve_hash": approve_hash,
        "protocol_address": target_address,
        "explorer_url": f"{explorer}{deposit_hash}",
        "token": token_conf["symbol"], 
        "message": f"Deposit {amount} {token_conf['symbol']} to {protocol} submitted" 
    }

@tool
def lending_withdraw(position_id: int, amount_lp: float, token: str):
    """
    Gunakan tool ini untuk melakukan WITHDRAW (Tarik Dana) dari lending.
    
    Args:
        position_id (int): ID posisi lending yang ingin di-withdraw (didapat dari database/info).
        amount_lp (float): Jumlah yang ingin ditarik. Isi -1 untuk menarik SEMUA (Full Withdraw).
        token (str): Token yang ditarik (IDRX, USDC, atau ETH). Default: IDRX.
        
    Returns:
        Pesan status withdraw.
    """
    w3 = get_web3_connection()
    sender = Web3.to_checksum_address(settings.MY_WALLET)

    response = supabase.table("user_lending_positions").select(
        "*").eq("id", position_id).execute()
    position_data = response.data
    if not position_data:
        raise RuntimeError(f"No position found with ID {position_id}")

    position = position_data[0]
    protocol = position.get("protocol", "").lower()
    principal_amount = position["amount"]

    saved_token = position.get("token_symbol", token).lower()

    token_conf = _get_token_config(saved_token)

    protocol_info = settings.PROTOCOL_ADDRESSES.get(protocol)

    if protocol_info:
        target_address = Web3.to_checksum_address(protocol_info["address"])
        lp_address = None
    else:
        pool = _pool()
        lp_address = pool.functions.lpToken().call()
        target_address = pool.address

    decimals = token_conf["decimals"]

    if lp_address:
        lp_contract = _erc20(lp_address)
        shares_raw = lp_contract.functions.balanceOf(sender).call()
    else:
        shares_raw = _to_units(principal_amount, decimals)

    if amount_lp < 0:
        withdraw_amount_base = principal_amount  
    else:
        withdraw_amount_base = amount_lp 

    withdraw_units = _to_units(withdraw_amount_base, decimals)

    if withdraw_units <= 0:
        raise RuntimeError("Invalid withdraw amount")

    # Validasi saldo LP (Optional, tergantung implementasi Mock)
    # if withdraw_units > shares_raw:
    #    raise RuntimeError("Insufficient LP balance")

    nonce = w3.eth.get_transaction_count(sender)

    try:
        if protocol_info:
            protocol_contract = w3.eth.contract(
                address=target_address, abi=LENDING_POOL_ABI)
            tx = protocol_contract.functions.withdraw(withdraw_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 300000}
            )
        else:
            pool = _pool()
            tx = pool.functions.withdraw(withdraw_units, sender).build_transaction(
                {**_build_tx(sender, nonce), "gas": 300000}
            )
    except Exception as e:
        raise RuntimeError(f"Failed to build withdraw tx: {str(e)}")

    tx_hash = _send_tx(tx)
    nonce += 1 

    unwrap_hash = None
    if token_conf.get("is_eth"):
        unwrap_hash = _unwrap_weth(withdraw_units, nonce, sender)

    days_held = _get_days_from_now(position.get("deposited_at", ""))
    profit_withdrawn = _calculate_profit(
        withdraw_amount_base, position.get("apy", 0), days_held)
    profit_pct = (profit_withdrawn / withdraw_amount_base * 100) if withdraw_amount_base > 0 else 0

    remaining_amount = principal_amount - withdraw_amount_base

    if remaining_amount < 0 or abs(remaining_amount) <= 1e-12:
        remaining_amount = 0

    import logging
    
    if amount_lp < 0 or remaining_amount == 0:
        del_resp = supabase.table("user_lending_positions").delete().eq(
            "id", position["id"]).eq("wallet_address", sender).execute()

        check = supabase.table("user_lending_positions").select("id").eq(
            "id", position["id"]).eq("wallet_address", sender).execute()
        if check.data:
            supabase.table("user_lending_positions").delete().eq(
                "id", position["id"]).eq("wallet_address", sender).execute()
            check2 = supabase.table("user_lending_positions").select("id").eq(
                "id", position["id"]).eq("wallet_address", sender).execute()
            if check2.data:
                supabase.table("user_lending_positions").update({"amount": 0, "lp_shares": 0}).eq(
                    "id", position["id"]).eq("wallet_address", sender).execute()
    else:
        supabase.table("user_lending_positions").update({
            "amount": remaining_amount,
            "lp_shares": remaining_amount
        }).eq("id", position["id"]).execute()

    from datetime import datetime
    withdraw_time = datetime.now().isoformat()
    explorer = settings.EXPLORER_BASE

    return {
        "tx_hash": tx_hash,
        "unwrap_hash": unwrap_hash,  
        "explorer_url": f"{explorer}{tx_hash}",
        "withdraw_time": withdraw_time,
        "protocol": protocol,
        "token": token_conf["symbol"], 
        "principal": principal_amount,
        "withdrawn": withdraw_amount_base,
        "profit": round(profit_withdrawn, 8),
        "profit_pct": round(profit_pct, 2),
        "remaining_amount": max(0, remaining_amount),
        "message": f"Withdraw {withdraw_amount_base} {token_conf['symbol']} from {protocol} submitted"
    }

_agent_excutor = None

def get_agent_executor():
    global _agent_excutor
    if _agent_excutor:
        return _agent_excutor
    
    tools = [get_defi_yields, recommend_best_protocol, check_wallet_balance, check_user_balance, lending_deposit, lending_withdraw]
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        temperature=0
    )
    
    prompt = hub.pull("hwchase17/openai-tools-agent")
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    
    _agent_excutor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return _agent_excutor