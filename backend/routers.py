from fastapi import APIRouter, status, HTTPException, BackgroundTasks

from schemas import RateResponse, VerificationRequest
from schemas import InfoRequest, InfoResponse, InfoProfile
from schemas import DepositRequest, TransactionResponse

from services import convert_idr_to_usdc, get_usdc_rate
from services import get_address_info, upsert_info_data
from services import verify_info

from agent import get_agent_executor

router = APIRouter(prefix="/api", tags=["core"])

@router.get("/rates/{amount_idr}", response_model=RateResponse, status_code=status.HTTP_200_OK)
def get_rates(amount_idr: float):
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
    
@router.post("/info/verify", status_code=status.HTTP_202_ACCEPTED)
def verify_merchant(req: VerificationRequest, background_tasks: BackgroundTasks):
    def run_ai_verification(address: str):
        print(f"Agent checking verification for {address}...")
        try:
            agent = get_agent_executor()
            
            prompt = f"""
            Tugas: Verifikasi merchant dengan address {address}.
            Langkah:
            1. Gunakan tool 'check_user_balance' untuk cek saldo ETH di address {address}.
            2. Jika saldo > 0, anggap VALID. Jika 0, INVALID.
            
            Jawab HANYA satu kata: "VALID" atau "INVALID".
            """
            
            result = agent.invoke({"input": prompt})
            output_text = result["output"].strip().upper()
            print(f"Agent Verdict: {output_text}")
            
            if "INVALID" in output_text:
                print("INVALID")
            elif "VALID" in output_text:
                verify_info(address=address)
                print("Database updated: Verified = True")
            else: 
                print("Output Undefined")
        except Exception as e:
            print(f"AI Verification Error: {e}")

    background_tasks.add_task(run_ai_verification, req.wallet_address)

    return {"status": "pending", "message": "AI sedang memverifikasi wallet Anda..."}

@router.post("/deposit", response_model=TransactionResponse)
def deposit(request: DepositRequest):
    print(f"Incoming Deposit Request: {request.amount} ETH to {request.protocol}")
    
    agent = get_agent_executor()
    
    if request.protocol.lower() == "auto":
        prompt = (
            f"Tolong cek APY terbaru untuk protokol Moonwell dan Aave. "
            f"Bandingkan keduanya, pilih yang APY-nya paling tinggi. "
            f"Lalu, lakukan deposit sebesar {request.amount} ETH ke protokol pemenang tersebut. "
            f"Jangan lupa validasi keamanan (safety check) sebelum eksekusi."
        )
    else:
        prompt = (
            f"Tolong lakukan deposit sebesar {request.amount} ETH ke protokol {request.protocol}. "
            f"Cek dulu APY-nya saat ini dan pastikan transaksinya aman menurut standar security check kamu."
        )
    
    try:
        print(f"Agent sedang bekerja...")

        result = agent.invoke({"input": prompt})

        agent_reply = result["output"]
        print(f"Agent selesai: {agent_reply}")

        return {
            "status": "processed",
            "message": agent_reply,
            "original_request": {
                "amount": request.amount,
                "protocol": request.protocol
            }
        }
    except Exception as e:
        print(f"Error Agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent gagal mengeksekusi: {str(e)}")