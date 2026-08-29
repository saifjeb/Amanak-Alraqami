BEGIN;

DROP VIEW IF EXISTS user_assessment_results CASCADE;
DROP VIEW IF EXISTS user_progress_summary CASCADE;

DROP TABLE IF EXISTS link_codes CASCADE;
DROP TABLE IF EXISTS parent_children CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS question_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS adventures CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    age_group VARCHAR(10) NOT NULL CHECK (age_group IN ('8-10', '11-14')),
    avatar VARCHAR(100) NOT NULL DEFAULT 'avatar1',
    total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    current_level VARCHAR(50) NOT NULL DEFAULT 'Digital Explorer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    refresh_token VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adventures (
    id SERIAL PRIMARY KEY,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) UNIQUE NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    badge_name VARCHAR(100),
    completion_points INTEGER NOT NULL DEFAULT 50 CHECK (completion_points >= 0),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    adventure_id INTEGER,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('adventure','pre_test','post_test')),
    age_group VARCHAR(10) NOT NULL CHECK (age_group IN ('8-10','11-14')),
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
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C')),
    feedback_correct_ar TEXT,
    feedback_correct_en TEXT,
    feedback_wrong_ar TEXT,
    feedback_wrong_en TEXT,
    points INTEGER NOT NULL DEFAULT 10 CHECK (points >= 0),
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_adventure
        FOREIGN KEY (adventure_id)
        REFERENCES adventures(id)
        ON DELETE CASCADE
);

CREATE TABLE question_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A','B','C')),
    is_correct BOOLEAN NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_attempt_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_question_attempt_question
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_question_reward_once
ON question_attempts(user_id, question_id)
WHERE is_correct = TRUE AND points_awarded > 0;

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('pre_test','post_test')),
    correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    score_percentage NUMERIC(5,2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    adventure_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    earned_points INTEGER NOT NULL DEFAULT 0 CHECK (earned_points >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_progress_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_adventure
        FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_adventure UNIQUE (user_id, adventure_id)
);

CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(100),
    required_points INTEGER NOT NULL DEFAULT 0 CHECK (required_points >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_badges_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_badges_badge
        FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

CREATE TABLE parent_children (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_children_parent
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_children_child
        FOREIGN KEY (child_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_parent_child UNIQUE (parent_id, child_id)
);

CREATE TABLE link_codes (
    code VARCHAR(6) PRIMARY KEY,
    parent_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_link_code_parent
        FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

CREATE INDEX idx_adventures_deleted_at ON adventures(deleted_at);
CREATE INDEX idx_questions_adventure ON questions(adventure_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_age ON questions(age_group);
CREATE INDEX idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_question ON question_attempts(question_id);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_type ON attempts(test_type);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_adventure ON progress(adventure_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX idx_parent_children_child ON parent_children(child_id);
CREATE INDEX idx_link_codes_expires ON link_codes(expires_at);

INSERT INTO badges (name,title_ar,title_en,description_ar,description_en,icon,required_points)
VALUES
('password_protector','حامي كلمة المرور','Password Protector','أكملت مغامرة سرّي الرقمي.','Completed My Digital Secret adventure.','lock',50),
('link_detective','محقق الروابط','Link Detective','أكملت مغامرة الرابط الغامض.','Completed The Mystery Link adventure.','link',100),
('stranger_spotter','مكتشف الغرباء','Stranger Spotter','أكملت مغامرة من خلف الشاشة.','Completed Who Is Behind the Screen adventure.','user',150),
('kindness_hero','بطل اللطف الرقمي','Kindness Hero','أكملت مغامرة كن لطيفًا أونلاين.','Completed Be Kind Online adventure.','heart',200),
('privacy_guardian','حارس الخصوصية','Privacy Guardian','أكملت مغامرة فكر قبل أن تنشر.','Completed Think Before You Share adventure.','shield',250),
('smart_helper','طالب المساعدة الذكي','Smart Helper','أكملت مغامرة أحتاج مساعدة.','Completed I Need Help adventure.','help',300),
('cyber_hero','بطل الأمان الرقمي','Cyber Hero','أكملت جميع مغامرات أمانك الرقمي.','Completed all Amanak Alraqami adventures.','trophy',300);


INSERT INTO adventures (title_ar,title_en,description_ar,description_en,icon,badge_name,completion_points,display_order)
VALUES
('سرّي الرقمي','My Digital Secret','تعلم كيف تحمي كلمات المرور والمعلومات الشخصية.','Learn how to protect passwords and personal information.','lock','password_protector',50,1),
('الرابط الغامض','The Mystery Link','تعلم كيفية التعرف على الروابط والرسائل المشبوهة.','Learn how to recognize suspicious links and messages.','link','link_detective',50,2),
('من خلف الشاشة؟','Who Is Behind the Screen?','تعلم كيف تتعامل بأمان مع الأشخاص غير المعروفين عبر الإنترنت.','Learn how to safely interact with unknown people online.','user','stranger_spotter',50,3),
('كن لطيفًا أونلاين','Be Kind Online','تعلم السلوك الرقمي الإيجابي وكيفية التعامل مع التنمر الإلكتروني.','Learn positive digital behavior and how to deal with cyberbullying.','message','kindness_hero',50,4),
('فكّر قبل أن تنشر','Think Before You Share','تعلم حماية خصوصيتك قبل نشر الصور والمعلومات.','Learn how to protect your privacy before sharing photos and information.','camera','privacy_guardian',50,5),
('أحتاج مساعدة','I Need Help','تعلم متى وكيف تطلب المساعدة من شخص بالغ موثوق.','Learn when and how to ask a trusted adult for help.','help','smart_helper',50,6);

INSERT INTO questions (
    adventure_id,question_type,age_group,story_text_ar,story_text_en,
    question_ar,question_en,
    option_a_ar,option_a_en,option_b_ar,option_b_en,option_c_ar,option_c_en,
    correct_answer,feedback_correct_ar,feedback_correct_en,
    feedback_wrong_ar,feedback_wrong_en,points,display_order
)
VALUES
(1,'adventure','8-10','لديك كلمة مرور لحسابك.','You have a password for your account.','ما أفضل طريقة للحفاظ على أمان كلمة المرور؟','What is the best way to keep your password safe?','أشاركها مع أصدقائي','Share it with my friends','أحتفظ بها لنفسي','Keep it to myself','أكتبها في مكان عام','Write it somewhere public','B','رائع! كلمة المرور يجب أن تبقى سرية.','Great! Your password should stay private.','حاول مرة أخرى. لا يجب مشاركة كلمات المرور.','Try again. Passwords should not be shared.',10,1),
(1,'adventure','8-10','أنشأت كلمة مرور جديدة لحسابك.','You created a new password for your account.','أي كلمة مرور هي الأكثر أماناً؟','Which password is safer?','123456','123456','Saif2026','Saif2026','M7#pQ2!x','M7#pQ2!x','C','ممتاز! كلمة المرور القوية تحتوي على أحرف وأرقام ورموز.','Excellent! A strong password uses letters, numbers, and symbols.','حاول اختيار كلمة مرور أصعب في التخمين.','Try choosing a password that is harder to guess.',10,2),
(1,'adventure','8-10','طلب منك صديق أن تعطيه كلمة مرور حسابك.','A friend asks you to give them your account password.','ماذا يجب أن تفعل؟','What should you do?','أعطيه كلمة المرور','Give them the password','أحتفظ بكلمة المرور لنفسي','Keep the password private','أنشرها في مجموعة الأصدقاء','Post it in the friends group','B','صحيح! كلمة المرور يجب أن تبقى خاصة.','Correct! Your password should stay private.','لا تشارك كلمة المرور مع الآخرين.','Do not share your password with others.',10,3),
(1,'adventure','8-10','تستخدم جهازاً ليس جهازك الشخصي.','You are using a device that is not your own.','ماذا تفعل بعد الانتهاء من حسابك؟','What should you do when you finish using your account?','أترك الحساب مفتوحاً','Leave the account signed in','أسجل الخروج من الحساب','Log out of the account','أحفظ كلمة المرور على الجهاز','Save the password on the device','B','رائع! تسجيل الخروج يحمي حسابك.','Great! Logging out helps protect your account.','الأفضل تسجيل الخروج عند استخدام جهاز غير جهازك.','It is safer to log out when using someone else''s device.',10,4),
(1,'adventure','8-10','وصلتك رسالة تطلب منك إرسال كلمة المرور.','You receive a message asking you to send your password.','ما التصرف الصحيح؟','What is the correct action?','أرسل كلمة المرور','Send the password','أتجاهل الطلب وأخبر شخصاً بالغاً موثوقاً','Ignore the request and tell a trusted adult','أرسل كلمة المرور ثم أغيرها لاحقاً','Send it and change it later','B','أحسنت! لا ترسل كلمة المرور واطلب المساعدة عند الحاجة.','Well done! Never send your password and ask for help when needed.','لا ترسل كلمة المرور لأي شخص يطلبها برسالة.','Never send your password to someone asking for it in a message.',10,5);

INSERT INTO questions (
    adventure_id,question_type,age_group,question_ar,question_en,
    option_a_ar,option_a_en,option_b_ar,option_b_en,option_c_ar,option_c_en,
    correct_answer,points,display_order)
VALUES
(NULL,'pre_test','8-10','إذا عرفت كلمة مرور حسابك، ماذا يجب أن تفعل بها؟','What should you do with your account password?','أشاركها مع أصدقائي','Share it with my friends','أحتفظ بها لنفسي','Keep it private','أنشرها في مجموعة','Post it in a group','B',0,1),
(NULL,'pre_test','8-10','وصلتك رسالة فيها رابط غريب. ماذا تفعل؟','You receive a message with a strange link. What should you do?','أضغط على الرابط بسرعة','Click the link immediately','أرسله لأصدقائي','Send it to my friends','لا أضغط عليه وأخبر شخصاً بالغاً موثوقاً','Do not click it and tell a trusted adult','C',0,2),
(NULL,'pre_test','8-10','شخص لا تعرفه على الإنترنت طلب عنوان منزلك. ماذا تفعل؟','Someone you do not know online asks for your home address. What should you do?','أرسل له العنوان','Send the address','لا أشارك المعلومات وأخبر شخصاً بالغاً موثوقاً','Do not share it and tell a trusted adult','أطلب منه عنوانه أولاً','Ask for their address first','B',0,3),
(NULL,'pre_test','8-10','إذا كتب شخص تعليقاً سيئاً عنك على الإنترنت، ما التصرف الأفضل؟','If someone posts a mean comment about you online, what is the best action?','أكتب تعليقاً أسوأ له','Write an even meaner comment','أنشر معلوماته الشخصية','Post their personal information','أحظره أو أبلغ عنه وأخبر شخصاً موثوقاً','Block or report them and tell someone you trust','C',0,4),
(NULL,'pre_test','8-10','قبل نشر صورة على الإنترنت، ماذا يجب أن تفعل؟','Before posting a photo online, what should you do?','أنشرها مباشرة','Post it immediately','أتأكد أنها لا تكشف معلومات خاصة','Make sure it does not reveal private information','أرسلها لكل شخص أعرفه','Send it to everyone I know','B',0,5);

INSERT INTO questions (
    adventure_id,question_type,age_group,question_ar,question_en,
    option_a_ar,option_a_en,option_b_ar,option_b_en,option_c_ar,option_c_en,
    correct_answer,points,display_order)
VALUES
(NULL,'post_test','8-10','أي كلمة مرور من التالية أكثر أماناً؟','Which of these passwords is safer?','123456','123456','password','password','R8#mT2!q','R8#mT2!q','C',0,1),
(NULL,'post_test','8-10','رسالة تقول إنك ربحت جائزة وتطلب منك الضغط على رابط وتسجيل الدخول. ماذا تفعل؟','A message says you won a prize and asks you to click a link and log in. What should you do?','أضغط على الرابط وأدخل كلمة المرور','Click the link and enter my password','أتجاهل الرابط وأخبر شخصاً بالغاً موثوقاً','Ignore the link and tell a trusted adult','أرسل الرابط إلى أصدقائي','Send the link to my friends','B',0,2),
(NULL,'post_test','8-10','شخص تعرفت عليه فقط عبر الإنترنت يطلب معرفة موقعك الحالي. ماذا تفعل؟','Someone you only know online asks for your current location. What should you do?','أرسل له موقعي','Send my location','أرفض مشاركة موقعي وأخبر شخصاً بالغاً موثوقاً','Refuse to share my location and tell a trusted adult','أرسل له صورة لمكاني','Send a photo of where I am','B',0,3),
(NULL,'post_test','8-10','رأيت شخصاً يتعرض للتنمر على الإنترنت. ماذا يمكنك أن تفعل؟','You see someone being bullied online. What can you do?','أشارك في السخرية','Join in','أتجاهل الأمر دائماً','Always ignore it','أدعمه وأبلغ عن التنمر وأخبر شخصاً موثوقاً','Support them, report the bullying, and tell someone you trust','C',0,4),
(NULL,'post_test','8-10','إذا رأيت شيئاً مخيفاً أو غير مريح على الإنترنت، ماذا يجب أن تفعل؟','If you see something scary or uncomfortable online, what should you do?','أخفي الأمر عن الجميع','Hide it from everyone','أخبر شخصاً بالغاً موثوقاً وأطلب المساعدة','Tell a trusted adult and ask for help','أستمر في مشاهدته','Keep watching it','B',0,5);

CREATE OR REPLACE VIEW user_progress_summary AS
SELECT
    u.id AS user_id,
    u.nickname,
    u.age_group,
    u.total_points,
    u.current_level,
    COUNT(p.id) FILTER (WHERE p.completed = TRUE) AS completed_adventures,
    COUNT(p.id) AS started_adventures
FROM users u
LEFT JOIN progress p ON p.user_id = u.id
GROUP BY u.id,u.nickname,u.age_group,u.total_points,u.current_level;

CREATE OR REPLACE VIEW user_assessment_results AS
SELECT
    u.id AS user_id,
    u.nickname,
    u.age_group,
    MAX(CASE WHEN a.test_type = 'pre_test' THEN a.score_percentage END) AS pre_test_score,
    MAX(CASE WHEN a.test_type = 'post_test' THEN a.score_percentage END) AS post_test_score,
    MAX(CASE WHEN a.test_type = 'post_test' THEN a.score_percentage END)
    -
    MAX(CASE WHEN a.test_type = 'pre_test' THEN a.score_percentage END) AS improvement
FROM users u
LEFT JOIN attempts a ON a.user_id = u.id
GROUP BY u.id,u.nickname,u.age_group;

COMMIT;