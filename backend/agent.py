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

w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))

def get_web3_connection():
    if not w3.is_connected():
        raise ConnectionError("Gagal Terhubung ke RPC Node")
    return w3

def _fetch_live_apy_logic():
    """Fetch real APY data dari DefiLlama untuk Base chain."""
    print("DEBUG: Fetching DefiLlama pools...")
    url = "https://yields.llama.fi/pools"
    
    trusted_protocols = ["moonwell", "aave-v3", "compound-v3", "spark"]
    results = []
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()['data']
            for pool in data:
                if pool.get('chain') != 'Base':
                    continue
                
                project = pool.get('project', '').lower()
                if project not in trusted_protocols:
                    continue
                
                apy = pool.get('apy', 0)
                if apy <= 0 or apy > 100:
                    continue
                
                results.append({
                    "protocol": project,
                    "apy": round(apy, 2),
                    "tvl": pool.get('tvlUsd', 0),
                    "symbol": pool.get('symbol', 'Unknown'),
                    "pool_id": pool.get('pool', '')
                })
            
            results.sort(key=lambda x: x['apy'], reverse=True)
            print(f"\tFound {len(results)} Base pools from trusted protocols")
            return results[:5]
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
def invest_money(protocol: str, amount: float):
    """
    Gunakan tool ini JIKA user ingin melakukan investasi atau deposit uang.
    Input:
    - protocol: string ('moonwell' atau 'aave')
    - amount: float (jumlah ETH/Asset yang mau dideposit)
    """
    w3_executor = get_web3_connection()
    
    yield_data = _fetch_live_apy_logic()
    proto = (protocol or "").lower()
    match = next((p for p in yield_data if p.get("protocol") == proto), None)
    current_apy = (match or {}).get("apy", 0)
    
    safety = _check_safety_logic(protocol, amount, current_apy)
    if not safety["is_safe"]:
        return f"TRANSAKSI DIBATALKAN OLEH SECURITY AI: {safety['reason']}"

    target_address = settings.MOONWELL_CONTRACT if protocol.lower() == "moonwell" else settings.AAVE_CONTRACT
    
    try:
        amount_wei = w3_executor.to_wei(amount, 'ether')
        nonce = w3_executor.eth.get_transaction_count(settings.MY_WALLET)
        
        tx = {
            'nonce': nonce,
            'to': Web3.to_checksum_address(target_address),
            'value': amount_wei,
            'gas': 210000,
            'gasPrice': w3_executor.eth.gas_price,
            'chainId': settings.CHAIN_ID
        }
        
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
def check_user_balance(target_address: str):
    """
    Gunakan tool ini untuk mengecek saldo ETH dari address wallet orang lain (bukan wallet agent).
    Input: target_address (string, contoh: '0x123...')
    """
    try:
        w3_executor = get_web3_connection()
        checksum_address = Web3.to_checksum_address(target_address)
        balance_wei = w3_executor.eth.get_balance(checksum_address)
        balance_eth = w3_executor.from_wei(balance_wei, 'ether')
        return f"Saldo wallet {target_address} adalah: {balance_eth} ETH"
    except Exception as e:
        return f"Gagal mengecek saldo: {str(e)}"

_agent_excutor = None

def get_agent_executor():
    global _agent_excutor
    if _agent_excutor:
        return _agent_excutor
    
    tools = [get_defi_yields, recommend_best_protocol, check_wallet_balance, check_user_balance]
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        temperature=0.7
    )
    
    prompt = hub.pull("hwchase17/openai-tools-agent")
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    
    _agent_excutor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return _agent_excutor