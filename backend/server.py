from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import httpx
import qrcode
from io import BytesIO
import base64
import razorpay


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.getenv('RAZORPAY_KEY_ID', 'test_key'),
    os.getenv('RAZORPAY_KEY_SECRET', 'test_secret')
))

security = HTTPBearer(auto_error=False)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: Literal["admin", "organizer", "user"] = "user"
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_verified_organizer: bool = False

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    organizer_id: str
    organizer_name: str
    venue: str
    date: datetime
    duration: int  # in hours
    category: str
    image_url: str
    ticket_types: List[dict]  # [{"name": "General", "price": 100, "available": 100}]
    terms: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["draft", "published", "cancelled"] = "published"

class TicketBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    user_id: Optional[str] = None  # Optional for guest bookings
    buyer_name: str
    buyer_email: str
    buyer_phone: str
    ticket_type: str
    quantity: int
    total_amount: float
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_status: Literal["pending", "paid", "failed", "refunded"] = "pending"
    qr_code: Optional[str] = None
    ticket_number: str = Field(default_factory=lambda: f"TKT-{str(uuid.uuid4())[:8].upper()}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    checked_in: bool = False
    checked_in_at: Optional[datetime] = None

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["new", "replied", "resolved"] = "new"

# Request/Response Models
class EventCreate(BaseModel):
    title: str
    description: str
    venue: str
    date: datetime
    duration: int
    category: str
    image_url: str
    ticket_types: List[dict]
    terms: str

class BookingCreate(BaseModel):
    event_id: str
    buyer_name: str
    buyer_email: str
    buyer_phone: str
    ticket_type: str
    quantity: int

class PaymentCreate(BaseModel):
    booking_id: str
    amount: float

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str

# Auth Helper Functions
async def get_session_from_request(request: Request) -> Optional[str]:
    # First check cookies
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Fallback to Authorization header
    credentials = await security(request)
    if credentials:
        return credentials.credentials
    return None

async def get_current_user(request: Request) -> Optional[User]:
    session_token = await get_session_from_request(request)
    if not session_token:
        return None
        
    # Check if session exists and is valid
    session = await db.user_sessions.find_one({
        "session_token": session_token,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not session:
        return None
    
    # Get user
    user_doc = await db.users.find_one({"id": session["user_id"]})
    if user_doc:
        return User(**user_doc)
    return None

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

async def require_organizer(request: Request) -> User:
    user = await require_auth(request)
    if user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Organizer access required")
    return user

async def require_admin(request: Request) -> User:
    user = await require_auth(request)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Utility Functions
def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

# Auth Routes
@api_router.get("/auth/me", response_model=User)
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    try:
        # Get session_id from header
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Call Emergent auth service
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": auth_data["email"]})
        
        if existing_user:
            user = User(**existing_user)
        else:
            # Create new user
            user_data = {
                "id": str(uuid.uuid4()),
                "email": auth_data["email"],
                "name": auth_data["name"],
                "picture": auth_data.get("picture"),
                "role": "user",
                "created_at": datetime.now(timezone.utc)
            }
            await db.users.insert_one(user_data)
            user = User(**user_data)
        
        # Create session
        session_token = auth_data["session_token"]
        session_data = {
            "user_id": user.id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        
        # Remove old sessions for this user
        await db.user_sessions.delete_many({"user_id": user.id})
        await db.user_sessions.insert_one(session_data)
        
        # Set httpOnly cookie
        response.set_cookie(
            "session_token",
            session_token,
            max_age=7*24*60*60,  # 7 days
            httponly=True,
            secure=True,
            samesite="none",
            path="/"
        )
        
        return {"user": user, "message": "Session created successfully"}
        
    except Exception as e:
        logging.error(f"Session creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Session creation failed")

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = await get_session_from_request(request)
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# Event Routes
@api_router.get("/events", response_model=List[Event])
async def get_events(
    category: Optional[str] = None,
    search: Optional[str] = None,
    filter_type: Optional[str] = None  # today, week, month, free, paid
):
    query = {"status": "published"}
    
    if category:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"venue": {"$regex": search, "$options": "i"}},
            {"organizer_name": {"$regex": search, "$options": "i"}}
        ]
    
    if filter_type:
        now = datetime.now(timezone.utc)
        if filter_type == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            query["date"] = {"$gte": start, "$lt": end}
        elif filter_type == "week":
            end = now + timedelta(days=7)
            query["date"] = {"$gte": now, "$lt": end}
        elif filter_type == "month":
            end = now + timedelta(days=30)
            query["date"] = {"$gte": now, "$lt": end}
        elif filter_type == "free":
            query["ticket_types.price"] = 0
        elif filter_type == "paid":
            query["ticket_types.price"] = {"$gt": 0}
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, user: User = Depends(require_organizer)):
    event = Event(
        **event_data.model_dump(),
        organizer_id=user.id,
        organizer_name=user.name
    )
    
    await db.events.insert_one(event.model_dump())
    return event

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventCreate, user: User = Depends(require_organizer)):
    existing_event = await db.events.find_one({"id": event_id})
    if not existing_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if existing_event["organizer_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")
    
    updated_event = Event(
        id=event_id,
        **event_data.model_dump(),
        organizer_id=existing_event["organizer_id"],
        organizer_name=existing_event["organizer_name"],
        created_at=existing_event["created_at"]
    )
    
    await db.events.replace_one({"id": event_id}, updated_event.model_dump())
    return updated_event

# Booking Routes
@api_router.post("/bookings", response_model=TicketBooking)
async def create_booking(booking_data: BookingCreate, request: Request):
    # Get event details
    event = await db.events.find_one({"id": booking_data.event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Find ticket type and calculate amount
    ticket_type = None
    for tt in event["ticket_types"]:
        if tt["name"] == booking_data.ticket_type:
            ticket_type = tt
            break
    
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    
    total_amount = ticket_type["price"] * booking_data.quantity
    
    # Get current user if logged in
    current_user = await get_current_user(request)
    user_id = current_user.id if current_user else None
    
    # Create booking
    booking = TicketBooking(
        **booking_data.model_dump(),
        user_id=user_id,
        total_amount=total_amount
    )
    
    await db.bookings.insert_one(booking.model_dump())
    return booking

@api_router.post("/payments/create-order")
async def create_payment_order(payment_data: PaymentCreate):
    # Get booking
    booking = await db.bookings.find_one({"id": payment_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create Razorpay order
    try:
        order = razorpay_client.order.create({
            "amount": int(payment_data.amount * 100),  # Convert to paise
            "currency": "INR",
            "payment_capture": 1
        })
        
        # Update booking with order ID
        await db.bookings.update_one(
            {"id": payment_data.booking_id},
            {"$set": {"razorpay_order_id": order["id"]}}
        )
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except Exception as e:
        logging.error(f"Razorpay order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment order creation failed")

@api_router.post("/payments/verify")
async def verify_payment(request: Request):
    payload = await request.json()
    
    try:
        # Verify payment signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': payload['razorpay_order_id'],
            'razorpay_payment_id': payload['razorpay_payment_id'],
            'razorpay_signature': payload['razorpay_signature']
        })
        
        # Update booking
        booking = await db.bookings.find_one({"razorpay_order_id": payload['razorpay_order_id']})
        if booking:
            # Generate QR code
            qr_data = f"TICKET:{booking['ticket_number']}:EVENT:{booking['event_id']}"
            qr_code = generate_qr_code(qr_data)
            
            await db.bookings.update_one(
                {"razorpay_order_id": payload['razorpay_order_id']},
                {
                    "$set": {
                        "razorpay_payment_id": payload['razorpay_payment_id'],
                        "payment_status": "paid",
                        "qr_code": qr_code
                    }
                }
            )
            
            return {"status": "success", "ticket_number": booking['ticket_number']}
        
        return {"status": "error", "message": "Booking not found"}
        
    except Exception as e:
        logging.error(f"Payment verification failed: {str(e)}")
        return {"status": "error", "message": "Payment verification failed"}

@api_router.get("/tickets/{ticket_number}", response_model=TicketBooking)
async def get_ticket(ticket_number: str):
    ticket = await db.bookings.find_one({"ticket_number": ticket_number}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return TicketBooking(**ticket)

# Contact Routes
@api_router.post("/contact")
async def submit_contact(contact_data: ContactCreate):
    contact = ContactMessage(**contact_data.model_dump())
    await db.contact_messages.insert_one(contact.model_dump())
    return {"message": "Message submitted successfully"}

# Dashboard Routes
@api_router.get("/dashboard/organizer")
async def get_organizer_dashboard(user: User = Depends(require_organizer)):
    # Get organizer's events
    events = await db.events.find({"organizer_id": user.id}, {"_id": 0}).to_list(1000)
    
    # Get booking stats
    total_revenue = 0
    total_tickets_sold = 0
    total_check_ins = 0
    
    for event in events:
        bookings = await db.bookings.find({
            "event_id": event["id"],
            "payment_status": "paid"
        }).to_list(1000)
        
        for booking in bookings:
            total_revenue += booking["total_amount"]
            total_tickets_sold += booking["quantity"]
            if booking.get("checked_in"):
                total_check_ins += booking["quantity"]
    
    return {
        "events": events,
        "stats": {
            "total_events": len(events),
            "total_revenue": total_revenue,
            "total_tickets_sold": total_tickets_sold,
            "total_check_ins": total_check_ins
        }
    }

@api_router.get("/dashboard/admin")
async def get_admin_dashboard(user: User = Depends(require_admin)):
    # Get all events, users, bookings stats
    total_events = await db.events.count_documents({})
    total_users = await db.users.count_documents({})
    total_bookings = await db.bookings.count_documents({"payment_status": "paid"})
    total_revenue = 0
    
    bookings = await db.bookings.find({"payment_status": "paid"}).to_list(10000)
    for booking in bookings:
        total_revenue += booking["total_amount"]
    
    # Get recent events
    recent_events = await db.events.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "stats": {
            "total_events": total_events,
            "total_users": total_users,
            "total_bookings": total_bookings,
            "total_revenue": total_revenue
        },
        "recent_events": recent_events
    }

# Check-in Routes
@api_router.post("/checkin/{ticket_number}")
async def checkin_ticket(ticket_number: str, user: User = Depends(require_organizer)):
    # Get ticket
    ticket = await db.bookings.find_one({"ticket_number": ticket_number})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get event to verify organizer
    event = await db.events.find_one({"id": ticket["event_id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event["organizer_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to check in this ticket")
    
    if ticket["payment_status"] != "paid":
        raise HTTPException(status_code=400, detail="Ticket payment not confirmed")
    
    if ticket.get("checked_in"):
        raise HTTPException(status_code=400, detail="Ticket already checked in")
    
    # Update check-in status
    await db.bookings.update_one(
        {"ticket_number": ticket_number},
        {
            "$set": {
                "checked_in": True,
                "checked_in_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"message": "Ticket checked in successfully", "ticket_number": ticket_number}

# Root route
@api_router.get("/")
async def root():
    return {"message": "QuickQueue API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()