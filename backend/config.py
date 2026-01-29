import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    LENDING_POOL_ADDRESS_MIDRX: str = os.getenv("LENDING_POOL_ADDRESS_MIDRX")
    LENDING_POOL_ADDRESS_MUSDC: str = os.getenv("LENDING_POOL_ADDRESS_MUSDC")
    LENDING_POOL_ADDRESS_ETH: str = os.getenv("LENDING_POOL_ADDRESS_ETH")
    PROJECT_NAME: str = "DeFi Yield Bot API"
    VERSION: str = "1.0.0"
    
    RPC_URL: str = os.getenv("RPC_URL")
    PRIVATE_KEY: str = os.getenv("PRIVATE_KEY")
    MY_WALLET: str = os.getenv("MY_WALLET")
    
    # Base Sepolia Chain ID
    CHAIN_ID: int = 84532 
    
    # Real Protocol Addresses on Base Sepolia
    # Format: {protocol_name: {address, abi_type}}
    PROTOCOL_ADDRESSES = {
        "moonwell": {
            "address": "0x2B5AD5c4235B9B8E0c62fC0cceA47D45460beF60",  # Moonwell Base Sepolia
            "type": "compound_v2"
        },
        "aave-v3": {
            "address": "0x6C0F737913fDc38a36953cAb80CED42f3CF60dE7",  # Aave V3 Pool on Base Sepolia
            "type": "aave_v3"
        },
        "compound-v3": {
            "address": "0x6e8a1ed0A2C8Fa13aEd25fCa5E3A1b4b4b4b4b4b",  # Placeholder (check actual)
            "type": "compound_v3"
        },
        "spark": {
            "address": "0x0000000000000000000000000000000000000000",  # Placeholder (if on Base)
            "type": "spark"
        }
    }

    WETH_ADDRESS: str = os.getenv("WETH_ADDRESS", "0x4200000000000000000000000000000000000006")
    LENDING_POOL_ADDRESS: str = os.getenv("LENDING_POOL_ADDRESS")
    UNDERLYING_TOKEN_ADDRESS: str = os.getenv("UNDERLYING_TOKEN_ADDRESS", WETH_ADDRESS)
    LP_TOKEN_ADDRESS: str = os.getenv("LP_TOKEN_ADDRESS")
    UNDERLYING_DECIMALS: int = int(os.getenv("UNDERLYING_DECIMALS", "18"))
    LP_DECIMALS: int = int(os.getenv("LP_DECIMALS", "18"))
    EXPLORER_BASE: str = os.getenv("EXPLORER_BASE", "https://sepolia.basescan.org/tx/")
    
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY")
    
    IDRX_ADDRESS: str = os.getenv("MOCK_IDRX_ADDRESS")
    USDC_ADDRESS: str = os.getenv("MOCK_USDC_ADDRESS")
    
    IMAGE_API_KEY: str = os.getenv("IMAGE_API_KEY")

settings = Settings()