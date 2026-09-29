import json
import hashlib
import os
from web3 import Web3
from config import Config

# Load contract ABI (copy this file from blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json after compiling)
ABI_PATH = os.path.join(os.path.dirname(__file__), "contract_abi.json")


def get_web3():
    w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))
    if not w3.is_connected():
        raise ConnectionError("Could not connect to blockchain RPC. Check RPC_URL in .env")
    return w3


def get_contract():
    w3 = get_web3()
    with open(ABI_PATH, "r") as f:
        abi = json.load(f)
        # If you copied the full Hardhat artifact JSON, the ABI is under the "abi" key
        if isinstance(abi, dict) and "abi" in abi:
            abi = abi["abi"]
    contract = w3.eth.contract(address=Web3.to_checksum_address(Config.CONTRACT_ADDRESS), abi=abi)
    return w3, contract


def hash_certificate_data(student_name: str, course_name: str, extra: str = "") -> str:
    """Create a SHA-256 hash from certificate details (or hash the actual PDF bytes if you store files)."""
    raw = f"{student_name}|{course_name}|{extra}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def hash_file_bytes(file_bytes: bytes) -> str:
    """Use this instead if you're hashing the actual certificate PDF/image file."""
    return hashlib.sha256(file_bytes).hexdigest()


def issue_certificate_on_chain(certificate_id, student_name, course_name, cert_hash):
    w3, contract = get_contract()

    nonce = w3.eth.get_transaction_count(Config.ADMIN_ADDRESS)

    # Estimate the actual gas needed instead of hardcoding a huge limit —
    # this keeps the transaction cost small enough for a small testnet balance.
    estimated_gas = contract.functions.issueCertificate(
        certificate_id, student_name, course_name, cert_hash
    ).estimate_gas({"from": Config.ADMIN_ADDRESS})

    gas_limit = int(estimated_gas * 1.2)  # 20% safety buffer

    txn = contract.functions.issueCertificate(
        certificate_id, student_name, course_name, cert_hash
    ).build_transaction({
        "chainId": w3.eth.chain_id,
        "gas": gas_limit,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce,
    })

    signed_txn = w3.eth.account.sign_transaction(txn, private_key=Config.PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return receipt.transactionHash.hex()


def verify_certificate_on_chain(certificate_id, cert_hash):
    w3, contract = get_contract()
    is_valid, student_name, course_name, issue_date = contract.functions.verifyCertificate(
        certificate_id, cert_hash
    ).call()

    return {
        "is_valid": is_valid,
        "student_name": student_name,
        "course_name": course_name,
        "issue_date": issue_date,
    }


def get_certificate_on_chain(certificate_id):
    w3, contract = get_contract()
    student_name, course_name, cert_hash, issue_date, exists = contract.functions.getCertificate(
        certificate_id
    ).call()

    return {
        "exists": exists,
        "student_name": student_name,
        "course_name": course_name,
        "cert_hash": cert_hash,
        "issue_date": issue_date,
    }


def revoke_certificate_on_chain(certificate_id):
    w3, contract = get_contract()

    nonce = w3.eth.get_transaction_count(Config.ADMIN_ADDRESS)

    estimated_gas = contract.functions.revokeCertificate(certificate_id).estimate_gas(
        {"from": Config.ADMIN_ADDRESS}
    )
    gas_limit = int(estimated_gas * 1.2)

    txn = contract.functions.revokeCertificate(certificate_id).build_transaction({
        "chainId": w3.eth.chain_id,
        "gas": gas_limit,
        "gasPrice": w3.eth.gas_price,
        "nonce": nonce,
    })

    signed_txn = w3.eth.account.sign_transaction(txn, private_key=Config.PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return receipt.transactionHash.hex()
