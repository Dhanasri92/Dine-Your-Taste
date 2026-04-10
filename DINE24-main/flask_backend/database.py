"""
DINE24 Restaurant Management System - Database Layer
Supports MongoDB Atlas/local with automatic in-memory fallback.
"""

from pymongo import MongoClient
from datetime import datetime
import os
import copy
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash

# ─── In-Memory Store ────────────────────────────────────────────────
_store = {
    'reservations': [],
    'menu_items':   [],
    'users':        [],
    'restaurant_tables': [],
    'todays_specials': [],
    'chat_logs':    [],
    'analytics':    [],
}

def _seed_store():
    """Seed the in-memory store with demo data."""
    from bson.objectid import ObjectId
    import os
    from dotenv import load_dotenv

    load_dotenv()

    # Admin user - Load from environment variables
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@dine24.com')
    
    _store['users'] = [
        {
            '_id': ObjectId(),
            'username': admin_username,
            'password': generate_password_hash(admin_password),
            'role': 'admin',
            'email': admin_email,
            'created_at': datetime.utcnow(),
        }
    ]

    # Restaurant tables
    tables = [
        ('A1', 2, 'Indoor'), ('A2', 2, 'Indoor'), ('A3', 4, 'Indoor'), ('A4', 4, 'Indoor'),
        ('B1', 4, 'Window'), ('B2', 6, 'Window'), ('B3', 6, 'Window'),
        ('C1', 8, 'Private'), ('C2', 10, 'Private'),
        ('D1', 4, 'Outdoor'), ('D2', 4, 'Outdoor'), ('D3', 6, 'Outdoor'),
    ]
    _store['restaurant_tables'] = [
        {
            '_id': ObjectId(),
            'table_number': t, 'seating_capacity': cap,
            'section': sec, 'is_available': True,
            'created_at': datetime.utcnow(),
        }
        for t, cap, sec in tables
    ]

    # Menu items
    menu = [
        # Starters
        ('Paneer Tikka',      'Starters', 280, 240, '250g',   4.5, True),
        ('Chicken Tikka',     'Starters', 320, 280, '300g',   4.6, False),
        ('Veg Spring Rolls',  'Starters', 200, 170, '4 pcs',  4.2, True),
        ('Fish Amritsari',    'Starters', 350, 300, '250g',   4.4, False),
        ('Hara Bhara Kabab',  'Starters', 220, 190, '4 pcs',  4.3, True),
        # Main Course
        ('Butter Chicken',    'Main Course', 380, 340, '300g', 4.8, False),
        ('Dal Makhani',       'Main Course', 260, 230, '300ml', 4.6, True),
        ('Palak Paneer',      'Main Course', 300, 260, '300g', 4.5, True),
        ('Chicken Biryani',   'Main Course', 420, 380, '500g', 4.9, False),
        ('Veg Biryani',       'Main Course', 320, 280, '500g', 4.7, True),
        ('Mutton Rogan Josh', 'Main Course', 480, 420, '350g', 4.7, False),
        ('Chole Bhature',     'Main Course', 240, 210, '2 pcs', 4.4, True),
        # Breads
        ('Butter Naan',       'Breads', 60, None, '1 pc',  4.3, True),
        ('Tandoori Roti',     'Breads', 40, None, '1 pc',  4.2, True),
        ('Garlic Naan',       'Breads', 80, None, '1 pc',  4.5, True),
        ('Laccha Paratha',    'Breads', 70, None, '1 pc',  4.4, True),
        # Desserts
        ('Gulab Jamun',       'Desserts', 140, 120, '2 pcs', 4.7, True),
        ('Rasmalai',          'Desserts', 160, 140, '2 pcs', 4.6, True),
        ('Kulfi Falooda',     'Desserts', 180, 150, '1 glass', 4.8, True),
        ('Gajar Ka Halwa',    'Desserts', 150, 130, '200g', 4.5, True),
        # Beverages
        ('Lassi (Sweet)',     'Beverages', 120, 100, '300ml', 4.6, True),
        ('Mango Lassi',       'Beverages', 140, 120, '300ml', 4.7, True),
        ('Masala Chai',       'Beverages', 60,  None,'200ml', 4.4, True),
        ('Fresh Lime Soda',   'Beverages', 80,  None,'300ml', 4.3, True),
    ]
    _store['menu_items'] = [
        {
            '_id': ObjectId(),
            'name': name, 'category': cat,
            'price': price, 'offer_price': offer,
            'quantity': qty, 'rating': rating,
            'is_veg': is_veg, 'orders_placed': 0,
            'created_at': datetime.utcnow(),
        }
        for name, cat, price, offer, qty, rating, is_veg in menu
    ]

    # Sample reservations
    _store['reservations'] = [
        {
            '_id': ObjectId(),
            'full_name': 'Rahul Sharma',
            'email': 'rahul@example.com',
            'phone': '9876543210',
            'num_people': 4,
            'purpose': 'Birthday Celebration',
            'arrival_date': '2026-04-12',
            'arrival_time': '7:30 PM',
            'table_number': 'B2',
            'table_capacity': 6,
            'status': 'confirmed',
            'total_amount': 1840,
            'order_type': 'now',
            'created_at': datetime.utcnow(),
        },
        {
            '_id': ObjectId(),
            'full_name': 'Priya Patel',
            'email': 'priya@example.com',
            'phone': '9123456789',
            'num_people': 2,
            'purpose': 'Anniversary Dinner',
            'arrival_date': '2026-04-13',
            'arrival_time': '8:00 PM',
            'table_number': 'A3',
            'table_capacity': 4,
            'status': 'confirmed',
            'total_amount': 1240,
            'order_type': 'later',
            'created_at': datetime.utcnow(),
        },
    ]

    print("[OK] In-memory store seeded with demo data.")

_seed_store()


# ─── Helpers ──────────────────────────────────────────────────────────
def _match(doc, query):
    """Check if a document matches a MongoDB-style query dict."""
    for k, v in query.items():
        if isinstance(v, dict):
            # Support $in, $ne etc.
            if '$in' in v and doc.get(k) not in v['$in']:
                return False
            if '$ne' in v and doc.get(k) == v['$ne']:
                return False
        else:
            if doc.get(k) != v:
                return False
    return True


class _MockResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id
    @property
    def modified_count(self):
        return 1
    @property
    def deleted_count(self):
        return 1


# ─── DatabaseManager ────────────────────────────────────────────────
class DatabaseManager:
    def __init__(self):
        self.connection_string = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
        self.database_name = 'dine24_restaurant'
        self.client = None
        self.db = None

        try:
            self.client = MongoClient(self.connection_string, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.database_name]
            self.client.admin.command('ping')
            print("[OK] MongoDB connected successfully!")
            self._seed_mongo()
        except Exception as e:
            print(f"[WARN] MongoDB unavailable ({type(e).__name__}). Using in-memory store.")
            self.client = None
            self.db = None

        print("[DB] DINE24 DatabaseManager ready.")

    def _seed_mongo(self):
        """Seed MongoDB with demo data if collections are empty."""
        try:
            if self.db['users'].count_documents({}) == 0:
                self.db['users'].insert_many(copy.deepcopy(_store['users']))
                print("[OK] Users seeded in MongoDB.")
            if self.db['restaurant_tables'].count_documents({}) == 0:
                self.db['restaurant_tables'].insert_many(copy.deepcopy(_store['restaurant_tables']))
                print("[OK] Tables seeded in MongoDB.")
            if self.db['menu_items'].count_documents({}) == 0:
                self.db['menu_items'].insert_many(copy.deepcopy(_store['menu_items']))
                print("[OK] Menu items seeded in MongoDB.")
            if self.db['reservations'].count_documents({}) == 0:
                self.db['reservations'].insert_many(copy.deepcopy(_store['reservations']))
                print("[OK] Sample reservations seeded in MongoDB.")
        except Exception as e:
            print(f"[WARN] Seeding error: {e}")

    # ── Core CRUD ─────────────────────────────────────────────────────

    def find_one(self, collection_name, query):
        try:
            if self.db is not None:
                return self.db[collection_name].find_one(query)
            # In-memory fallback
            col = _store.get(collection_name, [])
            for doc in col:
                if _match(doc, query):
                    return copy.deepcopy(doc)
            return None
        except Exception as e:
            print(f"[ERR] find_one error: {e}")
            return None

    def find(self, collection_name, query=None, limit=None, sort=None):
        try:
            query = query or {}
            if self.db is not None:
                cursor = self.db[collection_name].find(query)
                if sort:
                    cursor = cursor.sort(sort)
                if limit:
                    cursor = cursor.limit(limit)
                return list(cursor)
            # In-memory fallback
            col = _store.get(collection_name, [])
            results = [copy.deepcopy(d) for d in col if _match(d, query)]
            if limit:
                results = results[:limit]
            return results
        except Exception as e:
            print(f"[ERR] find error: {e}")
            return []

    def count(self, collection_name, query=None):
        try:
            query = query or {}
            if self.db is not None:
                return self.db[collection_name].count_documents(query)
            col = _store.get(collection_name, [])
            return sum(1 for d in col if _match(d, query))
        except Exception as e:
            print(f"[ERR] count error: {e}")
            return 0

    def insert_one(self, collection_name, document):
        try:
            doc = copy.deepcopy(document)
            if '_id' not in doc:
                doc['_id'] = ObjectId()
            if self.db is not None:
                result = self.db[collection_name].insert_one(doc)
                return result
            # In-memory fallback
            if collection_name not in _store:
                _store[collection_name] = []
            _store[collection_name].append(doc)
            return _MockResult(doc['_id'])
        except Exception as e:
            print(f"[ERR] insert_one error: {e}")
            return None

    def update_one(self, collection_name, query, update_data):
        try:
            if self.db is not None:
                result = self.db[collection_name].update_one(query, {'$set': update_data})
                return result.modified_count
            col = _store.get(collection_name, [])
            for doc in col:
                if _match(doc, query):
                    doc.update(update_data)
                    return 1
            return 0
        except Exception as e:
            print(f"[ERR] update_one error: {e}")
            return None

    def delete_one(self, collection_name, query):
        try:
            if self.db is not None:
                result = self.db[collection_name].delete_one(query)
                return result.deleted_count
            col = _store.get(collection_name, [])
            for i, doc in enumerate(col):
                if _match(doc, query):
                    col.pop(i)
                    _store[collection_name] = col
                    return 1
            return 0
        except Exception as e:
            print(f"[ERR] delete_one error: {e}")
            return 0

    def delete_many(self, collection_name, query):
        try:
            if self.db is not None:
                result = self.db[collection_name].delete_many(query)
                return result.deleted_count
            col = _store.get(collection_name, [])
            before = len(col)
            _store[collection_name] = [d for d in col if not _match(d, query)]
            return before - len(_store[collection_name])
        except Exception as e:
            print(f"[ERR] delete_many error: {e}")
            return 0

    # ── Higher-level helpers (backward compat) ────────────────────────

    def create_reservation(self, reservation_data):
        reservation = {
            '_id': ObjectId(),
            'full_name':      reservation_data['full_name'],
            'email':          reservation_data['email'],
            'phone':          reservation_data['phone'],
            'num_people':     int(reservation_data['num_people']),
            'arrival_date':   reservation_data['arrival_date'],
            'arrival_time':   reservation_data['arrival_time'],
            'purpose':        reservation_data.get('purpose', 'dining'),
            'table_number':   reservation_data.get('table_number'),
            'table_capacity': reservation_data.get('table_capacity'),
            'status':         'confirmed',
            'total_amount':   reservation_data.get('total_amount', 0),
            'order_type':     reservation_data.get('order_type', 'dine-in'),
            'created_at':     datetime.utcnow(),
            'updated_at':     datetime.utcnow(),
        }
        result = self.insert_one('reservations', reservation)
        if result:
            print(f"[OK] Reservation created for {reservation['full_name']}")
        return result

    def get_reservations(self, filters=None, limit=None):
        reservations = self.find('reservations', filters or {}, limit)
        print(f"[DB] Retrieved {len(reservations)} reservations")
        return reservations

    def get_menu_items(self, category=None):
        query = {'category': category} if category else {}
        items = self.find('menu_items', query)
        print(f"[DB] Retrieved {len(items)} menu items")
        return items

    def get_analytics_data(self, date_range=None):
        total_reservations = self.count('reservations')
        reservations = self.find('reservations', {})
        total_revenue = sum(r.get('total_amount', 0) for r in reservations)
        menu_items = self.find('menu_items', {})
        top_dishes = sorted(menu_items, key=lambda x: x.get('orders_placed', 0), reverse=True)[:5]
        return {
            'total_reservations': total_reservations,
            'total_revenue': total_revenue,
            'average_order_value': round(total_revenue / max(total_reservations, 1)),
            'popular_dishes': [{'name': d['name'], 'orders': d.get('orders_placed', 0)} for d in top_dishes],
            'customer_satisfaction': 4.5,
            'table_utilization': 78.5,
            'generated_at': datetime.utcnow(),
        }

    def create_indexes(self):
        if self.db is None:
            return
        try:
            self.db['reservations'].create_index('email')
            self.db['reservations'].create_index('arrival_date')
            self.db['menu_items'].create_index('category')
            print("[OK] Database indexes created.")
        except Exception as e:
            print(f"[WARN] Index creation: {e}")

    def close_connection(self):
        if self.client:
            self.client.close()
            print("[OK] Database connection closed.")
