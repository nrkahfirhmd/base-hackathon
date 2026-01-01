from fastapi import APIRouter, status
from schemas import RateRequest, RateResponse
from services import convert_idr_to_usdc, get_usdc_rate

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
