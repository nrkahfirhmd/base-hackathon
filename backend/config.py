import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "DeFi Yield Bot API"
    VERSION: str = "1.0.0"
    
    RPC_URL: str = os.getenv("RPC_URL")
    PRIVATE_KEY: str = os.getenv("PRIVATE_KEY")
    MY_WALLET: str = os.getenv("MY_WALLET")
    
    # Base Sepolia Chain ID
    CHAIN_ID: int = 84532 
    
    # Dead address buat simulasi
    DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD"
    
    MOONWELL_CONTRACT = DEAD_ADDRESS
    AAVE_CONTRACT = DEAD_ADDRESS
    
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY")
    # Untuk simulasi withdraw, kirim 0 ETH ke diri sendiri

settings = Settings()