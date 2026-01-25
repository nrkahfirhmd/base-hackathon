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

class LendingRecommendRequest(BaseModel):
    amount: float
    token: str = Field(default="eth", description="eth|auto")

class LendingRecommendResponse(BaseModel):
    protocol: str
    token: str
    apy: float
    reason: str
    is_safe: bool
    amount: float
    profit_2months: float
    profit_6months: float
    profit_1year: float

class LendingDepositRequest(BaseModel):
    protocol: str
    token: str = "eth"
    amount: float

class LendingDepositResponse(BaseModel):
    status: str
    protocol: str
    amount: float
    tx_hash: str
    explorer_url: str
    message: str

class LendingWithdrawRequest(BaseModel):
    id: int
    token: str = "eth"
    amount: float = Field(..., description="Amount in LP units; use -1 for all from this position")

class LendingPositionResponse(BaseModel):
    wallet_address: str
    positions: list
    total_deposited: float
    total_lp_balance: float

class LendingPositionDetail(BaseModel):
    id: int
    protocol: str
    amount_deposited: float
    apy: float
    deposited_at: str
    days_held: int
    current_profit: float
    current_profit_pct: float

class LendingInfoResponse(BaseModel):
    wallet_address: str
    positions: list 
    total_deposited: float
    total_current_profit: float

class LendingTxResponse(BaseModel):
    status: str
    tx_hash: str
    explorer_url: str
    message: str

class LendingWithdrawResponse(BaseModel):
    status: str
    protocol: str
    tx_hash: str
    explorer_url: str
    withdraw_time: str
    principal: float
    current_profit: float
    current_profit_pct: float
    total_received: float
    message: str


class LendingProject(BaseModel):
    protocol: str
    apy: float
    tvl: float
    symbol: str
    pool_id: str