# ConnectHub API Documentation

## Authentication Endpoints

### `POST /api/auth/register`
Register a new user.
*   **Body**: `{"username": "john", "email": "john@test.com", "password": "pass"}`
*   **Response**: `201 Created`

### `POST /api/auth/login`
Authenticate a user and retrieve a JWT.
*   **Body**: `{"username": "john", "password": "pass"}`
*   **Response**: `200 OK`
    ```json
    {
      "token": "eyJhb...",
      "id": 1,
      "username": "john",
      "email": "john@test.com"
    }
    ```

---

## User Endpoints (Requires `Bearer Token`)

### `GET /api/users`
Retrieve a list of all registered users (used for group creation).
*   **Response**: `200 OK` `[ { "id": 1, "username": "john", ... } ]`

---

## Chat Endpoints (Requires `Bearer Token`)

### `GET /api/chats/user/{userId}`
Get all private and group chats that the user is a member of.
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": 1,
        "type": "PRIVATE",
        "name": "john_and_jane",
        "createdAt": "..."
      }
    ]
    ```

### `GET /api/chats/{chatId}/messages`
Retrieve message history for a specific chat.
*   **Response**: `200 OK`
    ```json
    [
      {
        "id": 100,
        "content": "Hello world",
        "sender": { "id": 1, "username": "john" },
        "createdAt": "..."
      }
    ]
    ```

### `POST /api/chats/group`
Create a new group chat and add members.
*   **Body**:
    ```json
    {
      "name": "Developers Group",
      "createdBy": 1,
      "memberIds": [2, 3, 4]
    }
    ```
*   **Response**: `200 OK` (Returns created Chat object)

---

## WebSocket STOMP Endpoints

*   **Endpoint URL**: `/ws` (SockJS enabled)
*   **Message Broker Prefix**: `/topic`, `/queue`
*   **Application Prefix**: `/app`

### Sending a Message
*   **Destination**: `/app/chat/{chatId}/sendMessage`
*   **Payload**:
    ```json
    {
      "chatId": 1,
      "senderId": 1,
      "content": "Hello team!",
      "messageType": "TEXT"
    }
    ```

### Subscribing to Chat Updates
*   **Topic**: `/topic/chat/{chatId}`
*   **Event**: Receive new incoming messages instantly.
