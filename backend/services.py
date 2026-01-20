import requests
from database import supabase
from schemas import InfoProfile

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