from fastapi import APIRouter, status, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi import Form, UploadFile, File
from config import settings

from schemas import RateResponse, VerificationRequest
from schemas import InfoRequest, InfoResponse
from schemas import AddHistoryRequest, AddHistoryResponse
from schemas import ViewHistoryRequest, TokenRateRequest
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
    get_dynamic_market_rates
)
from services import verify_info, get_main_history, log_transaction

from agent import get_agent_executor, lending_withdraw, lending_deposit, _fetch_live_apy_logic

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
    """
    Endpoint Hybrid:
    1. Jika req.tx_hash ADA -> Mode RECORD (Hanya simpan data transaksi dari Frontend ke DB).
    2. Jika req.tx_hash KOSONG -> Mode EXECUTE (Backend yang melakukan transaksi on-chain).
    """
    if req.tx_hash:
        print(f"Recording Client-Side Deposit: {req.tx_hash}")
        from datetime import datetime
        
        try:
            token_symbol = req.token.upper()
            if token_symbol in ["USDC", "MUSDC"]: token_symbol = "mUSDC"
            elif token_symbol in ["IDRX", "MIDRX"]: token_symbol = "mIDRX"
            elif token_symbol in ["ETH", "WETH"]: token_symbol = "WETH"
            
            proto_key = req.protocol.lower() if req.protocol.lower() != "auto" else "moonwell"
            
            yields = _fetch_live_apy_logic()
            pool_info = next((p for p in yields if p["protocol"] == proto_key), None)
            current_apy = pool_info.get("apy", 5.0) if pool_info else 5.0
            
            deposited_time = datetime.now().isoformat()
            
            insert_resp = supabase.table("user_lending_positions").insert({
                "wallet_address": req.wallet_address,
                "protocol": proto_key,
                "amount": req.amount,
                "lp_shares": req.amount,
                "apy": current_apy,
                "token_symbol": token_symbol,
                "deposited_at": deposited_time
            }).execute()

            if getattr(insert_resp, "error", None):
                raise RuntimeError(f"Failed to insert position: {insert_resp.error}")
            
            explorer_url = f"{settings.EXPLORER_BASE}{req.tx_hash}"
            
            return {
                "status": "success",
                "protocol": proto_key,
                "amount": req.amount,
                "tx_hash": req.tx_hash,
                "explorer_url": explorer_url,
                "message": f"Deposit recorded successfully"
            }
            
        except Exception as e:
            print(f"❌ Record Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to record deposit: {str(e)}")
    else:
        if req.protocol.lower() != "auto":
            print(f"Direct Backend Execution to {req.protocol}...")
            try:
                result = lending_deposit.invoke({
                    "protocol": req.protocol,
                    "amount": req.amount,
                    "token": req.token,
                    "wallet_address": req.wallet_address
                })

                return {
                    "status": "success",
                    "protocol": req.protocol,
                    "amount": req.amount,
                    "tx_hash": result.get("tx_hash", "-"),
                    "explorer_url": result.get("explorer_url", ""),
                    "message": result.get("message", "Deposit executed successfully")
                }
            except Exception as e:
                print(f"Direct Deposit Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Deposit Failed: {str(e)}")
        else:
            print(f"Auto-Deposit (Backend Logic) Started...")
            try:
                yields = _fetch_live_apy_logic()
                supported_protocols = ["moonwell", "aave-v3", "aave"]
                valid_pools = [p for p in yields if p['protocol'] in supported_protocols]

                if not valid_pools:
                    best_protocol = "moonwell"
                    best_apy = 5.0
                else:
                    best_pool = max(valid_pools, key=lambda x: x['apy'])
                    best_protocol = best_pool['protocol']
                    if "aave" in best_protocol: best_protocol = "aave"
                    best_apy = best_pool['apy']

                print(f"Auto Selected: {best_protocol} ({best_apy}%)")

                deposit_result = lending_deposit.invoke({
                    "protocol": best_protocol,
                    "amount": req.amount,
                    "token": req.token,
                    "wallet_address": req.wallet_address
                })

                custom_message = (
                    f"AI Optimization Complete!\n"
                    f"Saya memilih {best_protocol.title()} karena APY tertinggi ({best_apy}%).\n"
                    f"Dana berhasil didepositkan."
                )

                return {
                    "status": "success",
                    "protocol": best_protocol,
                    "amount": req.amount,
                    "tx_hash": deposit_result.get("tx_hash", "-"),
                    "explorer_url": deposit_result.get("explorer_url", ""),
                    "message": custom_message
                }
            except Exception as e:
                print(f"Auto-Deposit Error: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Auto-Deposit Failed: {str(e)}")

from fastapi import Body

class LendingInfoRequest(BaseModel):
    wallet: str

@router.post("/lending/info", response_model=LendingInfoResponse)
def lending_info(req: LendingInfoRequest = Body(...)):
    """
    User menginput address wallet, backend return semua posisi dengan profit calculation.
    """
    try:
        return lending_get_positions_with_profit(req.wallet)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/lending/withdraw", response_model=LendingWithdrawResponse)
def lending_withdraw_endpoint(req: LendingWithdrawRequest):
    """
    Endpoint untuk merekam data withdraw lending.
    Transaksi withdraw sudah dilakukan di client-side, backend hanya update record.
    """
    from datetime import datetime
    from database import supabase
    
    try:
        # Validasi tx_hash harus ada (transaksi sudah dilakukan di client)
        if not req.tx_hash:
            raise HTTPException(
                status_code=400, 
                detail="tx_hash is required. Withdraw harus dilakukan di client-side terlebih dahulu."
            )
        
        # Get position from database
        response = supabase.table("user_lending_positions").select(
            "*").eq("id", req.id).execute()
        position_data = response.data
        
        if not position_data:
            raise HTTPException(status_code=404, detail=f"No position found with ID {req.id}")
        
        position = position_data[0]
        protocol = position.get("protocol", "")
        principal_amount = position.get("amount", 0)
        apy = position.get("apy", 0)
        deposited_at = position.get("deposited_at", "")
        token_symbol = position.get("token_symbol", req.token)
        
        # Calculate profit
        def get_days_from_now(deposited_at_str: str) -> int:
            if not deposited_at_str:
                return 0
            try:
                deposited_time = datetime.fromisoformat(deposited_at_str.replace("Z", "+00:00"))
                now = datetime.now(deposited_time.tzinfo) if deposited_time.tzinfo else datetime.now()
                return max(0, (now - deposited_time).days)
            except:
                return 0
        
        def calculate_profit(amount: float, apy: float, days: int) -> float:
            if amount <= 0 or apy <= 0 or days <= 0:
                return 0
            return amount * (apy / 100) * (days / 365)
        
        days_held = get_days_from_now(deposited_at)
        
        # Handle full withdraw (amount = -1) or partial
        withdraw_amount = principal_amount if req.amount < 0 else min(req.amount, principal_amount)
        remaining_amount = principal_amount - withdraw_amount
        
        profit_withdrawn = calculate_profit(withdraw_amount, apy, days_held)
        profit_pct = (profit_withdrawn / withdraw_amount * 100) if withdraw_amount > 0 else 0
        
        # Update or delete position in database
        if remaining_amount <= 0 or abs(remaining_amount) < 1e-12:
            # Full withdraw - delete position
            supabase.table("user_lending_positions").delete().eq("id", req.id).execute()
            remaining_amount = 0
        else:
            # Partial withdraw - update position
            supabase.table("user_lending_positions").update({
                "amount": remaining_amount,
                "lp_shares": remaining_amount
            }).eq("id", req.id).execute()
        
        withdraw_time = datetime.now().isoformat()
        explorer_url = f"{settings.EXPLORER_BASE}{req.tx_hash}"
        
        return {
            "status": "success",
            "protocol": protocol,
            "tx_hash": req.tx_hash,
            "explorer_url": explorer_url,
            "withdraw_time": withdraw_time,
            "principal": principal_amount,
            "current_profit": round(profit_withdrawn, 8),
            "current_profit_pct": round(profit_pct, 2),
            "withdrawn": withdraw_amount,
            "total_received": round(withdraw_amount + profit_withdrawn, 6),
            "remaining_amount": max(0, remaining_amount),
            "message": f"Withdraw {withdraw_amount} {token_symbol} from {protocol} recorded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Withdraw Record Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record withdraw: {str(e)}")

    
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
    
@router.post("/tokens/rates")
def get_token_prices(req: TokenRateRequest):
    """
    Get realtime crypto prices (ETH, USDC, IDRX).
    Cached for 60 seconds to prevent rate limiting.
    """
    try:
        data = get_dynamic_market_rates(req.symbols)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))