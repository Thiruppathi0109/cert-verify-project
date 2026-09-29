import React, { useState } from "react";
import { connectWallet } from "../web3Config";

export default function ConnectWallet() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async () => {
    try {
      const acc = await connectWallet();
      setAddress(acc);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      {address ? (
        <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
      ) : (
        <button onClick={handleConnect}>Connect MetaMask</button>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
