from fastapi import APIRouter, HTTPException
from .schemas import DepositRequest, TransactionResponse
from .services import perform_deposit, fetch_live_apy, check_transaction_safety 

router = APIRouter()

@router.post("/deposit", response_model=TransactionResponse)
def deposit(request: DepositRequest):
    
    market_data = fetch_live_apy()
    target_protocol = request.protocol.lower() 
    
    if target_protocol == "auto":
        print("\tMode Auto: Mencari yield tertinggi...")
        
        moonwell_apy = market_data.get('moonwell', {}).get('apy', 0)
        aave_apy = market_data.get('aave', {}).get('apy', 0)
        
        print(f"\tBanding: Moonwell ({moonwell_apy}%) vs Aave ({aave_apy}%)")
        
        if moonwell_apy >= aave_apy:
            target_protocol = "moonwell"
            print("\tPemenang: Moonwell")
        else:
            target_protocol = "aave"
            print("\tPemenang: Aave")
            
    current_apy = 0
    if target_protocol in market_data:
        current_apy = market_data[target_protocol]['apy']

    print(f"\tAI sedang menganalisis risiko transaksi ke {target_protocol}...")
    
    risk_analysis = check_transaction_safety(
        protocol=target_protocol,
        amount=request.amount, 
        current_apy=current_apy
    )

    if not risk_analysis['is_safe']:
        print(f"\tDIBLOKIR AI: {risk_analysis['reason']}")
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "Transaksi Ditolak AI",
                "ai_reason": risk_analysis['reason']
            }
        )
    
    print(f"\tAI Menyetujui. Melanjutkan Deposit ke {target_protocol}...")
    try:
        tx_hash = perform_deposit(target_protocol, request.amount)
        
        return {
            "status": "success",
            "tx_hash": tx_hash,
            "explorer_url": f"https://sepolia.basescan.org/tx/{tx_hash}",
            "message": f"Deposit Berhasil ke {target_protocol} (Auto-Selected)",
            "ai_analysis": risk_analysis['reason']
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
