from fastapi import APIRouter, status, HTTPException, BackgroundTasks
from fastapi import Form, UploadFile, File
import re
from config import settings

from schemas import RateResponse, VerificationRequest
from schemas import InfoRequest, InfoResponse
from schemas import AddHistoryRequest, AddHistoryResponse
from schemas import ViewHistoryRequest
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
    lending_get_positions_with_profit,
    get_lending_projects,
)
from services import verify_info, get_main_history, log_transaction

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
        if d.get("description") is None:
            d["description"] = ""

        d["image_url"] = d.get("image_url")
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
async def add_info(
    wallet_address: str = Form(...),
    name: str = Form(...),
    description: str = Form(None),
    image: UploadFile = File(None)
):
    try:
        data = await upsert_info_data(wallet_address, name, description, image)
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
            1. Gunakan tool 'check_user_balance' untuk cek saldo 'mIDRX' (atau 'mUSDC') di address {address}.
            2. Jika saldo token tersebut > 0, anggap VALID. Jika 0, INVALID.
            
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
def deposit(req: LendingDepositRequest):
    agent = get_agent_executor()
    
    if req.protocol.lower() == "auto":
        prompt = (
            f"Tugas: Lakukan investasi cerdas.\n"
            f"1. Cek APY terbaru untuk 'moonwell' dan 'aave' menggunakan tool yang tersedia.\n"
            f"2. Bandingkan mana yang lebih tinggi.\n"
            f"3. Panggil tool 'lending_deposit' untuk melakukan deposit sebesar {req.amount} ke protokol pemenang.\n"
            f"   (Catatan: Gunakan token {req.token} untuk transaksi ini).\n" 
            f"4. Validasi keamanan (safety check) sudah otomatis dilakukan oleh tool."
        )
    else:
        prompt = (
            f"Tugas: Deposit ke {req.protocol}.\n"
            f"1. Panggil tool 'lending_deposit' untuk deposit {req.amount} ke '{req.protocol}'.\n"
            f"   (Catatan: Gunakan token {req.token} untuk transaksi ini).\n" 
            f"2. Pastikan transaksi berhasil dan berikan hash transaksinya."
        )

    try:
        print(f"Agent sedang bekerja...")
        
        result = agent.invoke({"input": prompt})
        agent_reply = result["output"]
        
        print(f"Agent selesai: {agent_reply}")
        
        hash_match = re.search(r"0x[a-fA-F0-9]{64}", agent_reply)
        extracted_hash = hash_match.group(0) if hash_match else None
        
        final_protocol = req.protocol
        if req.protocol.lower() == "auto":
            lower_reply = agent_reply.lower()
            if "moonwell" in lower_reply:
                final_protocol = "moonwell"
            elif "aave" in lower_reply:
                final_protocol = "aave"
            else: 
                final_protocol = "auto"
        
        final_explorer_url = ""
        if extracted_hash:
            final_explorer_url = f"{settings.EXPLORER_BASE}{extracted_hash}"

        return {
            "status": "success" if extracted_hash else "failed",
            "protocol": final_protocol,
            "amount": req.amount,
            "tx_hash": extracted_hash if extracted_hash else "Not found in agent output",
            "explorer_url": final_explorer_url,
            "message": agent_reply 
        }

    except Exception as e:
        print(f"Error Agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Agent gagal mengeksekusi: {str(e)}")

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

# @router.post("/lending/withdraw", response_model=LendingWithdrawResponse)
# def lending_withdraw_endpoint(req: LendingWithdrawRequest):
#     try:
#         data = lending_withdraw(req.id, req.amount, req.token)
#         return {
#             "status": "submitted",
#             "protocol": data.get("protocol", ""),
#             "tx_hash": data["tx_hash"],
#             "explorer_url": data["explorer_url"],
#             "withdraw_time": data.get("withdraw_time", ""),
#             "principal": data.get("principal", 0),
#             "current_profit": data.get("profit", 0),
#             "current_profit_pct": data.get("profit_pct", 0),
#             "withdrawn": data.get("withdrawn", 0),
#             "total_received": data.get("profit", 0) + data.get("withdrawn", 0),
#             "remaining_amount": data.get("remaining_amount", 0),
#             "message": data["message"]
#         }
#     except Exception as e:
#         print(f"Error Agent: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Agent gagal mengeksekusi: {str(e)}")
    
@router.post("/history/add", response_model=AddHistoryResponse)
def add_history(req: AddHistoryRequest):
    try:
        tx = log_transaction(
            req.sender, req.receiver, req.amount, req.token, req.tx_hash
        )
        response = {
            "from_address": tx.get("from_address", "-"),
            "to_address": tx.get("to_address", "-"),
            "amount": tx.get("amount", 0),
            "token_symbol": tx.get("token_symbol", "-"),
            "tx_hash": tx.get("tx_hash", "-"),
            "status": tx.get("status", "SUCCESS"),
            "invoice": tx.get("invoice_number", "-"),
            "date": tx.get("created_at", "-"),
            "transfer_method": tx.get("token_symbol", "-"),
            "gas_fee": tx.get("gas_fee", 0),
            "transfer_amount": tx.get("amount", 0),
            "total": (float(tx.get("amount", 0)) + float(tx.get("gas_fee", 0))) if tx.get("amount") is not None and tx.get("gas_fee") is not None else 0
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/history/transactions")
def transaction_history_endpoint(req: ViewHistoryRequest):
    """
    Mengambil list transaksi dan memberi label 'IN' atau 'OUT'.
    """
    try:
        my_wallet = req.wallet
        raw_data = get_main_history(my_wallet)

        formatted_history = []

        for tx in raw_data:
            if tx["from_address"].lower() == my_wallet.lower():
                direction = "OUT"
                counterparty = tx["to_address"]
            else:
                direction = "IN"
                counterparty = tx["from_address"]

            amount = float(tx.get("amount", 0))
            gas_fee = float(tx.get("gas_fee", 0))
            total = amount + gas_fee

            formatted_history.append({
                "id": tx.get("id"),
                "type": direction,
                "amount": amount,
                "token": tx.get("token_symbol", "-"),
                "counterparty": counterparty,
                "tx_hash": tx.get("tx_hash", "-"),
                "explorer": f"{settings.EXPLORER_BASE}{tx.get('tx_hash', '-')}",
                "date": tx.get("created_at", "-"),
                "invoice": tx.get("invoice_number", "-"),
                "transfer_method": tx.get("token_symbol", "-"),
                "gas_fee": gas_fee,
                "transfer_amount": amount,
                "total": total
            })

        return {"status": "success", "data": formatted_history}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))