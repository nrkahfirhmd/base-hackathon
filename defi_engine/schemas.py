from pydantic import BaseModel
from typing import Optional, Dict

# Request Models 
class DepositRequest(BaseModel):
    protocol: str  # "moonwell" atau "aave"
    amount: float  # Jumlah dalam ETH

class WithdrawRequest(BaseModel):
    protocol: str
    amount: str = "all" # Default withdraw all

# Response Models 
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
    simulated_position_moonwell: float # Saldo pura-pura di protokol
    simulated_position_aave: float
