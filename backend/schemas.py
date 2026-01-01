from pydantic import BaseModel, Field

class RateRequest(BaseModel):
    amount_idr: float = Field(..., gt=0, examples=20000)

class RateResponse(BaseModel):
    rate_idr_usdc: float
    amount_idr: float
    amount_usdc: float