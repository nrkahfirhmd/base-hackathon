from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router
from services import log_transaction

app = FastAPI(title="DeQRypt Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)

@app.get("/")
def sanity_check():
    return {"status": "running", "service": "DeQRypt Backend"}

@app.post("/api/history/add") # Tambahkan /add di sini
async def create_history(payload: dict):
    data = log_transaction(
        sender=payload['sender'],
        receiver=payload['receiver'],
        amount=payload['amount'],
        token=payload['token'],
        tx_hash=payload['tx_hash']
    )
    # Kembalikan data lengkap termasuk gas_fee
    return {"status": "success", "data": data}