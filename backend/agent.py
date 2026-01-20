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
    """Mengambil data APY real-time dari DefiLlama."""
    print("DEBUG: Menghubungi DefiLlama API...")
    url = "https://yields.llama.fi/pools"

    market_data = {
        "moonwell": {"apy": round(random.uniform(3.5, 6.5), 2), "protocol": "Moonwell"},
        "aave": {"apy": round(random.uniform(2.5, 5.5), 2), "protocol": "Aave"}
    }

    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()['data']
            for pool in data:
                if pool['chain'] != 'Base' or 'USDC' not in pool['symbol'].upper():
                    continue

                if pool['project'] == 'moonwell':
                    market_data['moonwell']['apy'] = pool['apy']
                elif pool['project'] == 'aave-v3':
                    market_data['aave']['apy'] = pool['apy']
            print("\tData APY Real berhasil diambil!")
        else:
            print(f"\tGagal ambil API. Menggunakan Mock Data.")
    except Exception as e:
        print(f"\tError Koneksi DefiLlama: {e}. Menggunakan Mock Data.")

    return market_data

def _check_safety_logic(protocol: str, amount: float, current_apy: float):
    """AI Security Analyst untuk validasi transaksi."""
    print(f"DEBUG: Security Check for {protocol} - {amount} ETH")

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0
    )

    template = """
    Anda adalah Security Analyst DeFi. Validasi transaksi berikut.
    
    DATA:
    - Protokol: {protocol}
    - Jumlah: {amount}
    - APY: {apy}%
    
    ATURAN:
    1. Jika APY > 50%, tolak (UNSAFE: High Risk/Scam).
    2. Jika Protokol bukan 'moonwell' atau 'aave', tolak (UNSAFE: Unknown Protocol).
    3. Jika Jumlah > 0.1, tolak (UNSAFE: Limit Exceeded for Testing).
    4. Selain itu, izinkan (SAFE).

    OUTPUT HANYA JSON:
    {{"status": "SAFE"}} atau {{"status": "UNSAFE", "reason": "..."}}
    """

    prompt = PromptTemplate(
        input_variables=["protocol", "amount", "apy"], template=template)
    chain = prompt | llm | StrOutputParser()

    try:
        response_text = chain.invoke(
            {"protocol": protocol, "amount": amount, "apy": current_apy})
        clean_text = response_text.replace(
            "```json", "").replace("```", "").strip()
        result_json = json.loads(clean_text)

        if result_json["status"] == "UNSAFE":
            return {"is_safe": False, "reason": result_json.get("reason", "Unknown Risk")}
        return {"is_safe": True, "reason": "Safe"}
    except Exception as e:
        print(f"Safety Check Error: {e}")
        return {"is_safe": False, "reason": f"AI Validation Error: {e}"}
    
@tool
def get_defi_yields():
    """
    Gunakan tool ini untuk mengecek persentase keuntungan (APY) terbaru 
    dari protokol DeFi seperti Moonwell dan Aave.
    Output berupa JSON data APY.
    """
    return _fetch_live_apy_logic()

@tool
def invest_money(protocol: str, amount: float):
    """
    Gunakan tool ini JIKA user ingin melakukan investasi atau deposit uang.
    Input:
    - protocol: string ('moonwell' atau 'aave')
    - amount: float (jumlah ETH/Asset yang mau dideposit)
    """
    w3_executor = get_web3_connection()
    
    # 1. Cek APY untuk data safety check
    yield_data = _fetch_live_apy_logic()
    current_apy = yield_data.get(protocol.lower(), {}).get("apy", 0)
    
    # 2. Safety Check (AI Validation)
    safety = _check_safety_logic(protocol, amount, current_apy)
    if not safety["is_safe"]:
        return f"TRANSAKSI DIBATALKAN OLEH SECURITY AI: {safety['reason']}"

    # 3. Prepare Transaction
    target_address = settings.MOONWELL_CONTRACT if protocol.lower() == "moonwell" else settings.AAVE_CONTRACT
    
    try:
        amount_wei = w3_executor.to_wei(amount, 'ether')
        nonce = w3_executor.eth.get_transaction_count(settings.MY_WALLET)
        
        # Simple Native Transfer
        # Note: Untuk interaksi smart contract asli, perlu build_transaction dengan ABI
        tx = {
            'nonce': nonce,
            'to': Web3.to_checksum_address(target_address),
            'value': amount_wei,
            'gas': 210000,
            'gasPrice': w3_executor.eth.gas_price,
            'chainId': settings.CHAIN_ID
        }
        
        # 4. Sign & Send
        signed_tx = w3_executor.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
        tx_hash = w3_executor.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hex = w3_executor.to_hex(tx_hash)
        
        return f"INVESTASI SUKSES! {amount} ETH dikirim ke {protocol}.\nHash: {tx_hex}"
        
    except Exception as e:
        return f"Gagal melakukan transaksi on-chain: {str(e)}"

# def perform_withdraw(protocol: str):
#     w3_executor = get_web3_connection()
    
#     nonce = w3_executor.eth.get_transaction_count(settings.MY_WALLET)
    
#     tx = {
#         'nonce': nonce,
#         'to': settings.MY_WALLET,
#         'value': 0,
#         'gas': 21000,
#         'gasPrice': w3_executor.eth.gas_price,
#         'chainId': settings.CHAIN_ID
#     }
    
#     signed_tx = w3_executor.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
#     tx_hash = w3_executor.eth.send_raw_transaction(signed_tx.raw_transaction)
    
#     return w3_executor.to_hex(tx_hash)

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
    
    tools = [get_defi_yields, invest_money, check_wallet_balance, check_user_balance]
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        temperature=0.7
    )
    
    prompt = hub.pull("hwchase17/openai-tools-agent")
    
    agent = create_tool_calling_agent(llm, tools, prompt)
    
    _agent_excutor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    return _agent_excutor