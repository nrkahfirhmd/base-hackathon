# Project Roadmap

We have structured our development into 4 strategic phases to transition DeQRypt from a Hackathon MVP to a fully scalable product on the Base Mainnet.

### **Phase 1: The Foundation (Q1 2026 - Current)**
*Focus: MVP Development & Base Sepolia Deployment*
* **Smart Contract Architecture:** Deployed Multi-Asset Lending Pool and Atomic Payment Router on Base Sepolia.
* **AI Agent Core:** Integrated LangChain & Google Gemini for natural language portfolio management.
* **QR Payment System:** Implemented functional "Scan-to-Pay" logic for mUSDC and mIDRX tokens.
* **Hybrid Architecture:** Successfully connected on-chain events with off-chain Python/FastAPI backend.

### **Phase 2: Security & Mainnet Launch (Q2 2026)**
*Focus: Audit, Reliability & Live Deployment*
* **Smart Contract Audit:** Third-party security review of the Lending Pool and Router contracts to prevent reentrancy and liquidity exploits.
* **Base Mainnet Launch:** Migrating infrastructure from Sepolia Testnet to Base Mainnet.
* **Real Protocol Integration:** Replacing Mock Pools with live Aave V3 and Moonwell protocol integrations.
* **AI Guardrails:** Implementing strict spending limits and anomaly detection to prevent Agent hallucinations.

### **Phase 3: Experience & Accessibility (Q3 2026)**
*Focus: User Acquisition & Frictionless Onboarding*
* **Mobile App (PWA):** Launching a Progressive Web App for a native-like mobile scanning experience.
* **Account Abstraction (ERC-4337):** Implementing "Smart Accounts" to allow users to login with Email/Google, removing the need for seed phrases.
* **Fiat On-Ramp:** Partnering with local gateways to enable direct IDR-to-USDC deposits via QRIS.

### **Phase 4: Ecosystem Expansion (Q4 2026)**
*Focus: B2B*
* **DeQRypt API/SDK:** Enabling third-party DApps to integrate our "Pay with DeFi" button.
* **On-Chain Loyalty:** Gamified rewards system using NFTs for frequent users.

---

# Detailed Team Information

We are a multidisciplinary team of 5, combining expertise in Blockchain Architecture, Artificial Intelligence, and User Experience.

### **1. Web3 & Blockchain**
**Name:** David Christian Nathaniel
* **Role:** Smart Contract Engineer & System Architect
* **Responsibilities:**
    * Designed and deployed the **Multi-Asset Lending Pool** and **Payment Router** on Base Sepolia.
    * Managed wallet security, transaction signing logic, and gas optimization.
    * Ensured atomic execution of payment settlements (Swap-to-Pay logic).
* **Tech Stack:** Solidity, Hardhat/Foundry, OpenZeppelin, Base Network.

### **2. Backend & AI Agent Team**
*The brains behind the operation, handling logic, data, and intelligence.*

**Name:** Nurkahfi Amran Rahmada & Danish Rahadian Mirza Effendi
* **Role: AI Agent Architect**
* **Responsibilities:**
    * Developed the **LangChain** reasoning engine and prompt engineering for the financial assistant.
    * Integrated Google Gemini to interpret natural language intents (e.g., *"Invest my idle ETH"*).
    * Built the "Consultant Mode" logic to prevent the AI from executing unsafe transactions.
* **Tech Stack:** Python, LangChain, Google Gemini API, Vector DB.
* **Role: Backend Infrastructure Engineer**
* **Responsibilities:**
    * Built the high-performance **FastAPI** server and robust error handling (solving "silent failures").
    * Implemented the **Realtime Token Rate** caching system to handle rate limits.
    * Managed the Supabase database integration for transaction history and user indexing.
* **Tech Stack:** Python, FastAPI, Docker, Supabase (PostgreSQL).

### **3. Frontend & UX Team**
*The bridge between complex code and the user.*

**Name:** Dzikri Bassyril & Muhammad Luthfi Aziz
* **Role: Frontend Engineer**
* **Responsibilities:**
    * Developed the core **Next.js** application and responsive layout.
    * Integrated **RainbowKit** and **Wagmi** for seamless wallet connections.
    * Handled the complex state management between the Chat Interface (AI) and Wallet Actions.
* **Tech Stack:** Next.js, TypeScript, Wagmi, Viem.
* **Role: UI/UX & Mobile Specialist**
* **Responsibilities:**
    * Designed the "Scan-to-Pay" user journey and QR Code generation/scanning logic.
    * Created the intuitive Dashboard visualization for Portfolio and Yield tracking.
    * Optimized the mobile view to ensure a native app-like feel in the browser.
* **Tech Stack:** Tailwind CSS, React-QR-Reader, Framer Motion, Figma.

---

### **Why We Are the Right Team**
We are a team of students and engineers passionate about making crypto usable for daily life. We believe that **Base** has the speed and low cost required for payments, but the UX of DeFi is still too hard. We built **DeQRypt** to prove that AI can handle the complexity, letting users simply "Scan and Earn."