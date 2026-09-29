import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import IssueCertificate from "./components/IssueCertificate";
import VerifyCertificate from "./components/VerifyCertificate";

export default function App() {
  const [address, setAddress] = useState("");
  const [blockNumber, setBlockNumber] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install it.");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
    } catch (err) {
      // user rejected or MetaMask error — stay disconnected
    } finally {
      setConnecting(false);
    }
  };

  // Poll the live block number once connected, terminal-style.
  useEffect(() => {
    if (!address || !window.ethereum) return;
    const provider = new BrowserProvider(window.ethereum);
    let cancelled = false;

    const poll = async () => {
      try {
        const bn = await provider.getBlockNumber();
        if (!cancelled) setBlockNumber(bn);
      } catch {
        // ignore transient RPC errors
      }
    };

    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [address]);

  const shortAddr = (a) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-brand">
          <span className="hdr-brand-mark">
            CERT<span>CHAIN</span>
          </span>
          <span className="hdr-brand-sub">CREDENTIAL TERMINAL</span>
        </div>

        <div className="hdr-status">
          <span>
            <span className="dot" />
            POLYGON AMOY
          </span>

          {blockNumber !== null && (
            <span className="hdr-block">
              BLOCK <b>#{blockNumber.toLocaleString()}</b>
            </span>
          )}

          {address ? (
            <span className="wallet-pill">
              <span className="dot" />
              {shortAddr(address)}
            </span>
          ) : (
            <button className="btn-connect" onClick={connect} disabled={connecting}>
              {connecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          )}
        </div>
      </header>

      <div className="ticker">
        <div className="ticker-track">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <React.Fragment key={i}>
                <span>
                  <b>ON-CHAIN</b> CREDENTIAL ISSUANCE
                </span>
                <span>SHA-256 HASHED · TAMPER-EVIDENT</span>
                <span>
                  <b>IMMUTABLE</b> ONCE ISSUED
                </span>
                <span>VERIFIABLE BY ANYONE, ANYWHERE</span>
                <span>NO CENTRAL AUTHORITY REQUIRED</span>
              </React.Fragment>
            ))}
        </div>
      </div>

      <div className="grid">
        <IssueCertificate />
        <VerifyCertificate />
      </div>

      <div className="foot-note">
        <span>CertChain · student credential registry</span>
        <span>Testnet build — not for production use</span>
      </div>
    </div>
  );
}
