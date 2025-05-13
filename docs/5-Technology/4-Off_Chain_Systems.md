## 5.4 Off-Chain Infrastructure

While asset ownership and core value transfer reside on-chain, the dynamic game simulation runs on a robust and secure backend server infrastructure:
*   **Responsibilities:** Handles real-time market data processing (simulation/fetching/caching), pet strategy execution, mood calculations, trade logging, game state management, API services for the frontend, and interaction with smart contracts via event listeners and secure transaction submissions.
*   **Technology:** Utilizes proven technologies like Python*, relational databases (PostgreSQL*), task queues (Celery*), and caching (Redis*) for performance and scalability.
