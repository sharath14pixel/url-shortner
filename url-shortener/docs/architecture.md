# System Architecture & Technical Specifications

This document details the architecture, request lifecycles, and sequence flows for the **Base62 URL Shortener Service**.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    A[React Frontend] -->|REST API / JSON| B[Load Balancer]
    B --> C[Express Backend]
    C -->|Rate Limiter| C
    C -->|URL Validator / Anomaly Check| C
    C -->|Cache Lookup| D[(Redis Cache)]
    C -->|DB Read/Write| E[(MongoDB Atlas)]
    D -->|Cache Miss| E
    E -->|Populate Cache| D
```

---

## 2. Sequence Diagram: Redirect Path (`GET /:shortCode`)

The redirect path is optimized for extreme throughput using an in-memory Redis cache layer. The database increment is executed asynchronously to avoid blocking the HTTP 301 response.

```mermaid
sequenceDiagram
    participant U as User / Client
    participant S as Backend Express Server
    participant R as Redis Cache
    participant M as MongoDB Atlas

    U->>S: GET /:shortCode
    S->>R: GET shortCode (Check Cache)
    alt Cache Hit
        R-->>S: Return originalUrl
    else Cache Miss
        S->>M: Query Url.findOne({ shortCode })
        M-->>S: Return urlDoc { originalUrl }
        S->>R: SET shortCode originalUrl (TTL 24h)
    end
    S-->>U: HTTP 301 Redirect to originalUrl
    S->>M: Url.updateOne({ shortCode }, { $inc: { clicks: 1 } }) (Async)
```

---

## 3. Sequence Diagram: Link Creation Path (`POST /api/shorten`)

When shortening a new URL, the backend validates the URL scheme, runs an anomaly check, generates a Base62 random short code, handles collision retries, and writes to both MongoDB and Redis simultaneously (write-through cache).

```mermaid
sequenceDiagram
    participant U as User / Client
    participant S as Backend Express Server
    participant M as MongoDB Atlas
    participant R as Redis Cache

    U->>S: POST /api/shorten { originalUrl }
    S->>S: Check Rate Limit (express-rate-limit)
    S->>S: Validate URL & Anomaly Detection
    loop Collision Check Loop
        S->>S: Generate random 7-char Base62 code (crypto.randomInt)
        S->>M: Check if shortCode exists
    end
    S->>M: Save new Url document
    S->>R: SET shortCode originalUrl (Write-Through)
    S-->>U: Return HTTP 201 { shortUrl, shortCode }
```

---

## 4. Architectural Deep Dive & System Design

### A. Base62 Random Generation vs Counter Hash
- **Character Set**: 62 characters (`0-9a-zA-Z`).
- **Code Length**: 7 characters.
- **Keyspace**: $62^7 \approx 3.52 \times 10^{12}$ (over 3.5 trillion unique combinations).
- **Unpredictability**: Using Node's `crypto.randomInt`, short codes are cryptographically unpredictable (unlike sequential auto-incrementing integer IDs which are vulnerable to enumeration attacks).

### B. High-Concurrency Caching Strategy
- **Read-Heavy Ratio**: URL shorteners experience a 100:1 read-to-write ratio.
- **Redis TTL**: Keys are cached for 24 hours (`EX 86400`).
- **Graceful Fallback**: If Redis becomes unreachable, backend seamlessly routes lookups to MongoDB Atlas without failing HTTP requests.

### C. Database Scaling Strategy at Scale
1. **Read Replicas**: Separate primary database node for writes (`POST /api/shorten`) and read-replicas for cache misses on redirects.
2. **Range Sharding by `shortCode`**: Partition MongoDB clusters by initial character range (`0-9`, `a-z`, `A-Z`).
