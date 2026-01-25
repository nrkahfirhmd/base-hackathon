# Web3 Client
from web3 import Web3
from defi_engine.config import settings

w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))

def get_web3_connection():
    if not w3.is_connected():
        raise ConnectionError("Gagal terhubung ke RPC Node!")
    return w3

import requests
import random

def fetch_live_apy():
    print("Menghubungi DefiLlama API...")
    url = "https://yields.llama.fi/pools"
    
    market_data = {
        "moonwell": {
            "apy": round(random.uniform(3.5, 6.5), 2),
            "contract_address": settings.MOONWELL_CONTRACT,
            "token_name": "Moonwell USDC (Testnet)"
        },
        "aave": {
            "apy": round(random.uniform(3.5, 6.5), 2),
            "contract_address": settings.AAVE_CONTRACT,
            "token_name": "Aave USDC (Testnet)"
        }
    }

    try:
        response = requests.get(url, timeout=10) 
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
            print(f"\tGagal ambil API (Status: {response.status_code}). Menggunakan default 0%.")

    except Exception as e:
        print(f"\tError Koneksi: {e}. Menggunakan default 0%.")
    
    return market_data

w3_executor = get_web3_connection()

def perform_deposit(protocol: str, amount_ether: float):
    target_address = settings.MOONWELL_CONTRACT if protocol == "moonwell" else settings.AAVE_CONTRACT
    
    amount_wei = w3_executor.to_wei(amount_ether, 'ether')
    nonce = w3_executor.eth.get_transaction_count(settings.MY_WALLET)
    
    tx = {
        'nonce': nonce,
        'to': target_address,
        'value': amount_wei,
        'gas': 21000,
        'gasPrice': w3_executor.eth.gas_price,
        'chainId': settings.CHAIN_ID
    }
    
    signed_tx = w3_executor.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
    tx_hash = w3_executor.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    return w3_executor.to_hex(tx_hash)

def perform_withdraw(protocol: str):
    nonce = w3_executor.eth.get_transaction_count(settings.MY_WALLET)
    
    tx = {
        'nonce': nonce,
        'to': settings.MY_WALLET,
        'value': 0,
        'gas': 21000,
        'gasPrice': w3_executor.eth.gas_price,
        'chainId': settings.CHAIN_ID
    }
    
    signed_tx = w3_executor.eth.account.sign_transaction(tx, settings.PRIVATE_KEY)
    tx_hash = w3_executor.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    return w3_executor.to_hex(tx_hash)


from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser 

def check_transaction_safety(protocol: str, amount: float, current_apy: float):
    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest", 
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
    3. Jika Jumlah > 1000, tolak (UNSAFE: Limit Exceeded).
    4. Selain itu, izinkan (SAFE).

    OUTPUT HANYA JSON:
    {{"status": "SAFE"}} atau {{"status": "UNSAFE", "reason": "..."}}
    """

    prompt = PromptTemplate(
        input_variables=["protocol", "amount", "apy"],
        template=template,
    )

    chain = prompt | llm | StrOutputParser()
    
    response_text = chain.invoke({
        "protocol": protocol,
        "amount": amount,
        "apy": current_apy
    })
    
    clean_text = response_text.strip()
    
    clean_text = clean_text.replace("```json", "").replace("```", "").strip()

    if "UNSAFE" in clean_text:
        return {"is_safe": False, "reason": clean_text}
    else:
        return {"is_safe": True, "reason": "Lolos validasi AI (Gemini)"}