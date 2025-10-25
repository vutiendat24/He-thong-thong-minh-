import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import NMF
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

"""
===================================================================================
BƯỚC 1: THU THẬP VÀ ĐỊNH NGHĨA DATA
===================================================================================
"""

class DataCollector:
    """
    Hệ thống thu thập và định nghĩa data cho recommendation system
    """
    @staticmethod
    def define_schema():
        """
        Định nghĩa schema cho các bảng data cần thu thập
        """
        schemas = {
            # Bảng 1: Thông tin nội dung
            'contents': {
                'content_id': 'string (primary key)',
                'user_id_author': 'string (tác giả)',
                'text': 'string (nội dung text)',
                'has_image': 'boolean',
                'has_video': 'boolean',
                'topic': 'string (thể thao, giải trí, giáo dục)',
                'hashtags': 'list of strings',
                'created_at': 'timestamp',
                'content_length': 'int (số ký tự)',
                'image_url': 'string (nếu có)',
            },
            
            # Bảng 2: Tương tác của user (QUAN TRỌNG NHẤT)
            'interactions': {
                'interaction_id': 'string (primary key)',
                'user_id': 'string',
                'content_id': 'string',
                'action_type': 'string (view, like, comment, share, save, hide)',
                'timestamp': 'timestamp',
                
                # Metrics chi tiết
                'dwell_time': 'float (giây - thời gian xem bài)',
                'scroll_depth': 'float (0-1 - cuộn đến đâu)',
                'clicked_comments': 'boolean (có mở phần comment không)',
                'clicked_profile': 'boolean (có click vào profile tác giả)',
                'watched_video_percent': 'float (0-1 nếu có video)',
                
                # Context
                'device_type': 'string (mobile, desktop, tablet)',
                'session_id': 'string',
            },
            
            # Bảng 3: User profile
            'users': {
                'user_id': 'string (primary key)',
                'age': 'int',
                'gender': 'string',
                'location': 'string',
                'interests': 'list of strings (sở thích khai báo)',
                'created_at': 'timestamp (ngày đăng ký)',
                'activity_level': 'string (low, medium, high)',
            },
            
            # Bảng 4: Comments (để phân tích sentiment)
            'comments': {
                'comment_id': 'string (primary key)',
                'user_id': 'string',
                'content_id': 'string',
                'comment_text': 'string',
                'timestamp': 'timestamp',
                'parent_comment_id': 'string (null nếu là comment gốc)',
            },
            
            # Bảng 5: Session data
            'sessions': {
                'session_id': 'string (primary key)',
                'user_id': 'string',
                'start_time': 'timestamp',
                'end_time': 'timestamp',
                'total_views': 'int',
                'total_interactions': 'int',
            }
        }
        
        return schemas
    @staticmethod
    def generate_sample_data():
        """
        Tạo dữ liệu mẫu để demo
        """
        np.random.seed(42)
        
        # 1. Contents (100 bài viết)
        topics = ['thể thao', 'giải trí', 'giáo dục']
        contents = pd.DataFrame({
            'content_id': [f'c_{i}' for i in range(100)],
            'user_id_author': [f'author_{np.random.randint(1, 20)}' for _ in range(100)],
            'text': [f'Nội dung bài viết số {i} về chủ đề...' for i in range(100)],
            'has_image': np.random.choice([True, False], 100, p=[0.7, 0.3]),
            'has_video': np.random.choice([True, False], 100, p=[0.3, 0.7]),
            'topic': np.random.choice(topics, 100),
            'created_at': pd.date_range(end=datetime.now(), periods=100, freq='h'),
            'content_length': np.random.randint(50, 500, 100),
        })
        
        # 2. Users (50 users)        
        users = pd.DataFrame({
            'user_id': [f'u_{i}' for i in range(50)],
            'age': np.random.randint(18, 60, 50),
            'gender': np.random.choice(['M', 'F'], 50),
            'location': np.random.choice(['Hanoi', 'HCMC', 'Danang'], 50),
            'created_at': pd.date_range(end=datetime.now(), periods=50, freq='D'),
        })
        
        # 3. Interactions (1000 tương tác)
        interactions = []
        for _ in range(1000):
            user_id = f'u_{np.random.randint(0, 50)}'
            content_id = f'c_{np.random.randint(0, 100)}'
            action = np.random.choice(['view', 'like', 'comment', 'share', 'save', 'hide'], 
                                     p=[0.6, 0.2, 0.1, 0.05, 0.04, 0.01])
            
            # Dwell time: view lâu hơn = engagement cao
            if action == 'view':
                dwell_time = np.random.exponential(15)  # trung bình 15s
            elif action in ['like', 'comment']:
                dwell_time = np.random.exponential(30)  # xem lâu hơn mới like/comment
            else:
                dwell_time = np.random.exponential(45)
            
            interactions.append({
                'interaction_id': f'int_{_}',
                'user_id': user_id,
                'content_id': content_id,
                'action_type': action,
                'timestamp': datetime.now() - timedelta(hours=np.random.randint(0, 168)),
                'dwell_time': min(dwell_time, 300),  # cap ở 5 phút
                'scroll_depth': np.random.uniform(0.3, 1.0),
                'clicked_comments': np.random.choice([True, False], p=[0.3, 0.7]),
                'clicked_profile': np.random.choice([True, False], p=[0.1, 0.9]),
                'device_type': np.random.choice(['mobile', 'desktop'], p=[0.7, 0.3]),
            })
        
        interactions = pd.DataFrame(interactions)        
        print("✓ Generated sample data:")
        print(f"  - Contents: {len(contents)} posts")
        print(f"  - Users: {len(users)} users")
        print(f"  - Interactions: {len(interactions)} interactions")        
        return contents, users, interactions


"""
===================================================================================
BƯỚC 2: XỬ LÝ VÀ FEATURE ENGINEERING
===================================================================================
"""

class FeatureEngineering:
    """
    Xử lý và tạo features từ raw data
    """
    
    @staticmethod
    def compute_implicit_rating(interactions_df):
        """
        Chuyển đổi các hành động thành implicit rating (0-5)
        
        Logic:
        - view: base score
        - dwell_time: càng lâu càng quan tâm
        - like/comment/share: tương tác mạnh
        - hide: negative signal
        """
        def calculate_rating(row):
            score = 0.0
            
            # 1. Base score theo action type
            action_scores = {
                'view': 1.0,
                'like': 3.0,
                'comment': 3.5,
                'share': 4.0,
                'save': 4.5,
                'hide': -2.0
            }
            score += action_scores.get(row['action_type'], 0)
            
            # 2. Dwell time bonus (normalize to 0-1.5)
            # Nếu xem >= 30s thì coi là engagement tốt
            if row['action_type'] != 'hide':
                dwell_bonus = min(row['dwell_time'] / 30.0, 1.5)
                score += dwell_bonus
            
            # 3. Scroll depth bonus
            if row['scroll_depth'] > 0.7:
                score += 0.5
            
            # 4. Clicked comments bonus
            if row['clicked_comments']:
                score += 0.5
            
            # 5. Clicked profile bonus (quan tâm đến tác giả)
            if row['clicked_profile']:
                score += 0.3
            
            # Normalize về scale 0-5
            return max(0, min(5, score))
        
        interactions_df['rating'] = interactions_df.apply(calculate_rating, axis=1)
        
        print("✓ Computed implicit ratings")
        print(f"  - Rating distribution:\n{interactions_df['rating'].describe()}")
        
        return interactions_df
    
    @staticmethod
    def aggregate_user_content_interactions(interactions_df):
        """
        Aggregate multiple interactions của cùng user-content pair
        Lấy max rating và sum dwell_time
        """
        aggregated = interactions_df.groupby(['user_id', 'content_id']).agg({
            'rating': 'max',  # Lấy tương tác tích cực nhất
            'dwell_time': 'sum',  # Tổng thời gian xem
            'timestamp': 'max',  # Lần tương tác gần nhất
        }).reset_index()
        
        print(f"✓ Aggregated interactions: {len(interactions_df)} → {len(aggregated)}")
        
        return aggregated
    
    @staticmethod
    def extract_content_features(contents_df):
        """
        Trích xuất features từ nội dung
        """
        features = contents_df.copy()
        
        # 1. Recency score (nội dung mới hơn = score cao hơn)
        max_date = features['created_at'].max()
        features['recency_hours'] = (max_date - features['created_at']).dt.total_seconds() / 3600
        features['recency_score'] = np.exp(-features['recency_hours'] / 168)  # decay theo tuần
        
        # 2. Content richness score
        features['richness_score'] = (
            features['has_image'].astype(int) * 0.3 +
            features['has_video'].astype(int) * 0.5 +
            (features['content_length'] > 100).astype(int) * 0.2
        )
        
        print("✓ Extracted content features")
        
        return features
    
    @staticmethod
    def build_user_features(users_df, interactions_df):
        """
        Xây dựng features về user behavior
        """
        # 1. User activity metrics
        user_stats = interactions_df.groupby('user_id').agg({
            'content_id': 'count',  # total interactions (dùng content_id thay vì interaction_id)
            'rating': 'mean',  # average engagement
            'dwell_time': 'mean',  # average dwell time
        }).rename(columns={
            'content_id': 'total_interactions',
            'rating': 'avg_rating',
            'dwell_time': 'avg_dwell_time'
        }).reset_index()
        
        # 2. Topic preferences - cần nhận contents_df từ ngoài vào
        # Tạm thời bỏ qua phần này để tránh lỗi
        # Sẽ được xử lý trong hàm fit của model
        
        # 3. Merge (không merge topic_prefs nữa)
        user_features = users_df.merge(user_stats, on='user_id', how='left')
        user_features = user_features.fillna(0)
        
        # 4. User maturity (days since registration)
        user_features['days_since_registration'] = (
            datetime.now() - user_features['created_at']
        ).dt.total_seconds() / 86400
        
        user_features['is_new_user'] = user_features['total_interactions'] < 10
        
        print("✓ Built user features")
        print(f"  - New users: {user_features['is_new_user'].sum()}")
        print(f"  - Active users: {(~user_features['is_new_user']).sum()}")
        
        return user_features


"""
===================================================================================
BƯỚC 3: MÔ HÌNH HYBRID RECOMMENDATION
===================================================================================
"""

class HybridRecommendationSystem:
    """
    Hệ thống gợi ý hybrid hoàn chỉnh
    """
    def __init__(self, alpha=0.5, beta=0.4, gamma=0.1):
        self.alpha = alpha  # CBF weight
        self.beta = beta    # CF weight
        self.gamma = gamma  # Context weight        
        # Components
        self.tfidf = TfidfVectorizer(max_features=100, ngram_range=(1, 2))
        self.nmf_model = None
        self.user_factors = None
        self.item_factors = None
        self.scaler = StandardScaler()
        
        # Storage
        self.content_features = None
        self.user_profiles = {}
        self.interaction_matrix = None
        self.contents_df = None
        self.users_df = None
        
    def fit(self, contents_df, users_df, interactions_df, n_components=15):
        """
        Train toàn bộ hệ thống
        """
        print("\n" + "="*70)
        print("TRAINING HYBRID RECOMMENDATION SYSTEM")
        print("="*70)
        
        self.contents_df = contents_df
        self.users_df = users_df
        
        # 1. Content-Based Features
        print("\n[1/3] Training Content-Based Filtering...")
        self._fit_content_based(contents_df)
        
        # 2. Collaborative Filtering
        print("\n[2/3] Training Collaborative Filtering...")
        self._fit_collaborative(interactions_df, n_components)
        
        # 3. User Profiles
        print("\n[3/3] Building User Profiles...")
        for user_id in users_df['user_id'].unique():
            self._build_user_profile(user_id, interactions_df)
        
        print("\n" + "="*70)
        print("✓ TRAINING COMPLETED")
        print("="*70)
        
        return self
    
    def _fit_content_based(self, contents_df):
        """Fit Content-Based model"""
        # TF-IDF từ text
        text_features = self.tfidf.fit_transform(contents_df['text'])
        
        # Topic one-hot
        topic_dummies = pd.get_dummies(contents_df['topic'])
        
        # Numerical features
        numerical = self.scaler.fit_transform(
            contents_df[['content_length', 'recency_score', 'richness_score']]
        )
        
        # Combine
        self.content_features = np.hstack([
            text_features.toarray(),
            topic_dummies.values,
            numerical,
            contents_df[['has_image', 'has_video']].values
        ])
        
        print(f"  ✓ Content feature shape: {self.content_features.shape}")
    
    def _fit_collaborative(self, interactions_df, n_components):
        """Fit Collaborative Filtering"""
        # User-item matrix
        self.interaction_matrix = interactions_df.pivot_table(
            index='user_id',
            columns='content_id',
            values='rating',
            fill_value=0
        )
        
        # Matrix Factorization
        self.nmf_model = NMF(n_components=n_components, init='random', random_state=42, max_iter=500)
        self.user_factors = self.nmf_model.fit_transform(self.interaction_matrix)
        self.item_factors = self.nmf_model.components_.T
        
        print(f"  ✓ Latent factors: {n_components}")
        print(f"  ✓ Reconstruction error: {self.nmf_model.reconstruction_err_:.4f}")
    
    def _build_user_profile(self, user_id, interactions_df):
        """Build user profile từ interaction history"""
        user_ints = interactions_df[interactions_df['user_id'] == user_id]
        
        if len(user_ints) == 0:
            self.user_profiles[user_id] = np.zeros(self.content_features.shape[1])
            return
        
        # Lấy indices của contents
        content_ids = user_ints['content_id'].values
        indices = [self.contents_df[self.contents_df['content_id'] == cid].index[0] 
                   for cid in content_ids if cid in self.contents_df['content_id'].values]
        
        if len(indices) == 0:
            self.user_profiles[user_id] = np.zeros(self.content_features.shape[1])
            return
        
        # Weighted average
        ratings = user_ints['rating'].values[:len(indices)]
        features = self.content_features[indices]
        profile = np.average(features, axis=0, weights=ratings)
        
        self.user_profiles[user_id] = profile
    
    def _content_based_score(self, user_id, candidate_indices):
        """Tính CBF score"""
        if user_id not in self.user_profiles:
            return np.zeros(len(candidate_indices))
        
        user_profile = self.user_profiles[user_id]
        candidate_features = self.content_features[candidate_indices]
        
        scores = cosine_similarity([user_profile], candidate_features)[0]
        return scores
    
    def _collaborative_score(self, user_id, candidate_content_ids):
        """Tính CF score"""
        if user_id not in self.interaction_matrix.index:
            return np.zeros(len(candidate_content_ids))
        
        user_idx = self.interaction_matrix.index.get_loc(user_id)
        user_vector = self.user_factors[user_idx]
        
        scores = []
        for content_id in candidate_content_ids:
            if content_id in self.interaction_matrix.columns:
                item_idx = self.interaction_matrix.columns.get_loc(content_id)
                item_vector = self.item_factors[item_idx]
                score = np.dot(user_vector, item_vector)
                scores.append(score)
            else:
                scores.append(0)
        
        return np.array(scores)
    
    def _context_score(self, candidate_indices):
        """Tính context score (recency + popularity)"""
        recency = self.contents_df.iloc[candidate_indices]['recency_score'].values
        richness = self.contents_df.iloc[candidate_indices]['richness_score'].values
        return 0.7 * recency + 0.3 * richness
    
    def recommend(self, user_id, top_k=10, exclude_seen=True, interactions_df=None):
        """
        Đề xuất top K nội dung cho user
        """
        # Adaptive weights dựa trên user maturity
        user_info = self.users_df[self.users_df['user_id'] == user_id]
        if len(user_info) == 0:
            return []
        
        is_new = user_info.iloc[0].get('is_new_user', True)
        
        if is_new:
            alpha, beta, gamma = 0.7, 0.2, 0.1  # Ưu tiên CBF cho user mới
        else:
            alpha, beta, gamma = 0.3, 0.5, 0.2  # Ưu tiên CF cho user cũ
        
        # Candidates
        all_indices = np.arange(len(self.contents_df))
        
        # Exclude seen
        if exclude_seen and interactions_df is not None:
            seen_content = interactions_df[interactions_df['user_id'] == user_id]['content_id'].values
            seen_indices = [i for i, cid in enumerate(self.contents_df['content_id']) 
                           if cid in seen_content]
            all_indices = np.array([i for i in all_indices if i not in seen_indices])
        
        if len(all_indices) == 0:
            return []
        
        # Scores
        candidate_content_ids = self.contents_df.iloc[all_indices]['content_id'].values
        
        cbf_scores = self._content_based_score(user_id, all_indices)
        cf_scores = self._collaborative_score(user_id, candidate_content_ids)
        ctx_scores = self._context_score(all_indices)
        
        # Normalize
        cbf_scores = (cbf_scores - cbf_scores.min()) / (cbf_scores.max() - cbf_scores.min() + 1e-10)
        cf_scores = (cf_scores - cf_scores.min()) / (cf_scores.max() - cf_scores.min() + 1e-10)
        ctx_scores = (ctx_scores - ctx_scores.min()) / (ctx_scores.max() - ctx_scores.min() + 1e-10)
        
        # Hybrid score
        final_scores = alpha * cbf_scores + beta * cf_scores + gamma * ctx_scores
        
        # Top K
        top_indices = all_indices[np.argsort(final_scores)[::-1][:top_k]]
        
        recommendations = self.contents_df.iloc[top_indices][
            ['content_id', 'text', 'topic', 'created_at']
        ].copy()
        recommendations['score'] = final_scores[np.argsort(final_scores)[::-1][:top_k]]
        recommendations['cbf_score'] = cbf_scores[np.argsort(final_scores)[::-1][:top_k]]
        recommendations['cf_score'] = cf_scores[np.argsort(final_scores)[::-1][:top_k]]
        
        return recommendations


"""
===================================================================================
BƯỚC 4: DEMO - RUN HỆ THỐNG
===================================================================================
"""

def main():
    print("\n" + "="*70)
    print("HYBRID RECOMMENDATION SYSTEM - COMPLETE DEMO")
    print("="*70)
    
    # 1. Generate data
    print("\n[STEP 1] Generating sample data...")
    collector = DataCollector()
    contents, users, interactions = collector.generate_sample_data()
    
    # 2. Feature engineering
    print("\n[STEP 2] Feature engineering...")
    fe = FeatureEngineering()
    
    interactions = fe.compute_implicit_rating(interactions)
    interactions = fe.aggregate_user_content_interactions(interactions)
    contents = fe.extract_content_features(contents)
    users = fe.build_user_features(users, interactions)
    
    # 3. Train model
    print("\n[STEP 3] Training recommendation model...")
    model = HybridRecommendationSystem(alpha=0.5, beta=0.4, gamma=0.1)
    model.fit(contents, users, interactions, n_components=15)
    
    # 4. Generate recommendations
    print("\n[STEP 4] Generating recommendations...")
    print("\n" + "-"*70)
    
    # Test với 3 users
    test_users = ['u_0', 'u_10', 'u_25']
    
    for user_id in test_users:
        print(f"\n📌 Recommendations for {user_id}:")
        user_info = users[users['user_id'] == user_id].iloc[0]
        print(f"   User type: {'NEW' if user_info['is_new_user'] else 'ACTIVE'}")
        print(f"   Total interactions: {user_info['total_interactions']:.0f}")
        
        recs = model.recommend(user_id, top_k=5, exclude_seen=True, interactions_df=interactions)
        
        if len(recs) > 0:
            print("\n   Top 5 recommendations:")
            for idx, row in recs.iterrows():
                print(f"   {row['content_id']} | {row['topic']:12s} | Score: {row['score']:.3f} | {row['text'][:40]}...")
        print("\n" + "-"*70)
    
    print("\n✓ Demo completed successfully!")
    
    return model, contents, users, interactions

# Run demo
if __name__ == "__main__":
    model, contents, users, interactions = main()