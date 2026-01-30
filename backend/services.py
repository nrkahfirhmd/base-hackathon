import requests
from decimal import getcontext
from web3 import Web3
import base64
from fastapi import UploadFile
from database import supabase
from config import settings
from agent import _fetch_live_apy_logic, _ai_recommend_protocol, _calculate_profit, _pool, _erc20, _from_units, _get_days_from_now

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

def get_user_lending_postions() -> str:
    response = supabase.table("user_lending_positions").select("*").execute()
    
    return response.data

def verify_info(address: str) -> str:
    response =  supabase.table("infos").update({"is_verified": True}).eq("wallet_address", address).execute()
    
    return response.data

async def upsert_info_data(wallet: str, name: str, desc: str, image_file: UploadFile) -> dict:
    image_url = None
    
    if image_file:
        try:
            file_content = await image_file.read()

            encoded_image = base64.b64encode(file_content).decode("utf-8")

            imgbb_api = "https://api.imgbb.com/1/upload"
            payload = {
                "key": settings.IMAGE_API_KEY,
                "image": encoded_image
            }

            resp = requests.post(imgbb_api, data=payload, timeout=10)
            resp.raise_for_status()

            result = resp.json()
            image_url = result["data"]["url"]

        except Exception as e:
            raise RuntimeError(f"Gagal upload ke ImgBB: {str(e)}")
    
    data = {
        "wallet_address": wallet,
        "name": name,
        "description": desc
    }
    
    if image_url:
        data["image_url"] = image_url
    try:
        response = supabase.table("infos").upsert(data).execute()
        if not response.data:
            data["is_verified"] = False
            return data
        return response.data[0]
    except Exception as e:
        raise RuntimeError(f"Supabase error: {str(e)}")

w3_lending = Web3(Web3.HTTPProvider(settings.RPC_URL))

def get_lending_projects():
    """Return daftar project Base dari DefiLlama yang lolos filter trusted."""
    pools = _fetch_live_apy_logic()
    return pools or []

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
    Include id untuk setiap position.
    """
    response = supabase.table("user_lending_positions").select("*").eq("wallet_address", wallet).execute()
    positions_data = response.data or []
    
    positions = []
    total_deposited = 0
    total_current_profit = 0
    
    for pos in positions_data:
        pos_id = pos.get("id")
        principal = pos.get("amount", 0)
        if principal is None or principal <= 0:
            continue
        apy = pos.get("apy", 0)
        deposited_at = pos.get("deposited_at", "")
        
        days_held = _get_days_from_now(deposited_at)
        current_profit = _calculate_profit(principal, apy, days_held)
        profit_pct = (current_profit / principal * 100) if principal > 0 else 0
        
        total_deposited += principal
        total_current_profit += current_profit
        
        positions.append({
            "id": pos_id,
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
    
def log_transaction(sender: str, receiver: str, amount: float, token: str, tx_hash: str):
    """
    Mencatat transaksi Transfer/Payment ke database.
    """
    import datetime
    import random
    try:
        now = datetime.datetime.now()
        date_str = now.strftime('%Y%m%d')
        rand_part = random.randint(1000, 9999)
        invoice_number = f"INV-{date_str}{rand_part}"

        data = {
            "from_address": sender,
            "to_address": receiver,
            "amount": amount,
            "token_symbol": token,
            "tx_hash": tx_hash,
            "status": "SUCCESS",
            "invoice_number": invoice_number,
            "created_at": now.isoformat(),
            "gas_fee": 0  
        }
        response = supabase.table("transactions").insert(data).execute()
        print(f"Transaction Logged: {amount} {token} from {sender} to {receiver}")
        if response.data and len(response.data) > 0:
            return response.data[0]
        return data
    except Exception as e:
        print(f"Failed to log transaction: {e}")
        raise

def get_main_history(wallet: str):
    """
    Mengambil semua transaksi di mana user adalah PENGIRIM atau PENERIMA.
    """
    response = supabase.table("transactions")\
        .select("*")\
        .or_(f"from_address.eq.{wallet},to_address.eq.{wallet}")\
        .order("created_at", desc=True)\
        .execute()
    
    return response.data