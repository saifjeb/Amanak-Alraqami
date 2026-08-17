CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) NOT NULL,
    hashed_password TEXT NOT NULL,
    age_group VARCHAR(10) NOT NULL
        CHECK (age_group IN ('8-10', '11-14')),
    avatar VARCHAR(100) DEFAULT 'avatar1',
    total_points INTEGER NOT NULL DEFAULT 0
        CHECK (total_points >= 0),
    current_level VARCHAR(50)
        NOT NULL
        DEFAULT 'Digital Explorer',
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255)
        UNIQUE
        NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adventures (
    id SERIAL PRIMARY KEY,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150)
        UNIQUE
        NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    badge_name VARCHAR(100),
    completion_points INTEGER
        NOT NULL
        DEFAULT 50
        CHECK (completion_points >= 0),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN
        NOT NULL
        DEFAULT TRUE,
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    adventure_id INT,
    question_type VARCHAR(20) NOT NULL
        CHECK (
            question_type IN (
                'adventure',
                'pre_test',
                'post_test'
            )
        ),

    age_group VARCHAR(10) NOT NULL
        CHECK (
            age_group IN (
                '8-10',
                '11-14'
            )
        ),
    story_text_ar TEXT,
    story_text_en TEXT,
    question_ar TEXT NOT NULL,
    question_en TEXT,
    option_a_ar TEXT NOT NULL,
    option_a_en TEXT,
    option_b_ar TEXT NOT NULL,
    option_b_en TEXT,
    option_c_ar TEXT NOT NULL,
    option_c_en TEXT,
    correct_answer CHAR(1) NOT NULL
        CHECK (
            correct_answer IN (
                'A',
                'B',
                'C'
            )
        ),

    feedback_correct_ar TEXT,
    feedback_correct_en TEXT,
    feedback_wrong_ar TEXT,
    feedback_wrong_en TEXT,
    points INTEGER
        NOT NULL
        DEFAULT 10
        CHECK (points >= 0),
    display_order INTEGER
        NOT NULL
        DEFAULT 1,
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_adventure
        FOREIGN KEY (adventure_id)
        REFERENCES adventures(id)
        ON DELETE CASCADE
);

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    test_type VARCHAR(20) NOT NULL
        CHECK (
            test_type IN (
                'pre_test',
                'post_test'
            )
        ),

    correct_answers INTEGER
        NOT NULL
        DEFAULT 0
        CHECK (correct_answers >= 0),
    total_questions INTEGER NOT NULL
        CHECK (total_questions > 0),
    score_percentage NUMERIC(5,2)
        CHECK (
            score_percentage >= 0
            AND
            score_percentage <= 100
        ),
    completed_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    adventure_id INT NOT NULL,
    score INTEGER
        NOT NULL
        DEFAULT 0
        CHECK (score >= 0),
    earned_points INTEGER
        NOT NULL
        DEFAULT 0
        CHECK (earned_points >= 0),
    completed BOOLEAN
        NOT NULL
        DEFAULT FALSE,
    started_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_progress_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_progress_adventure
        FOREIGN KEY (adventure_id)
        REFERENCES adventures(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_user_adventure
        UNIQUE (user_id, adventure_id)
);

CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
        UNIQUE
        NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(100),
    required_points INTEGER
        NOT NULL
        DEFAULT 0
        CHECK (required_points >= 0),
    created_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_badges_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_badges_badge
        FOREIGN KEY (badge_id)
        REFERENCES badges(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_user_badge
        UNIQUE (user_id, badge_id)
);