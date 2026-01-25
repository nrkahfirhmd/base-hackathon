from fastapi import APIRouter, status, HTTPException, BackgroundTasks

from schemas import RateResponse, VerificationRequest
from schemas import InfoRequest, InfoResponse, InfoProfile
from schemas import DepositRequest, TransactionResponse
from schemas import (
    LendingRecommendRequest,
    LendingRecommendResponse,
    LendingDepositRequest,
    LendingDepositResponse,
    LendingWithdrawRequest,
    LendingWithdrawResponse,
    LendingPositionResponse,
    LendingInfoResponse,
    LendingTxResponse,
    LendingProject,
)

from services import convert_idr_to_usdc, get_usdc_rate
from services import get_address_info, upsert_info_data
from services import verify_info
from services import (
    get_lending_recommendation,
    lending_deposit,
    lending_get_positions_with_profit,
    lending_withdraw,
    get_lending_projects,
)

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
        d = data[0]
        if "image_url" not in d:
            d["image_url"] = None
        return d
    else:
        return {
            "wallet_address": req.address,
            "name": "Unknown",
            "is_verified": False,
            "description": "Belum terdaftar di DeQRypt",
            "image_url": None
        }
        
@router.post("/info/add", status_code=status.HTTP_201_CREATED)
def add_info(profile: InfoProfile):
    try:
        data = upsert_info_data(profile)
        if "image_url" not in data:
            data["image_url"] = None
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

@router.post("/lending/recommend", response_model=LendingRecommendResponse)
def recommend_lending(req: LendingRecommendRequest):
    try:
        data = get_lending_recommendation(req.amount, req.token)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/lending/project", response_model=list[LendingProject])
def lending_project_list():
    try:
        return get_lending_projects()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/lending/deposit", response_model=LendingDepositResponse)
def lending_deposit_endpoint(req: LendingDepositRequest):
    try:
        data = lending_deposit(req.protocol, req.amount, req.token)
        return {
            "status": "submitted",
            "protocol": req.protocol,
            "amount": req.amount,
            "tx_hash": data["tx_hash"],
            "explorer_url": data["explorer_url"],
            "message": data["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/lending/info", response_model=LendingInfoResponse)
def lending_info():
    """
    Auto-detect wallet dari settings, return semua posisi dengan profit calculation.
    """
    try:
        from config import settings
        wallet = settings.MY_WALLET
        return lending_get_positions_with_profit(wallet)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/lending/withdraw", response_model=LendingWithdrawResponse)
def lending_withdraw_endpoint(req: LendingWithdrawRequest):
    try:
        data = lending_withdraw(req.id, req.amount, req.token)
        return {
            "status": "submitted",
            "protocol": data.get("protocol", ""),
            "tx_hash": data["tx_hash"],
            "explorer_url": data["explorer_url"],
            "withdraw_time": data.get("withdraw_time", ""),
            "principal": data.get("principal", 0),
            "current_profit": data.get("profit", 0),
            "current_profit_pct": data.get("profit_pct", 0),
            "withdrawn": data.get("withdrawn", 0),
            "total_received": data.get("profit", 0) + data.get("withdrawn", 0),
            "remaining_amount": data.get("remaining_amount", 0),
            "message": data["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))