# API Endpoints Documentation for Testing

This document outlines the key API endpoints for the simple-ecommerce application, including example requests and expected behaviors for testing purposes.

**Base URL:** `http://localhost:3000` (assuming default NestJS port)

---

## 1. Authentication Endpoints

### 1.1. Register User (Buyer/Seller)

*   **Method:** `POST`
*   **URL:** `/auth/register`
*   **Headers:** `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "testbuyer@example.com",
      "password": "password123",
      "name": "Test Buyer"
    }
    ```
    ```json
    {
      "email": "testseller@example.com",
      "password": "password123",
      "name": "Test Seller"
    }
    ```
*   **Expected Response:** `201 Created` with a message indicating successful registration and OTP sent.

### 1.2. Login User

*   **Method:** `POST`
*   **URL:** `/auth/login`
*   **Headers:** `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "testbuyer@example.com",
      "password": "password123"
    }
    ```
*   **Expected Response:** `200 OK` with `accessToken` in the response body and a `jwt` cookie set.
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
    **Note:** The `accessToken` should be used in the `Authorization` header as `Bearer <accessToken>` for subsequent authenticated requests, or will be automatically sent via the `jwt` cookie.

### 1.3. Logout User

*   **Method:** `POST`
*   **URL:** `/auth/logout`
*   **Headers:** `Authorization: Bearer <jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with a message indicating successful logout. The `jwt` cookie will be cleared.

### 1.4. Resend OTP

*   **Method:** `POST`
*   **URL:** `/auth/resend-otp`
*   **Headers:** `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "testbuyer@example.com",
      "type": "EMAIL_VERIFICATION" // or "PASSWORD_RESET"
    }
    ```
*   **Expected Response:** `200 OK` with a message indicating OTP resent.

### 1.5. Verify OTP

*   **Method:** `POST`
*   **URL:** `/auth/verify-otp`
*   **Headers:** `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "email": "testbuyer@example.com",
      "otp": "123456",
      "type": "EMAIL_VERIFICATION" // or "PASSWORD_RESET"
    }
    ```
*   **Expected Response:** `200 OK` with a message indicating successful OTP verification.

---

## 2. User Endpoints

### 2.1. Get Current User Profile

*   **Method:** `GET`
*   **URL:** `/user/me`
*   **Headers:** `Authorization: Bearer <jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the authenticated user's profile details (excluding password).

### 2.2. Get All Users (Admin Only)

*   **Method:** `GET`
*   **URL:** `/user`
*   **Headers:** `Authorization: Bearer <admin_jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with an array of all user objects.

### 2.3. Get User by ID

*   **Method:** `GET`
*   **URL:** `/user/:id` (e.g., `/user/clsdj234j234j234j`)
*   **Headers:** (No specific headers required)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the user object matching the ID.

### 2.4. Update User by ID

*   **Method:** `PATCH`
*   **URL:** `/user/:id` (e.g., `/user/clsdj234j234j234j`)
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "name": "Updated Name"
    }
    ```
*   **Expected Response:** `200 OK` with the updated user object.

### 2.5. Delete User by ID

*   **Method:** `DELETE`
*   **URL:** `/user/:id` (e.g., `/user/clsdj234j234j234j`)
*   **Headers:** `Authorization: Bearer <jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the deleted user object.

### 2.6. Suspend User (Admin Only)

*   **Method:** `PATCH`
*   **URL:** `/user/:id/suspend` (e.g., `/user/clsdj234j234j234j/suspend`)
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <admin_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "isSuspended": true
    }
    ```
*   **Expected Response:** `200 OK` with the updated user object.

---

## 3. Category Endpoints

### 3.1. Create Category (Admin Only)

*   **Method:** `POST`
*   **URL:** `/category`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <admin_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic gadgets and devices"
    }
    ```
*   **Expected Response:** `201 Created` with the created category object.

### 3.2. Get All Categories

*   **Method:** `GET`
*   **URL:** `/category`
*   **Headers:** (No specific headers required for public access, but can be authenticated)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with an array of category objects.

### 3.3. Get Category by ID

*   **Method:** `GET`
*   **URL:** `/category/:id` (e.g., `/category/clsdj234j234j234j`)
*   **Headers:** (No specific headers required)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the category object matching the ID.

### 3.4. Update Category by ID (Admin Only)

*   **Method:** `PATCH`
*   **URL:** `/category/:id` (e.g., `/category/clsdj234j234j234j`)
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <admin_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "name": "Updated Category Name"
    }
    ```
*   **Expected Response:** `200 OK` with the updated category object.

### 3.5. Delete Category by ID (Admin Only)

*   **Method:** `DELETE`
*   **URL:** `/category/:id` (e.g., `/category/clsdj234j234j234j`)
*   **Headers:** `Authorization: Bearer <admin_jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the deleted category object.

---

## 4. Product Endpoints

### 4.1. Create Product (Seller Only)

*   **Method:** `POST`
*   **URL:** `/product`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <seller_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "name": "Smartphone X",
      "slug": "smartphone-x",
      "description": "Latest model smartphone with advanced features.",
      "price": 799.99,
      "imageUrl": "http://example.com/image.jpg",
      "categoryId": "<id_of_electronics_category>"
    }
    ```
*   **Expected Response:** `201 Created` with the created product object (status will be `DRAFT` by default).

### 4.2. Get All Products

*   **Method:** `GET`
*   **URL:** `/product`
*   **Headers:**
    *   `Authorization: Bearer <jwt_token>` (or `jwt` cookie) - Optional, but affects results based on role.
*   **Request Body:** None
*   **Expected Response:** `200 OK` with an array of product objects.
    *   **As Buyer:** Only `APPROVED` products.
    *   **As Seller:** All products posted by that seller (DRAFT, PENDING, APPROVED, REJECTED).
    *   **As Admin:** All products (DRAFT, PENDING, APPROVED, REJECTED).

### 4.3. Get Product by ID

*   **Method:** `GET`
*   **URL:** `/product/:id` (e.g., `/product/clsdj234j234j234j`)
*   **Headers:** (No specific headers required)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the product object matching the ID.

### 4.4. Update Product by ID

*   **Method:** `PATCH`
*   **URL:** `/product/:id` (e.g., `/product/clsdj234j234j234j`)
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <seller_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "price": 750.00
    }
    ```
*   **Expected Response:** `200 OK` with the updated product object.

### 4.5. Delete Product by ID

*   **Method:** `DELETE`
*   **URL:** `/product/:id` (e.g., `/product/clsdj234j234j234j`)
*   **Headers:** `Authorization: Bearer <seller_jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the deleted product object.

### 4.6. Update Product Status (Admin Only)

*   **Method:** `PATCH`
*   **URL:** `/product/:id/status` (e.g., `/product/clsdj234j234j234j/status`)
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <admin_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "status": "APPROVED"
    }
    ```
    (Possible values: `PENDING`, `APPROVED`, `REJECTED`)
*   **Expected Response:** `200 OK` with the updated product object.

---

## 5. Cart Endpoints

### 5.1. Add to Cart (Authenticated User)

*   **Method:** `POST`
*   **URL:** `/cart`
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <buyer_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "productId": "<id_of_product>",
      "quantity": 1
    }
    ```
*   **Expected Response:** `201 Created` with the created or updated cart item.

### 5.2. Get Cart (Authenticated User)

*   **Method:** `GET`
*   **URL:** `/cart`
*   **Headers:**
    *   `Authorization: Bearer <buyer_jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the user's cart object, including its items.

### 5.3. Update Cart Item Quantity (Authenticated User)

*   **Method:** `PATCH`
*   **URL:** `/cart/:productId` (e.g., `/cart/clsdj234j234j234j`)
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <buyer_jwt_token>` (or `jwt` cookie)
*   **Request Body (JSON):**
    ```json
    {
      "quantity": 2
    }
    ```
*   **Expected Response:** `200 OK` with the updated cart item.

### 5.4. Remove Cart Item (Authenticated User)

*   **Method:** `DELETE`
*   **URL:** `/cart/:productId` (e.g., `/cart/clsdj234j234j234j`)
*   **Headers:** `Authorization: Bearer <buyer_jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with the deleted cart item.

### 5.5. Clear Cart (Authenticated User)

*   **Method:** `DELETE`
*   **URL:** `/cart`
*   **Headers:** `Authorization: Bearer <buyer_jwt_token>` (or `jwt` cookie)
*   **Request Body:** None
*   **Expected Response:** `200 OK` with a message indicating the cart was cleared.

---

## 6. Conversation (Chat) Endpoints (WebSockets)

**WebSocket URL:** `ws://localhost:3000/socket.io/` (or `wss://` for secure)

**Authentication:** The JWT token should be sent in the `jwt` cookie during the WebSocket handshake.

### 6.1. Create Conversation

*   **Event:** `createConversation`
*   **Payload (JSON):**
    ```json
    {
      "productId": "<id_of_product>",
      "sellerId": "<id_of_seller>"
    }
    ```
*   **Expected Event:** `conversationCreated` with the new conversation object.

### 6.2. Join Conversation

*   **Event:** `joinConversation`
*   **Payload (JSON):**
    ```json
    "<id_of_conversation>"
    ```
*   **Expected Event:** `conversationMessages` with an array of messages in the conversation.

### 6.3. Send Message

*   **Event:** `sendMessage`
*   **Payload (JSON):**
    ```json
    {
      "conversationId": "<id_of_conversation>",
      "message": {
        "message": "Hello, I'm interested in this product."
      }
    }
    ```
*   **Expected Event:** `newMessage` (broadcast to all participants) with the new message object.

### 6.4. Propose Price

*   **Event:** `proposePrice`
*   **Payload (JSON):**
    ```json
    {
      "conversationId": "<id_of_conversation>",
      "proposal": {
        "price": 750.00
      }
    }
    ```
*   **Expected Event:** `newProposal` (broadcast to all participants) with the new proposal message object.

### 6.5. Accept/Reject Proposal

*   **Event:** `acceptRejectProposal`
*   **Payload (JSON):**
    ```json
    {
      "conversationId": "<id_of_conversation>",
      "messageId": "<id_of_proposal_message>",
      "decision": {
        "accepted": true
      }
    }
    ```
    (Set `accepted: false` to reject)
*   **Expected Event:** `proposalUpdated` (broadcast to all participants) with the updated proposal message object. If accepted, the product will be added to the buyer's cart.

### 6.6. Get User Conversations

*   **Event:** `getConversations`
*   **Payload:** None
*   **Expected Event:** `userConversations` with an array of conversation objects for the authenticated user.

---

## Dummy Data Generation (Conceptual)

To test effectively, you'll need to create some dummy data in your database.

1.  **Register Users:**
    *   Register a `BUYER` user (e.g., `testbuyer@example.com`, `password123`).
    *   Register a `SELLER` user (e.g., `testseller@example.com`, `password123`).
    *   Manually update one of the user's roles to `ADMIN` in the database (e.g., `testadmin@example.com`, `password123`) if needed, or create a separate registration flow for admins.

2.  **Create Categories:**
    *   Log in as an `ADMIN`.
    *   Use the "Create Category" endpoint to create a few categories (e.g., "Electronics", "Clothing"). Note down their IDs.

3.  **Create Products:**
    *   Log in as a `SELLER`.
    *   Use the "Create Product" endpoint to create several products, associating them with the created categories. Note down their IDs.
    *   Initially, these products will have `status: DRAFT`.

4.  **Approve Products (Admin):**
    *   Log in as an `ADMIN`.
    *   Use the "Update Product Status" endpoint to change some product statuses from `DRAFT` to `PENDING`, and then from `PENDING` to `APPROVED` or `REJECTED`.

This setup will allow you to test the various roles and product statuses.