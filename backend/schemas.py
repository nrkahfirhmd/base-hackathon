from pydantic import BaseModel, Field
from typing import Optional

class InfoProfile(BaseModel):
    wallet_address: str
    name: str
    description: str = None
    
class VerificationRequest(BaseModel):
    wallet_address: str

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
    
class DepositRequest(BaseModel):
    protocol: str  
    amount: float 

class WithdrawRequest(BaseModel):
    protocol: str
    amount: str = "all" 

class TransactionResponse(BaseModel):
    status: str
    tx_hash: str
    explorer_url: str
    message: str
    ai_analysis: str

class ProtocolData(BaseModel):
    apy: float
    contract_address: str
    token_name: str

class YieldResponse(BaseModel):
    moonwell: Optional[ProtocolData]
    aave: Optional[ProtocolData]

class WalletResponse(BaseModel):
    address: str
    eth_balance: float
    simulated_position_moonwell: float
    simulated_position_aave: float

class VerificationRequest(BaseModel):
    wallet_address: str