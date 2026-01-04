from pydantic import BaseModel, Field

class InfoProfile(BaseModel):
    wallet_address: str
    name: str
    description: str = None
    
class VerificationRequest(BaseModel):
    wallet_address: str

class RateRequest(BaseModel):
    amount_idr: float = Field(..., gt=0, examples=20000)

class RateResponse(BaseModel):
    rate_idr_usdc: float
    amount_idr: float
    amount_usdc: float
    
class InfoRequest(BaseModel):
    address: str

class InfoResponse(BaseModel):
    wallet_address: str
    name: str
    description: str
    is_verified: bool