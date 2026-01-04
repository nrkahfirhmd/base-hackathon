from fastapi import APIRouter, status, HTTPException

from schemas import RateRequest, RateResponse
from schemas import InfoRequest, InfoResponse, InfoProfile

from services import convert_idr_to_usdc, get_usdc_rate
from services import get_address_info, upsert_info_data

router = APIRouter(prefix="/api", tags=["core"])

@router.post("/rates", response_model=RateResponse, status_code=status.HTTP_200_OK)
def get_rates(req: RateRequest):
    amount_idr = req.amount_idr
    rate = get_usdc_rate()
    amount_usdc = convert_idr_to_usdc(amount_idr)
    
    return RateResponse(
        rate_idr_usdc=rate,
        amount_idr=amount_idr,
        amount_usdc=amount_usdc
    )

@router.post("/info", response_model=InfoResponse, status_code=status.HTTP_200_OK)
def get_wallet_info(req: InfoRequest):
    data = get_address_info(req.address)
    
    if len(data) > 0: 
        return data[0]
    else:
        return {
            "wallet_address": req.address,
            "name": "Unknown",
            "is_verified": False,
            "description": "Belum terdaftar di DeQRypt"
        }
        
@router.post("/info/add", status_code=status.HTTP_201_CREATED)
def add_info(profile: InfoProfile):
    try:
        data = upsert_info_data(profile)
        
        return {"status": "success", "message": "Profile updated", "data": data}
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))