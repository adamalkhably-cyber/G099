# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require a JWT token in the header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 201
{
  "message": "User registered successfully",
  "access_token": "eyJ0eXAi...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-06-06T10:30:00"
  }
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200
{
  "message": "Login successful",
  "access_token": "eyJ0eXAi...",
  "user": { ... }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response: 200
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2024-06-06T10:30:00"
}
```

---

## Wardrobe Endpoints

### Get All Wardrobe Items
```
GET /wardrobe
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "name": "Blue Shirt",
    "category": "shirt",
    "color": "blue",
    "size": "M",
    "image_path": null,
    "description": "Casual blue shirt",
    "created_at": "2024-06-06T10:30:00"
  }
]
```

### Get Specific Item
```
GET /wardrobe/<item_id>
Authorization: Bearer <token>

Response: 200 (same as above)
```

### Create Wardrobe Item
```
POST /wardrobe
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Blue Shirt",
  "category": "shirt",
  "color": "blue",
  "size": "M",
  "description": "Casual blue shirt",
  "image_path": null
}

Response: 201
{
  "message": "Item added to wardrobe",
  "item": { ... }
}
```

### Update Wardrobe Item
```
PUT /wardrobe/<item_id>
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Dark Blue Shirt",
  "color": "navy"
}

Response: 200
```

### Delete Wardrobe Item
```
DELETE /wardrobe/<item_id>
Authorization: Bearer <token>

Response: 200
{
  "message": "Item deleted"
}
```

### Search Wardrobe
```
GET /wardrobe/search?category=shirt&color=blue&name=casual
Authorization: Bearer <token>

Response: 200
[ ... items matching criteria ... ]
```

### Get Wardrobe Statistics
```
GET /wardrobe/stats
Authorization: Bearer <token>

Response: 200
{
  "total_items": 15,
  "categories": {
    "shirt": 5,
    "pants": 3,
    "dress": 2,
    "jacket": 5
  },
  "colors": {
    "blue": 4,
    "black": 3,
    "white": 2,
    "red": 1
  }
}
```

---

## Outfit Endpoints

### Get All Outfits
```
GET /outfits
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "name": "Casual Friday",
    "description": "Perfect for casual office days",
    "items": [ ... ],
    "created_at": "2024-06-06T10:30:00"
  }
]
```

### Get Specific Outfit
```
GET /outfits/<outfit_id>
Authorization: Bearer <token>

Response: 200 (same as above)
```

### Create Outfit
```
POST /outfits
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Casual Friday",
  "description": "Perfect for casual office days",
  "item_ids": [1, 2, 3]
}

Response: 201
{
  "message": "Outfit created",
  "outfit": { ... }
}
```

### Update Outfit
```
PUT /outfits/<outfit_id>
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Outfit Name",
  "description": "Updated description",
  "item_ids": [1, 2, 3]
}

Response: 200
```

### Delete Outfit
```
DELETE /outfits/<outfit_id>
Authorization: Bearer <token>

Response: 200
{
  "message": "Outfit deleted"
}
```

### Add Item to Outfit
```
POST /outfits/<outfit_id>/items/<item_id>
Authorization: Bearer <token>

Response: 200
{
  "message": "Item added to outfit",
  "outfit": { ... }
}
```

### Remove Item from Outfit
```
DELETE /outfits/<outfit_id>/items/<item_id>
Authorization: Bearer <token>

Response: 200
{
  "message": "Item removed from outfit",
  "outfit": { ... }
}
```

---

## Calendar Endpoints

### Get All Planned Outfits
```
GET /calendar
Authorization: Bearer <token>

Response: 200
[
  {
    "id": 1,
    "outfit": { ... },
    "date": "2024-06-10",
    "notes": "Team meeting day",
    "created_at": "2024-06-06T10:30:00"
  }
]
```

### Get Month Calendar
```
GET /calendar/month/<year>/<month>
Authorization: Bearer <token>

Example: /calendar/month/2024/6

Response: 200
[ ... all planned outfits for June 2024 ... ]
```

### Get Specific Date Outfit
```
GET /calendar/<date>
Authorization: Bearer <token>

Example: /calendar/2024-06-10

Response: 200
{
  "id": 1,
  "outfit": { ... },
  "date": "2024-06-10",
  "notes": "Team meeting day",
  "created_at": "2024-06-06T10:30:00"
}
```

### Plan Outfit for Date
```
POST /calendar
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-06-10",
  "outfit_id": 1,
  "notes": "Team meeting day"
}

Response: 201
{
  "message": "Outfit planned for this date",
  "planned": { ... }
}
```

### Update Planned Outfit
```
PUT /calendar/<date>
Content-Type: application/json
Authorization: Bearer <token>

Example: /calendar/2024-06-10

{
  "outfit_id": 2,
  "notes": "Changed to outfit 2"
}

Response: 200
```

### Delete Planned Outfit
```
DELETE /calendar/<date>
Authorization: Bearer <token>

Example: /calendar/2024-06-10

Response: 200
{
  "message": "Planned outfit deleted"
}
```

### Get Upcoming Outfits (Next 7 Days)
```
GET /calendar/upcoming
Authorization: Bearer <token>

Response: 200
[ ... planned outfits for next 7 days ... ]
```

---

## Error Responses

All errors follow this format:
```
{
  "error": "Error message"
}
```

Common HTTP Status Codes:
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (missing fields, invalid format)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error
