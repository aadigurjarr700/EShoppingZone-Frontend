# EShoppingZone Frontend (React)

A modern React frontend for the **EShoppingZone E-Commerce Platform**, built as a **Single Page Application (SPA)** that communicates with the .NET microservices backend through the API Gateway.

This frontend replaces the traditional ASP.NET MVC Razor Views architecture with a scalable React-based client application.

---

# Project Overview

EShoppingZone Frontend provides the complete user-facing e-commerce experience for:

- Customer shopping
- Merchant product management
- Admin operations
- Wallet payments
- Order management
- Authentication & authorization

The frontend communicates with backend microservices via REST APIs.

---

# Frontend Architecture

The frontend follows a **component-based scalable architecture**.

## Architecture Flow

```text
User Browser
    |
    v
React Frontend SPA
    |
    v
Axios API Layer
    |
    v
API Gateway (YARP)
    |
    +------------------------------+
    |              |               |
    v              v               v
Profile API    Product API     Cart API
Order API      Wallet API
