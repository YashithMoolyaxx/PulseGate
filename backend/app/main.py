from fastapi import FastAPI

app = FastAPI(title="PulseGate API Gateway")

@app.get("/")
def read_root():
    return {"message": "PulseGate Gateway is live!"}

@app.get("/v1/health")
def health_check():
    return {"status": "healthy"}