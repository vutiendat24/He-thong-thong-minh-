
import json
import matplotlib.pyplot as plt
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
import os
from redis.asyncio import Redis




import torch
from torch import nn
from transformers import AutoTokenizer, AutoModel
from sklearn.metrics import accuracy_score, f1_score

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import math
from collections import defaultdict
import pickle
import logging
from threading import Lock
import time
import matplotlib
matplotlib.use('Agg') 
# FastAPI imports
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# MongoDB imports
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, PyMongoError
from bson import ObjectId

from neo4j import GraphDatabase
# APScheduler for periodic tasks
from apscheduler.schedulers.background import BackgroundScheduler

# ============= CONFIGURATION =============
load_dotenv()


class Config:
    
    MONGO_URI = os.getenv("MONGO_URI")

    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
    
    NEO4J_URI="bolt://localhost:7687"
    NEO4J_USERNAME="neo4j"
    NEO4J_PASSWORD="tiendat1102"

    # Model Configuration
    MODEL_PATH = "models/"
    MODEL_UPDATE_INTERVAL = 3600
    
    # API Configuration
    API_HOST = "0.0.0.0"
    API_PORT = 8000
    
    # Feature Configuration
    CONTENT_DECAY_HALFLIFE = 3
    MAX_CANDIDATES = 1000
    DEFAULT_FEED_SIZE = 20
    MAX_FEED_SIZE = 100
    
    # Training Configuration
    TRAINING_LOOKBACK_DAYS = 60
    MIN_TRAINING_SAMPLES = 1
    CANDIDATES_LOOKBACK_DAYS=70
    # Interaction Types
    SOCIAL_INTERACTIONS = ['like', 'comment', 'share','view', 'click', 'skip']
    BEHAVIORAL_INTERACTIONS = ['view', 'click', 'skip']
    INTERACTION_DAY=30
    
    # Intelligence Configuration
    EXPLORATION_RATE_NEW = 0.30      # 30% cho user mới
    EXPLORATION_RATE_LEARNING = 0.20  # 20% cho user đang học
    EXPLORATION_RATE_EXPERT = 0.10    # 10% cho user expert
    
    # Context Weights
    CONTEXT_WEIGHTS = {
        'morning': {'status': 1.2, 'link': 1.3, 'photo': 1.0, 'video': 0.9},
        'afternoon': {'photo': 1.2, 'video': 1.1, 'status': 1.0, 'link': 1.1},
        'evening': {'video': 1.4, 'live_video': 1.3, 'photo': 1.1, 'status': 0.9},
        'night': {'status': 1.1, 'photo': 1.2, 'video': 0.8, 'link': 0.9}
    }

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= HELPER FUNCTIONS =============

def to_object_id(value):
    """Convert string or ObjectId to ObjectId"""
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, str):
        try:
            return ObjectId(value)
        except:
            return None
    return None

def to_object_id_list(values):
    """Convert list of values to list of ObjectIds"""
    result = []
    for v in values:
        oid = to_object_id(v)
        if oid:
            result.append(oid)
    return result

def oid_to_str(value):
    """Convert ObjectId to string"""
    if isinstance(value, ObjectId):
        return str(value)
    return value

# ============= DATABASE CONNECTION =============

class MongoDBManager:
    """Quản lý kết nối MongoDB"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.lock = Lock()
        self._connect()
        self._create_indexes()
    
    def _connect(self):
        """Kết nối đến MongoDB"""
        try:
            self.client = MongoClient(
                Config.MONGO_URI,
                serverSelectionTimeoutMS=5000,
                maxPoolSize=50
            )
            self.client.admin.command('ping')
            self.db = self.client[Config.MONGO_DB_NAME]
            logger.info(f"✓ Connected to MongoDB: {Config.MONGO_DB_NAME}")
        except ConnectionFailure as e:
            logger.error(f"✗ MongoDB connection failed: {str(e)}")
            raise
    
    def _create_indexes(self):
        """Tạo indexes cho performance"""
        try:
  
            
            # Posts
            self.db.posts.create_index([("created_at", DESCENDING)])
            self.db.posts.create_index([("engagement_score", DESCENDING)])
            self.db.posts.create_index([("post_type", ASCENDING)])
            self.db.posts.create_index([("_id", ASCENDING)])
            
        
            
            # Unified Interactions
            self.db.interactions.create_index([("userID", ASCENDING)])
            self.db.interactions.create_index([("postId", ASCENDING)])
            self.db.interactions.create_index([("eventType", ASCENDING)])
            self.db.interactions.create_index([("timestamp", DESCENDING)])
            self.db.interactions.create_index([("postId", ASCENDING), ("timestamp", DESCENDING)])

            self.db.interactions.create_index([
                ("userID", ASCENDING), 
                ("timestamp", DESCENDING)
            ])
            
            logger.info("✓ MongoDB indexes created")
        except Exception as e:
            logger.warning(f"Index creation warning: {str(e)}")
    
    def get_collection(self, collection_name: str):
        return self.db[collection_name]
    
    def find_to_dataframe(self, collection_name: str, query: dict, 
                         projection: dict = None, limit: int = None) -> pd.DataFrame:
        try:
            collection = self.get_collection(collection_name)
            cursor = collection.find(query, projection)
            if limit:
                cursor = cursor.limit(limit)
            data = list(cursor)
            if not data:
                return pd.DataFrame()
            for doc in data:
                if '_id' in doc:
                    doc['_id_str'] = str(doc['_id'])
            return pd.DataFrame(data)
        except Exception as e:
            logger.error(f"Error querying {collection_name}: {str(e)}")
            return pd.DataFrame()
    
    def aggregate_to_dataframe(self, collection_name: str, 
                              pipeline: List[dict]) -> pd.DataFrame:
        try:
            collection = self.get_collection(collection_name)
            data = list(collection.aggregate(pipeline))
            if not data:
                return pd.DataFrame()
            for doc in data:
                if '_id' in doc and isinstance(doc['_id'], ObjectId):
                    doc['_id_str'] = str(doc['_id'])
            return pd.DataFrame(data)
        except Exception as e:
            logger.error(f"Error in aggregation: {str(e)}")
            return pd.DataFrame()



class Neo4jManager:
    def __init__(self):
        self.driver = None
        self._connect()
        self._cache = {}

    def _connect(self):
        try:
            self.driver = GraphDatabase.driver(
                Config.NEO4J_URI,
                auth=(Config.NEO4J_USERNAME, Config.NEO4J_PASSWORD)
            )
            #  Kiểm tra kết nối ngay
            with self.driver.session() as session:
                result = session.run("RETURN ' Connected to Neo4j Aura!' AS message")
                print(result.single()["message"])
        except Exception as e:
            print(f" Neo4j connection failed: {e}")
            raise

    def close(self):
        if self.driver:
            self.driver.close()

    def get_friends(self, user_id):
      now = time.time()
      if user_id in self._cache and now - self._cache[user_id]['time'] < 300:  # 5 phút
            return self._cache[user_id]['data']
      query = """
      MATCH (u:User {id: $user_id})-[:FRIEND]-(friend:User)
      RETURN DISTINCT friend.id AS friend_id
      """
      with self.driver.session() as session:
          result = session.run(query, user_id=user_id)
          friends = [r["friend_id"] for r in result]

        # store to cache
      self._cache[user_id] = {"data": friends, "time": now}
      return friends


class RedisDBManager :
    def __init__(self):
        self.__connect()


    def __connect(self) :
        host = "localhost"
        port=6379 
        db=0 
        decode_responses=True
        self.redis = Redis(host=host, port=port, db=db, decode_responses=decode_responses)
    async def add_user_posts_recommend(self, userID: str, posts: List[Dict]):
        key = f"user_posts_recommend:{userID}"
        if posts:
            posts_serialized = [json.dumps(post) for post in posts]
            await self.redis.rpush(key, *posts_serialized)
            await self.redis.expire(key, 1*60)

    async def add_user_candidates(self, userID:str, candidates: List[ObjectId]):
        if not candidates:
            return  # 

        key = f"user_candidates:{userID}"
    
        
        candidates_str = [str(c) for c in candidates]
        key = f"user_candidates:{userID}"
        await self.redis.rpush(key,*candidates_str)
        await self.redis.expire(key, 2*60)

class CommentRequest(BaseModel):
    text: str
    threshold: float = 0.5


# ================= CONFIG =================
MODEL_NAME = "vinai/phobert-base"
MAX_LENGTH = 128
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
LABELS = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']

# ================= MODEL =================
class PhoBERTToxicClassifier(nn.Module):
    def __init__(self, num_labels, dropout=0.3):
        super().__init__()
        self.phobert = AutoModel.from_pretrained(MODEL_NAME)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.phobert.config.hidden_size, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.phobert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.last_hidden_state[:, 0, :]
        pooled_output = self.dropout(pooled_output)
        return self.classifier(pooled_output)

# ================= LOAD =================
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "phobert_toxic_best.pt")

print("Load model from:", MODEL_PATH)
assert os.path.exists(MODEL_PATH), "❌ Không tìm thấy file model"
model = PhoBERTToxicClassifier(len(LABELS))
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))

model.to(DEVICE)
model.eval()












# ============= INTELLIGENT ENGINE =============

class IntelligentEngine:

    
    def __init__(self):
        self.user_profiles = {}
        self.session_context = {}
        
        # Multi-Armed Bandit
        self.bandit_arms = defaultdict(lambda: {
            'successes': 0,
            'trials': 0,
            'avg_reward': 0.0
        })
        
        self.lock = Lock()
    
    # ========== REAL-TIME PERSONALIZATION ==========
    
    def update_user_profile(self, user_id: str, interaction_data: Dict):
        """Cập nhật profile real-time"""
        with self.lock:
            if user_id not in self.user_profiles:
                self.user_profiles[user_id] = {
                    'content_preferences': defaultdict(float),
                    'engagement_history': [],
                    'avg_dwell_time': {},
                    'total_interactions': 0,
                    'last_updated': datetime.now()
                }
            
            profile = self.user_profiles[user_id]
            
            # Update preferences
            content_type = interaction_data.get('content_type', 'status')
            event_type = interaction_data.get('event_type', 'view')
            
            # Reward weights
            rewards = {
                'skip': -0.1,
                'view': 0.1,
                'click': 0.3,
                'like': 0.5,
                'comment': 0.8,
                'share': 1.0
            }
            
            reward = rewards.get(event_type, 0.1)
            profile['content_preferences'][content_type] += reward
            profile['total_interactions'] += 1
            
            # Dwell time tracking
            if 'dwell_time' in interaction_data:
                if content_type not in profile['avg_dwell_time']:
                    profile['avg_dwell_time'][content_type] = []
                profile['avg_dwell_time'][content_type].append(
                    interaction_data['dwell_time']
                )
                # Keep last 50
                if len(profile['avg_dwell_time'][content_type]) > 50:
                    profile['avg_dwell_time'][content_type] = \
                        profile['avg_dwell_time'][content_type][-50:]
            
            profile['last_updated'] = datetime.now()
            
            logger.info(f"Profile updated for user {user_id[:8]}: {event_type} on {content_type}")
            
            return profile
    
    def get_personalized_weights(self, user_id: str) -> Dict[str, float]:
        """Lấy weights cá nhân hóa"""
        if user_id not in self.user_profiles:
            return {
                'photo': 1.0, 'video': 1.0, 'status': 1.0, 
                'link': 1.0, 'live_video': 1.0
            }
        
        profile = self.user_profiles[user_id]
        prefs = profile['content_preferences']
        
        if not prefs or sum(prefs.values()) == 0:
            return {
                'photo': 1.0, 'video': 1.0, 'status': 1.0, 
                'link': 1.0, 'live_video': 1.0
            }
        
        # Normalize
        total = sum(prefs.values())
        weights = {k: max(v/total * 5, 0.3) for k, v in prefs.items()}
        
        # Ensure all types
        for content_type in ['photo', 'video', 'status', 'link', 'live_video']:
            if content_type not in weights:
                weights[content_type] = 0.5
        
        return weights
    
    # ========== CONTEXTUAL AWARENESS ==========
    
    def get_context(self, user_id: str) -> Dict:
        """Phân tích context hiện tại"""
        now = datetime.now()
        hour = now.hour
        
        if 6 <= hour < 12:
            time_context = 'morning'
        elif 12 <= hour < 18:
            time_context = 'afternoon'
        elif 18 <= hour < 22:
            time_context = 'evening'
        else:
            time_context = 'night'
        
        session = self.session_context.get(user_id, {})
        
        return {
            'time_of_day': time_context,
            'hour': hour,
            'day_of_week': now.strftime('%A'),
            'is_weekend': now.weekday() >= 5,
            'session_posts_viewed': session.get('posts_viewed', 0),
            'session_duration': session.get('duration', 0)
        }
    
    def apply_contextual_boost(self, posts_df: pd.DataFrame, context: Dict) -> pd.DataFrame:
        time_context = context['time_of_day']
        boosts = Config.CONTEXT_WEIGHTS.get(time_context, {})
     

        posts_df['boost'] = posts_df['post_type'].map(boosts).fillna(1.0)
        posts_df['total_engagement'] *= posts_df['boost']
        posts_df.drop(columns=['boost'], inplace=True)

        
        # Weekend boost
        if context['is_weekend']:
            entertainment = posts_df['post_type'].isin(['video'])
            posts_df.loc[entertainment, 'total_engagement'] *= 1.15
        
        
        if context['session_posts_viewed'] > 30:
            posts_df['total_engagement'] *= 0.9
        
        return posts_df
    
    # ========== EXPLORATION-EXPLOITATION ==========
    
    def should_explore(self, user_id: str) -> bool:
        
        profile = self.user_profiles.get(user_id, {})
        total_interactions = profile.get('total_interactions', 0)
        
        if total_interactions < 50:
            rate = Config.EXPLORATION_RATE_NEW
        elif total_interactions < 200:
            rate = Config.EXPLORATION_RATE_LEARNING
        else:
            rate = Config.EXPLORATION_RATE_EXPERT
        
        return np.random.random() < rate
    
    def get_exploration_items(self, user_id: str, posts_df: pd.DataFrame, n: int = 3) -> pd.DataFrame:
    
        profile = self.user_profiles.get(user_id, {})
        prefs = profile.get('content_preferences', {})
        
        if not prefs:
            return posts_df.sample(min(n, len(posts_df)))
        
        # Find least preferred types
        min_pref = min(prefs.values()) if prefs else 0
        unexplored = [k for k, v in prefs.items() if v <= min_pref * 1.5]
        
        if unexplored:
            exploration_df = posts_df[posts_df['post_type'].isin(unexplored)]
            if len(exploration_df) > 0:
                return exploration_df.sample(min(n, len(exploration_df)))
        
        return posts_df.sample(min(n, len(posts_df)))
    
    # ========== MULTI-ARMED BANDIT ==========
    
    def update_bandit(self, post_id: str, reward: float):
        """Update Thompson Sampling bandit"""
        with self.lock:
            arm = self.bandit_arms[post_id]
            arm['trials'] += 1
            arm['successes'] += reward
            arm['avg_reward'] = arm['successes'] / arm['trials'] if arm['trials'] > 0 else 0
    
    def get_bandit_score(self, post_id: str) -> float:
        arm = self.bandit_arms[post_id]
        
        if arm['trials'] == 0:
            return 0.5
        
        alpha = arm['successes'] + 1
        beta = arm['trials'] - arm['successes'] + 1
        
        return np.random.beta(alpha, beta)

    # ========== SESSION MANAGEMENT ==========
    
    def update_session(self, user_id: str, action: str):
        """Update session context"""
        if user_id not in self.session_context:
            self.session_context[user_id] = {
                'start_time': datetime.now(),
                'posts_viewed': 0,
                'duration': 0
            }
        
        session = self.session_context[user_id]
        
        if action == 'view_post':
            session['posts_viewed'] += 1
        
        session['duration'] = (datetime.now() - session['start_time']).seconds
    
    def clear_old_sessions(self, max_age_minutes: int = 30):
        now = datetime.now()
        to_remove = []
        
        for user_id, session in self.session_context.items():
            age = (now - session['start_time']).seconds / 60
            if age > max_age_minutes:
                to_remove.append(user_id)
        
        for user_id in to_remove:
            del self.session_context[user_id]

# ============= PYDANTIC MODELS =============

class FeedRequest(BaseModel):
    user_id: str = Field(..., description="ObjectId của user")
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    exclude_post_ids: Optional[List[str]] = Field(default=None)

class ExplanationModel(BaseModel):
    reason: str
    message: str
    icon: str
    confidence: float

class PostResponse(BaseModel):
    post_id: str
    author_id: str
    post_type: str
    content: str
    created_at: str
    score: float
    is_exploration: bool
  

class FeedResponse(BaseModel):
    user_id: str
    posts: List[Dict]
    total_candidates: int
    generation_time_ms: float
    timestamp: datetime
    context: Dict
    personalization_active: bool
    exploration_mode: bool

class FeedbackRequest(BaseModel):
    user_id: str
    post_id: str
    event_type: str
    dwell_time: Optional[int] = None
    content_type: Optional[str] = None

class ModelStatusResponse(BaseModel):
    status: str
    last_trained: Optional[datetime]
    models_loaded: Dict[str, bool]
    training_samples: Optional[int]
    intelligent_features: Dict[str, bool]

class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    models_loaded: bool
    intelligent_engine_active: bool
    uptime_seconds: float

# ============= RANKING ALGORITHM (INTEGRATED) =============

class RankingAlgorithm:
 
    
    def __init__(self, db_manager: MongoDBManager, neo4j_db : Neo4jManager, redis_db: RedisDBManager):
        self.db = db_manager
        self.intelligent_engine = IntelligentEngine()
        self.neo4j_db = neo4j_db
        self.redis_db= redis_db
        # ML Models
        self.engagement_models = {
            'like': None,
            'comment': None,
            'share': None,
            'click': None,
            'view': None
        }
        self.scaler = StandardScaler()
        self.model_lock = Lock()
        self.last_trained = None
        self.training_samples = 0
        
        self._load_models()
    
    def _load_models(self):
        """Load models"""
        try:
            if not os.path.exists(Config.MODEL_PATH):
                os.makedirs(Config.MODEL_PATH)
                return
            
            with self.model_lock:
                scaler_path = os.path.join(Config.MODEL_PATH, "scaler.pkl")
                if os.path.exists(scaler_path):
                    with open(scaler_path, 'rb') as f:
                        self.scaler = pickle.load(f)
                    logger.info("Loaded scaler")
                
                for model_type in self.engagement_models.keys():
                    model_path = os.path.join(Config.MODEL_PATH, f"model_{model_type}.pkl")
                    if os.path.exists(model_path):
                        with open(model_path, 'rb') as f:
                            self.engagement_models[model_type] = pickle.load(f)
                        logger.info(f"Loaded {model_type} model")
                
                meta_path = os.path.join(Config.MODEL_PATH, "metadata.pkl")
                if os.path.exists(meta_path):
                    with open(meta_path, 'rb') as f:
                        metadata = pickle.load(f)
                        self.last_trained = metadata.get('last_trained')
                        self.training_samples = metadata.get('training_samples', 0)
        
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
    
    def _save_models(self):
        try:
            scaler_path = os.path.join(Config.MODEL_PATH, "scaler.pkl")
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            for model_type, model in self.engagement_models.items():
                if model is not None:
                    model_path = os.path.join(Config.MODEL_PATH, f"model_{model_type}.pkl")
                    with open(model_path, 'wb') as f:
                        pickle.dump(model, f)
            
            metadata = {
                'last_trained': datetime.now(),
                'training_samples': self.training_samples
            }
            meta_path = os.path.join(Config.MODEL_PATH, "metadata.pkl")
            with open(meta_path, 'wb') as f:
                pickle.dump(metadata, f)
            
            self.last_trained = metadata['last_trained']
            logger.info("Models saved successfully")
    
        except Exception as e:
            logger.error(f"Error saving models: {str(e)}")
    
    # ========== CANDIDATE GENERATION ==========
    
    async def generate_candidates(self, user_id: str, max_candidates: int = 1000) -> List[ObjectId]: 
        start = time.time()
        key = f"user_candidates:{user_id}"
        exist_cache = await self.redis_db.redis.exists(key)
        if(exist_cache):
            print("load from candidates cache")
            candidates = await self.redis_db.redis.lrange(key, 0, -1)
            return [ObjectId(c) for c in candidates]

        
        user_oid = to_object_id(user_id)
        if not user_oid:
            return []
        
       
        friends = self.neo4j_db.get_friends(user_id)
        
        candidates = []
        
        # Friend posts
        if len(friends) > 0:
            friend_posts_query = {
                "userID": {"$in": friends},
                "created_at": {"$gte": datetime.now() - timedelta(days=7)},
                "is_deleted": {"$ne": True}
            }
            friend_posts_df = self.db.find_to_dataframe(
                "posts", friend_posts_query, {"_id": 1}, limit=int(max_candidates * 0.7)
            )
            if friend_posts_df is not None and not friend_posts_df.empty and '_id' in friend_posts_df.columns:
                candidates.extend(friend_posts_df['_id'].tolist())
        
        # Suggested posts
        suggested_query = {
            "created_at": {"$gte": datetime.now() - timedelta(hours=Config.CANDIDATES_LOOKBACK_DAYS)},
        }
        pipeline = [
            {"$match": suggested_query},
            {"$sort": {"engagement_score": -1}},
            {"$limit": int(max_candidates * 0.3)},
            {"$project": {"_id": 1}}
        ]
        suggested_df = self.db.aggregate_to_dataframe("posts", pipeline)
        if suggested_df  is not None and not suggested_df.empty and '_id' in suggested_df.columns:
            candidates.extend(suggested_df['_id'].tolist())
        
        unique_candidates = list(set([c for c in candidates if isinstance(c, ObjectId)]))
        end = time.time()
        # print("Generate candidate:", round(time.time() - start, 3), "s")
        if unique_candidates :
            await self.redis_db.add_user_candidates(user_id, unique_candidates[:max_candidates])
        return unique_candidates[:max_candidates]
    
    # ========== FEATURE EXTRACTION ==========
    
    def extract_features(self, user_id: str, post_ids: List[ObjectId]) -> pd.DataFrame:
        user_oid = to_object_id(user_id)
        if not user_oid or not post_ids:
            return pd.DataFrame()
        
        # Get posts
        # timeCount_extract_featuresT1 = time.time()
        posts_query = {"_id": {"$in": post_ids}}
        posts_df = self.db.find_to_dataframe("posts", posts_query)
        
        if len(posts_df) == 0:
            return pd.DataFrame()
        
        # author_ids = posts_df['userID'].unique().tolist()
        # print("timeCount_extract_featuresT1",  round(time.time() - timeCount_extract_featuresT1, 3), "s")
        # Get interactions
        # timeCount_extract_featuresT2 = time.time()
        
        interactions_query = {
            "postId": {"$in": post_ids},
            "timestamp": {"$gte": datetime.now() - timedelta(days=Config.INTERACTION_DAY)}
        }
        projection = {"userID": 1, "eventType": 1, "postId": 1, "timestamp": 1, "target_userID": 1}
        interactions_df = self.db.find_to_dataframe("interactions", interactions_query, projection)


        
        # print("timeCount_extract_featuresT2",  round(time.time() - timeCount_extract_featuresT2, 3), "s")
        # Get connections
        # timeCount_extract_featuresT3 = time.time()
        
        friendList = self.neo4j_db.get_friends(user_id)
        connections_df = pd.DataFrame(friendList, columns=["friend_id"])
        # print("timeCount_extract_featuresT3",  round(time.time() - timeCount_extract_featuresT3, 3), "s")
        # Get history
        # timeCount_extract_featuresT4 = time.time()
        history_query = {
            "userID": user_oid,
            "timestamp": {"$gte": datetime.now() - timedelta(days=90)}
        }
        history_df = self.db.find_to_dataframe("interactions", history_query)
        
        # print("timeCount_extract_featuresT4",  round(time.time() - timeCount_extract_featuresT4, 3), "s")
        # Extract features
        # timeCount_extract_featuresT5 = time.time()

        def process_post(post_tuple):
            _, post = post_tuple
            return self._extract_post_features(user_oid, post, interactions_df, connections_df, history_df, friendList)

        with ThreadPoolExecutor(max_workers=6) as executor:
            features_list = list(executor.map(process_post, posts_df.iterrows()))
        
        features_df = pd.DataFrame(features_list)
        # print("timeCount_extract_featuresT5",  round(time.time() - timeCount_extract_featuresT5, 3), "s")
        return features_df
        
    
    def _extract_post_features(self, user_oid: ObjectId, post: pd.Series,
                               interactions: pd.DataFrame,
                               connections: pd.DataFrame,
                               history: pd.DataFrame,
                              friendList: List[str]) -> Dict:
       
        affinity = self._calculate_affinity_score(
            user_oid, post['userID'], interactions, connections
        )
        
        time_decay = self._calculate_time_decay(post['created_at'])
        # NẾU KHÔNG CÓ TƯƠNG TÁC TRONG 30 NGAY THÌ ĐỀ XUẤT BÀI VIẾT MỚI HOÀN TOÀN 
        # Nếu không có tương tác nào trong 30 ngày
        if interactions is None or interactions.empty:
            post_interactions = pd.DataFrame()
            likes = comments = shares = views = 0
        else:
            post_interactions = interactions[interactions['postId'] == post['_id']]
            likes = len(post_interactions[post_interactions['eventType'] == 'like'])
            comments = len(post_interactions[post_interactions['eventType'] == 'comment'])
            shares = len(post_interactions[post_interactions['eventType'] == 'share'])
            views = len(post_interactions[post_interactions['eventType'] == 'view'])


        
        total_engagement = likes + comments * 2 + shares * 3
        
        # Social proof
        friends = friendList
        if post_interactions is None or post_interactions.empty or 'userID' not in post_interactions.columns:
            friends_liked = 0
            friends_commented = 0
            friends_shared = 0
        else:
            friends_liked = len(post_interactions[
                post_interactions['userID'].isin(friends) & 
                (post_interactions['eventType'] == 'like')
            ]) if len(friends) > 0 else 0
            
            friends_commented = len(post_interactions[
                post_interactions['userID'].isin(friends) & 
                (post_interactions['eventType'] == 'comment')
            ]) if len(friends) > 0 else 0
            
            friends_shared = len(post_interactions[
                post_interactions['userID'].isin(friends) & 
                (post_interactions['eventType'] == 'share')
            ]) if len(friends) > 0 else 0
        
        post_created = pd.to_datetime(post['created_at'])
        post_age_hours = (datetime.now() - post_created).total_seconds() / 3600
        
        return {
            'user_id': str(user_oid),
            'post_id': str(post['_id']),
            'author_id': str(post['userID']),
            'affinity_score': affinity,
            'post_type': post.get('post_type', 'status'),
            'time_decay': time_decay,
            'post_age_hours': post_age_hours,
            'total_likes': likes,
            'total_comments': comments,
            'total_shares': shares,
            'total_views': views,
            'total_engagement': total_engagement,
            'friends_liked': friends_liked,
            'friends_commented': friends_commented,
            'friends_shared': friends_shared,
            'content': post.get('content', '')
        }
    
    def _calculate_affinity_score(self, user_oid: ObjectId, author_oid: ObjectId,
                                 interactions: pd.DataFrame,
                                 connections: pd.DataFrame) -> float:
        is_friend = len(connections[(connections['friend_id'] == author_oid)]) > 0 if len(connections) > 0 else False
        
        if interactions is None or interactions.empty:
            return 0.05


            
        user_author_interactions = interactions[
            (interactions['userID'] == user_oid) & 
            (interactions['target_userID'] == author_oid)
        ]
        if not is_friend and len(user_author_interactions) == 0:
            return 0.05
        
        if not is_friend:
            return 0.15
        
        base_affinity = 0.3
        
        if len(user_author_interactions) == 0:
            return base_affinity
        
        interaction_weights = {
            'like': 1.0, 'comment': 2.0, 'share': 3.0,
            'click': 1.5, 'view': 0.5
        }
        
        total_affinity = 0
        for _, interaction in user_author_interactions.iterrows():
            weight = interaction_weights.get(interaction['eventType'], 1.0)
            timestamp = pd.to_datetime(interaction['timestamp'])
            days_ago = (datetime.now() - timestamp).days
            time_factor = math.exp(-days_ago / 30)
            total_affinity += weight * time_factor
        
        affinity = min(base_affinity + (total_affinity / 50), 1.0)
        
        if total_affinity > 30:
            affinity = min(affinity * 1.3, 1.0)
        
        return affinity
    
    def _calculate_time_decay(self, created_at) -> float:
        if isinstance(created_at, str):
            created_at = pd.to_datetime(created_at)
        
        age_hours = (datetime.now() - created_at).total_seconds() / 3600
        decay = 0.5 ** (age_hours / Config.CONTENT_DECAY_HALFLIFE)
        return max(decay, 0.01)
    
    # ========== INTELLIGENT FEED GENERATION ==========
    
    async def generate_intelligent_feed(self, user_id: str, limit: int = 20,
                                  exclude_post_ids: List[str] = None) -> Dict:
  
        start_time = time.time()
        
        try:
            key = f"user_posts_recommend:{user_id}"

            #  Kiểm tra cache trong redis co ton tai bai viet de xuat hay chua
            exist_cache = await self.redis_db.redis.exists(key)
            if exist_cache:
                print("Load posts recommend from cache")
                cached_posts = await self.redis_db.redis.lrange(key, 0, -1)
                feed = [json.loads(p) for p in cached_posts]
                context = self.intelligent_engine.get_context(user_id)                
                exploration_mode = self.intelligent_engine.should_explore(user_id)
                generation_time = time.time() - start_time
                return {
                    'posts': feed,
                    'context': context,
                    'personalization_active': False,
                    'exploration_mode': exploration_mode,
                    'generation_time_ms': generation_time,
                    'total_candidates': 100,
                }
            # 1. GET CONTEXT
            # timeCount_t1 = time.time()
            context = self.intelligent_engine.get_context(user_id)
            logger.info(f"Context for {user_id[:8]}: {context['time_of_day']}, "
                       f"weekend={context['is_weekend']}")
            # print("t1",  round(time.time() - timeCount_t1, 3), "s")
            # 2. GET PERSONALIZED WEIGHTS
            # timeCount_t2 = time.time()
            user_weights = self.intelligent_engine.get_personalized_weights(user_id)
            logger.info(f"User weights: {user_weights}")
            # print("t2",  round(time.time() - timeCount_t2, 3), "s")
            # 3. DECIDE EXPLORATION
            # timeCount_t3 = time.time()
            exploration_mode = self.intelligent_engine.should_explore(user_id)
            logger.info(f"Exploration mode: {exploration_mode}")
            # print("t3",  round(time.time() - timeCount_t3, 3), "s")
            # 4. GENERATE CANDIDATE
            candidates = await self.generate_candidates(user_id, Config.MAX_CANDIDATES)
            
            if exclude_post_ids:
                exclude_oids = to_object_id_list(exclude_post_ids)
                candidates = [p for p in candidates if p not in exclude_oids]
            
            if not candidates:
                return {
                    'posts': [],
                    'context': context,
                    'personalization_active': False,
                    'exploration_mode': False,
                    'generation_time_ms': 0
                }
            
            # 5. EXTRACT FEATURES
            # timeCount_t5 = time.time()
            features = self.extract_features(user_id, candidates)
            
           
            if features is None or len(features) == 0:
                # Không có tương tác thì trả về bài viết mới nhất
                fallback_posts = self.db.find_to_dataframe(
                    "posts",
                    {
                         "created_at": {"$gte": datetime.now() - timedelta(days=90)},
                    },
                    limit=limit
                ).sort_values("created_at", ascending=False).head(limit)
                
                feed = []
                for _, p in fallback_posts.iterrows():
                    feed.append({
                        "post_id": str(p["_id"]),
                        "author_id": str(p["userID"]),
                        "post_type": p.get("post_type", "status"),
                        "content": p["content"],
                        "created_at": str(p["created_at"]),
                        "score": 0,
                        "is_exploration": True
                    })
                
                generation_time = (time.time() - start_time) * 1000
                return {
                    "posts": feed,
                    "context": context,
                    "personalization_active": False,
                    "exploration_mode": True,
                    "generation_time_ms": generation_time,
                    "total_candidates": len(feed)
                }

            # print("t5",  round(time.time() - timeCount_t5, 3), "s")
            # 6. APPLY PERSONALIZED WEIGHTS
            # timeCount_t6 = time.time()
            if 'post_type' in features.columns:
                for content_type, weight in user_weights.items():
                    mask = features['post_type'] == content_type
                    features.loc[mask, 'total_engagement'] *= weight
            else:
                 logger.warning(f"Column 'post_type' missing in features for user {user_id}")
            for content_type, weight in user_weights.items():
                mask = features['post_type'] == content_type
                features.loc[mask, 'total_engagement'] *= weight
            # print("t6",  round(time.time() - timeCount_t6, 3), "s")
            # 7. APPLY CONTEXTUAL BOOST
            # timeCount_t7 = time.time()
            features = self.intelligent_engine.apply_contextual_boost(features, context)
            # print("t7",  round(time.time() - timeCount_t7, 3), "s")
            # 8. ADD BANDIT SCORES
            # timeCount_t8 = time.time()
            features['bandit_score'] = features['post_id'].apply(
                self.intelligent_engine.get_bandit_score
            )
            # print("t8",  round(time.time() - timeCount_t8, 3), "s")
            # 9. CALCULATE FINAL SCORE
            # timeCount_t9 = time.time()
            features['final_score'] = (
                features['total_engagement'] * 0.4 +
                features['affinity_score'] * 100 * 0.3 +
                features['time_decay'] * 50 * 0.2 +
                features['bandit_score'] * 50 * 0.1
            )
            # print("t9",  round(time.time() - timeCount_t9, 3), "s")
            # 10. EXPLORATION INJECTION
            # timeCount_t10 = time.time()
            features['is_exploration'] = False
            if exploration_mode and len(features) > 5:
                exploration_items = self.intelligent_engine.get_exploration_items(
                    user_id, features, n=3
                )
                if len(exploration_items) > 0:
                    exploration_indices = exploration_items.index
                    features.loc[exploration_indices, 'final_score'] *= 1.5
                    features.loc[exploration_indices, 'is_exploration'] = True
                    logger.info(f"Injected {len(exploration_items)} exploration items")
            # print("t10",  round(time.time() - timeCount_t10, 3), "s")
            # 11. SORT BY FINAL SCORE
            # timeCount_t11 = time.time()
            features = features.sort_values('final_score', ascending=False)
            
                        # 12. GET POST DETAILS
            post_ids_str = features.head(limit)['post_id'].tolist()

            # Convert post_ids_str → ObjectId list an toàn
            post_oids = []
            for pid in post_ids_str:
                try:
                    post_oids.append(ObjectId(pid))
                except:
                    logger.warning(f"[Feed] Invalid ObjectId: {pid}")
                    continue

            posts_query = {"_id": {"$in": post_oids}}
            posts_df = self.db.find_to_dataframe("posts", posts_query)

            if len(posts_df) == 0 or '_id' not in posts_df.columns:
                logger.error(f"[Feed] Không tìm thấy bài viết phù hợp! "
                             f"Số lượng features={len(features)}, query={posts_query}, "
                             f"columns={posts_df.columns.tolist() if len(posts_df)>0 else 'EMPTY'}")
                return {
                    'posts': [],
                    'context': context,
                    'personalization_active': user_id in self.intelligent_engine.user_profiles,
                    'exploration_mode': exploration_mode,
                    'generation_time_ms': (time.time() - start_time) * 1000,
                    'total_candidates': len(candidates)
                }

            posts_dict = posts_df.set_index('_id').to_dict('index')
            # print("t11",  round(time.time() - timeCount_t11, 3), "s")
            # 13. FORMAT RESPONSE WITH EXPLANATIONS

            feed = []
            for _, row in features.head(limit).iterrows():
                post_id_str = row['post_id']
                post_oid = to_object_id(post_id_str)
                post_data = posts_dict.get(post_oid, {})

                # ✅ Nếu post không tồn tại trong posts_dict, bỏ qua
                if not post_data:
                    logger.warning(f"[Feed] Post {post_id_str} không tồn tại trong posts_dict")
                    continue

                post_dict = {
                    'post_id': post_id_str,
                    'author_id': row['author_id'],
                    'post_type': post_data.get('post_type', 'status'),
                    'content': post_data.get('content', ''),
                    'created_at': str(post_data.get('created_at', '')),
                    'score': float(row['final_score']),
                    'affinity_score': float(row['affinity_score']),
                    'friends_liked': int(row.get('friends_liked', 0)),
                    'friends_commented': int(row.get('friends_commented', 0)),
                    'friends_shared': int(row.get('friends_shared', 0)),
                    'total_engagement': int(row.get('total_engagement', 0)),
                    'is_exploration': bool(row['is_exploration'])
                }

             

                feed.append(post_dict)

            # 14. UPDATE SESSION
            self.intelligent_engine.update_session(user_id, 'view_post')

            generation_time = (time.time() - start_time) * 1000
            logger.info(f"Generated intelligent feed for {user_id[:8]}: "
                        f"{len(feed)} posts in {generation_time:.2f}ms")
            # print("end",  round(time.time() - timeCount_t1, 3), "s")


            await self.redis_db.add_user_posts_recommend(user_id, feed)
            return {
                'posts': feed,
                'context': context,
                'personalization_active': user_id in self.intelligent_engine.user_profiles,
                'exploration_mode': exploration_mode,
                'generation_time_ms': generation_time,
                'total_candidates': len(candidates),
            }


        
        except Exception as e:
            error_type = type(e).__name__
            error_message = str(e)
            
            logger.error(f"Error generating intelligent feed. Type: {error_type}. Message: {error_message}")
            
            raise
    
    # ========== FEEDBACK PROCESSING ==========
    
    def process_feedback(self, user_id: str, post_id: str, 
                        event_type: str, **kwargs) -> Dict:
        """
        Process feedback và trigger learning
        """
        try:
            # 1. Update real-time profile
            interaction_data = {
                'event_type': event_type,
                'content_type': kwargs.get('content_type', 'status'),
                'dwell_time': kwargs.get('dwell_time'),
                'timestamp': datetime.now()
            }
            
            self.intelligent_engine.update_user_profile(user_id, interaction_data)
            
            # 2. Update bandit
            rewards = {
                'skip': 0.0,
                'view': 0.2,
                'click': 0.4,
                'like': 0.6,
                'comment': 0.8,
                'share': 1.0
            }
            reward = rewards.get(event_type, 0.1)
            self.intelligent_engine.update_bandit(post_id, reward)
            
            # 3. Save to database
            user_oid = to_object_id(user_id)
            post_oid = to_object_id(post_id)
            
            if user_oid and post_oid:
                posts_collection = self.db.get_collection("posts")
                post = posts_collection.find_one({"_id": post_oid}, {"userID": 1})
                
                if post:
                    interactions_collection = self.db.get_collection("interactions")
                    interaction_doc = {
                        "userID": user_oid,
                        "postId": post_oid,
                        "eventType": event_type,
                        "timestamp": datetime.now(),
                        "device_type": kwargs.get('device_type', 'web'),
                        "metadata": {
                            "source": "api_feedback"
                        }
                    }
                    
                    # Add target_userID for social interactions
                    if event_type in Config.SOCIAL_INTERACTIONS:
                        interaction_doc["target_userID"] = post['userID']
                    
                    # Add dwell_time for behavioral interactions
                    if event_type in Config.BEHAVIORAL_INTERACTIONS and kwargs.get('dwell_time'):
                        interaction_doc["dwell_time"] = kwargs['dwell_time']
                    
                    interactions_collection.insert_one(interaction_doc)
                    
                    # Update engagement score for social interactions
                    if event_type in Config.SOCIAL_INTERACTIONS:
                        posts_collection.update_one(
                            {"_id": post_oid},
                            {"$inc": {"engagement_score": 1}}
                        )
            
            logger.info(f"Processed feedback: {user_id[:8]} {event_type} on {post_id[:8]}")
            
            return {
                'status': 'success',
                'learning_applied': True,
                'profile_updated': True,
                'bandit_updated': True
            }
        
        except Exception as e:
            logger.error(f"Error processing feedback: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    # ========== MODEL TRAINING ==========
    
    def train_models(self):      
      logger.info("Starting model training...")

      try:
          training_query = {
              "timestamp": {"$gte": datetime.now() - timedelta(days=Config.TRAINING_LOOKBACK_DAYS)},
              "eventType": {"$in": Config.SOCIAL_INTERACTIONS}
          }

          pipeline = [
              {"$match": training_query},
              {"$lookup": {
                  "from": "posts",
                  "localField": "postId",
                  "foreignField": "_id",
                  "as": "post_info"
              }},
              {"$unwind": "$post_info"},
              {"$project": {
                  "userID": 1,
                  "postId": 1,
                  "author_id": "$post_info.userID",
                  "post_type": "$post_info.post_type",
                  "eventType": 1
              }},
              {"$limit": 50000}
          ]

          training_df = self.db.aggregate_to_dataframe("interactions", pipeline)

          if len(training_df) < Config.MIN_TRAINING_SAMPLES:
              logger.warning(f"Insufficient training data: {len(training_df)}")
              return

          sample_users = training_df['userID'].unique()[:100]
          all_features = []
          all_labels = {key: [] for key in self.engagement_models.keys()}

          for user_oid in sample_users:
              user_id_str = str(user_oid)
              user_interactions = training_df[training_df['userID'] == user_oid]
              post_oids = user_interactions['postId'].unique()[:100].tolist()

              try:
                  features = self.extract_features(user_id_str, post_oids)
                  if len(features) == 0:
                      continue

                  for _, feature_row in features.iterrows():
                      post_id_str = feature_row['post_id']
                      post_oid = to_object_id(post_id_str)
                      post_interactions = user_interactions[
                          user_interactions['postId'] == post_oid
                      ]

                      all_features.append(feature_row.to_dict())

                      for interaction_type in all_labels.keys():
                          has_interaction = len(post_interactions[
                              post_interactions['eventType'] == interaction_type
                          ]) > 0
                          all_labels[interaction_type].append(int(has_interaction))

              except Exception as e:
                  logger.error(f"Error processing user: {str(e)}")
                  continue

          if len(all_features) < Config.MIN_TRAINING_SAMPLES:
              logger.warning("Not enough features for training")
              return

          features_df = pd.DataFrame(all_features)
          feature_cols = [col for col in features_df.columns
                          if col not in ['user_id', 'post_id', 'author_id', 'content']]

          X = features_df[feature_cols].fillna(0)
          X = pd.get_dummies(X, columns=['post_type'], drop_first=True)

          with self.model_lock:
              X_scaled = self.scaler.fit_transform(X)

              plot_dir = os.path.join(Config.MODEL_PATH, "plots")
              os.makedirs(plot_dir, exist_ok=True)

              for engagement_type, labels in all_labels.items():
                  logger.info(f"{engagement_type}: positives={sum(labels)}, negatives={len(labels)-sum(labels)}")

                  if len(set(labels)) < 2:
                      logger.warning(f"Skipping {engagement_type}")
                      continue

                  logger.info(f"Training {engagement_type} model...")

                  model = GradientBoostingClassifier(
                      n_estimators=100,
                      learning_rate=0.05,
                      max_depth=5,
                      random_state=42,
                      validation_fraction=0.2,
                      n_iter_no_change=10
                  )

                  model.fit(X_scaled, labels)
                  self.engagement_models[engagement_type] = model
                  logger.info(f"✓ {engagement_type} model trained")

                  # === ĐÁNH GIÁ ===
                  y_pred = model.predict(X_scaled)
                  acc = accuracy_score(labels, y_pred)
                  f1 = f1_score(labels, y_pred)
                  logger.info(f"{engagement_type} - Accuracy: {acc:.4f}, F1: {f1:.4f}")

                  # === LƯU BIỂU ĐỒ ===
                  try:
                      # Training loss
                      train_loss = model.train_score_
                      plt.figure(figsize=(8, 4))
                      plt.plot(np.arange(len(train_loss)), train_loss, marker='o')
                      plt.title(f"Training Loss - {engagement_type}")
                      plt.xlabel("Boosting Iteration")
                      plt.ylabel("Deviance (Loss)")
                      plt.grid(True)
                      plt.tight_layout()
                      loss_path = os.path.join(plot_dir, f"train_loss_{engagement_type}.png")
                      plt.savefig(loss_path)
                      plt.close()

                      # Feature importance
                      feature_importances = model.feature_importances_
                      sorted_idx = np.argsort(feature_importances)[::-1][:10]
                      plt.figure(figsize=(8, 4))
                      plt.bar(range(len(sorted_idx)), feature_importances[sorted_idx])
                      plt.xticks(range(len(sorted_idx)), np.array(X.columns)[sorted_idx],
                                rotation=45, ha="right")
                      plt.title(f"Top 10 Feature Importances - {engagement_type}")
                      plt.tight_layout()
                      importance_path = os.path.join(plot_dir, f"feature_importance_{engagement_type}.png")
                      plt.savefig(importance_path)
                      plt.close()

                      logger.info(f"Saved plots for {engagement_type} to {plot_dir}")

                  except Exception as plot_err:
                      logger.warning(f"Plot error: {plot_err}")

              self.training_samples = len(all_features)
              self._save_models()

              logger.info(f"✓ Training completed: {self.training_samples} samples")

      except Exception as e:
          logger.error(f"Error during training: {str(e)}")
          raise

  
  # ============= FASTAPI APPLICATION =============

app = FastAPI(
    title="Intelligent Social Media Recommendation API",
    description="AI-powered intelligent recommendation system with real-time learning",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
db_manager = MongoDBManager()
neo4jDB = Neo4jManager()
redis_db = RedisDBManager()


ranking_algo = RankingAlgorithm(db_manager, neo4jDB, redis_db)
scheduler = BackgroundScheduler()
app_start_time = time.time()

# ============= SCHEDULED TASKS =============

def scheduled_model_training():
    try:
        logger.info("Starting scheduled model training...")
        ranking_algo.train_models()
        logger.info("Scheduled training completed")
    except Exception as e:
        logger.error(f"Scheduled training failed: {str(e)}")

def scheduled_session_cleanup():
    try:
        ranking_algo.intelligent_engine.clear_old_sessions()
        logger.info("Session cleanup completed")
    except Exception as e:
        logger.error(f"Session cleanup failed: {str(e)}")

def start_scheduler():
    scheduler.add_job(
        scheduled_model_training,
        'interval',
        seconds=Config.MODEL_UPDATE_INTERVAL,
        id='model_training',
        replace_existing=True
    )
    
    scheduler.add_job(
        scheduled_session_cleanup,
        'interval',
        seconds=1800,  # 30 minutes
        id='session_cleanup',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started")

# ============= API ENDPOINTS =============

@app.on_event("startup")
async def startup_event():
    """Initialize application"""
    logger.info("Starting Intelligent Recommendation API...")
    
    try:
        db_manager.client.admin.command('ping')
        logger.info("✓ MongoDB connected")
    except Exception as e:
        logger.error(f"✗ MongoDB failed: {str(e)}")
    
    start_scheduler()
    
    if ranking_algo.last_trained is None:
        logger.info("Initiating first training...")
        try:
            ranking_algo.train_models()
        except Exception as e:
            logger.warning(f"Initial training failed: {str(e)}")
    
    logger.info("✓ Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    if db_manager.client:
        db_manager.client.close()
    logger.info("Application shutdown complete")

@app.post("/api/comment-toxic-predict")
def predict_toxic(req: CommentRequest):
    encoding = tokenizer(
        req.text,
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt"
    )

    input_ids = encoding["input_ids"].to(DEVICE)
    attention_mask = encoding["attention_mask"].to(DEVICE)

    with torch.no_grad():
        logits = model(input_ids, attention_mask)
        probs = torch.sigmoid(logits).cpu().numpy()[0]

    results = {
        label: float(prob)
        for label, prob in zip(LABELS, probs)
    }

    toxic_labels = [
        label for label, prob in results.items()
        if prob >= req.threshold
    ]

    return {
        "text": req.text,
        "scores": results,
        "toxic_labels": toxic_labels
    }
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check"""
    try:
        db_manager.client.admin.command('ping')
        db_connected = True
    except:
        db_connected = False
    
    models_loaded = any(model is not None for model in ranking_algo.engagement_models.values())
    intelligent_active = len(ranking_algo.intelligent_engine.user_profiles) > 0
    
    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        database_connected=db_connected,
        models_loaded=models_loaded,
        intelligent_engine_active=intelligent_active,
        uptime_seconds=time.time() - app_start_time
    )

@app.post("/api/v1/feed", response_model=FeedResponse)
async def get_intelligent_feed(request: FeedRequest):
  
    start_time = time.time()
    try:
        result = await ranking_algo.generate_intelligent_feed(
            user_id=request.user_id,
            limit=request.limit,
            exclude_post_ids=request.exclude_post_ids or []
        )
        
        return FeedResponse(
            user_id=request.user_id,
            posts=result['posts'],
            total_candidates=result.get('total_candidates', 0),
            generation_time_ms=result['generation_time_ms'],
            timestamp=datetime.now(),
            context=result['context'],
            personalization_active=result['personalization_active'],
            exploration_mode=result['exploration_mode'],
        )
    
    except Exception as e:
        logger.error(f"Error generating feed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/feedback")
async def record_intelligent_feedback(request: FeedbackRequest):
    """
    Record feedback with INTELLIGENT LEARNING
    
    This triggers:
    - Real-time profile update
    - Bandit optimization
    - Session tracking
    """
    try:
        result = ranking_algo.process_feedback(
            user_id=request.user_id,
            post_id=request.post_id,
            event_type=request.event_type,
            dwell_time=request.dwell_time,
            content_type=request.content_type
        )
        
        return {
            **result,
            "message": "Feedback processed with intelligent learning"
        }
    
    except Exception as e:
        logger.error(f"Error recording feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/model/status", response_model=ModelStatusResponse)
async def get_model_status():
    """Get model and intelligence status"""
    
    return ModelStatusResponse(
        status="trained" if ranking_algo.last_trained else "not_trained",
        last_trained=ranking_algo.last_trained,
        models_loaded={
            model_type: model is not None 
            for model_type, model in ranking_algo.engagement_models.items()
        },
        training_samples=ranking_algo.training_samples if ranking_algo.training_samples > 0 else None,
        intelligent_features={
            'real_time_personalization': True,
            'contextual_awareness': True,
            'exploration_exploitation': True,
            'multi_armed_bandit': True,
            'active_user_profiles': len(ranking_algo.intelligent_engine.user_profiles),
            'bandit_arms': len(ranking_algo.intelligent_engine.bandit_arms)
        }
    )

@app.get("/api/v1/user/{user_id}/profile")
async def get_user_intelligence_profile(user_id: str):
    """Get user's intelligent profile"""
    
    profile = ranking_algo.intelligent_engine.user_profiles.get(user_id, {})
    
    if not profile:
        return {
            "user_id": user_id,
            "profile_exists": False,
            "message": "No profile yet - will be created on first interaction"
        }
    
    prefs = profile.get('content_preferences', {})
    total = sum(prefs.values()) if prefs else 1
    
    return {
        "user_id": user_id,
        "profile_exists": True,
        "total_interactions": profile.get('total_interactions', 0),
        "content_preferences": {k: round(v/total*100, 2) for k, v in prefs.items()},
        "last_updated": profile.get('last_updated'),
        "personalization_level": "expert" if profile.get('total_interactions', 0) > 200 
                                else "learning" if profile.get('total_interactions', 0) > 50
                                else "new"
    }

@app.post("/api/v1/model/train")
async def trigger_model_training(background_tasks: BackgroundTasks):
    """Manually trigger model training"""
    background_tasks.add_task(ranking_algo.train_models)
    
    return {
        "status": "training_started",
        "message": "Model training initiated in background"
    }

@app.get("/api/v1/trending")
async def get_trending_posts(limit: int = 20):
    """Get trending posts"""
    try:
        posts_collection = db_manager.get_collection("posts")
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": datetime.now() - timedelta(hours=24)},
                    "is_deleted": {"$ne": True}
                }
            },
            {"$sort": {"engagement_score": -1}},
            {"$limit": limit},
            {
                "$project": {
                    "_id": 1,
                    "userID": 1,
                    "post_type": 1,
                    "content": 1,
                    "engagement_score": 1,
                    "created_at": 1
                }
            }
        ]
        
        trending_docs = list(posts_collection.aggregate(pipeline))
        
        trending = []
        for doc in trending_docs:
            trending.append({
                "post_id": str(doc['_id']),
                "author_id": str(doc['userID']),
                "post_type": doc['post_type'],
                "content": doc['content'],
                "engagement_score": doc['engagement_score'],
                "created_at": str(doc['created_at'])
            })
        
        return {
            "trending_posts": trending,
            "count": len(trending),
            "period": "24_hours"
        }
    
    except Exception as e:
        logger.error(f"Error getting trending: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= MAIN =============

if __name__ == "__main__":
    import uvicorn
    
    print("="*60)
    print("INTELLIGENT SOCIAL MEDIA RECOMMENDATION SYSTEM")
    print("="*60)
 
    uvicorn.run(
        app,
        host=Config.API_HOST,
        port=Config.API_PORT,
        log_level="info"
    )









