import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # RPC endpoint for the testnet you deployed to (Alchemy / Infura / Polygon Amoy public RPC)
    RPC_URL = os.getenv("RPC_URL", "https://rpc-amoy.polygon.technology")

    # Address of the deployed CertificateVerification contract
    CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")

    # Admin wallet private key (the account that deployed the contract / has issue rights)
    PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")

    # Admin wallet public address
    ADMIN_ADDRESS = os.getenv("ADMIN_ADDRESS", "")

    # DB
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///certificates.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
