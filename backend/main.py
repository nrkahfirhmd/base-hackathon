from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import router

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