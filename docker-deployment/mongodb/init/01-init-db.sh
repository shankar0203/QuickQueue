#!/bin/bash
# MongoDB initialization script

# Create application database and user
mongosh <<EOF
use quickqueue_production;

// Create application user
db.createUser({
  user: 'quickqueue_app',
  pwd: 'quickqueue_app_password_change_me',
  roles: [
    { role: 'readWrite', db: 'quickqueue_production' },
    { role: 'dbAdmin', db: 'quickqueue_production' }
  ]
});

// Create initial collections with validation
db.createCollection('users', {
  validator: {
    \$jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\$'
        },
        role: {
          enum: ['admin', 'organizer', 'user']
        }
      }
    }
  }
});

db.createCollection('events');
db.createCollection('bookings');
db.createCollection('user_sessions');
db.createCollection('contact_messages');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.events.createIndex({ organizer_id: 1 });
db.events.createIndex({ category: 1 });
db.events.createIndex({ date: 1 });
db.events.createIndex({ status: 1 });
db.bookings.createIndex({ event_id: 1 });
db.bookings.createIndex({ user_id: 1 });
db.bookings.createIndex({ ticket_number: 1 }, { unique: true });
db.user_sessions.createIndex({ session_token: 1 }, { unique: true });
db.user_sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

print('Database initialized successfully');
EOF