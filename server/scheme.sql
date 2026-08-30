
BEGIN;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    age_group VARCHAR(10) NOT NULL
        CHECK (age_group IN ('8-10', '11-14')),
    avatar VARCHAR(100) NOT NULL DEFAULT 'avatar1',
    total_points INTEGER NOT NULL DEFAULT 0
        CHECK (total_points >= 0),
    current_level VARCHAR(50) NOT NULL DEFAULT 'Digital Explorer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_active_at TIMESTAMP,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_users_current_level
        CHECK (current_level IN (
            'Digital Explorer',
            'Digital Learner',
            'Cyber Guardian',
            'Digital Hero'
        ))
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

CREATE TABLE media (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL UNIQUE,
    uploaded_by_admin_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_media_admin
        FOREIGN KEY (uploaded_by_admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_media_file_size
        CHECK (file_size > 0),
    CONSTRAINT chk_media_file_size_max
        CHECK (file_size <= 5242880),
    CONSTRAINT chk_media_mime_type
        CHECK (mime_type IN (
            'image/png',
            'image/jpeg',
            'image/webp'
        ))
);

CREATE TABLE adventures (
    id SERIAL PRIMARY KEY,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) UNIQUE NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    badge_name VARCHAR(100),
    completion_points INTEGER NOT NULL DEFAULT 50
        CHECK (completion_points >= 0),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP,
    image_media_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_adventures_display_order_positive
        CHECK (display_order > 0),
    CONSTRAINT fk_adventures_image_media
        FOREIGN KEY (image_media_id)
        REFERENCES media(id)
        ON DELETE SET NULL
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    adventure_id INTEGER,
    question_type VARCHAR(20) NOT NULL
        CHECK (question_type IN ('adventure', 'pre_test', 'post_test')),
    age_group VARCHAR(10) NOT NULL
        CHECK (age_group IN ('8-10', '11-14')),
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
        CHECK (correct_answer IN ('A', 'B', 'C')),
    feedback_correct_ar TEXT,
    feedback_correct_en TEXT,
    feedback_wrong_ar TEXT,
    feedback_wrong_en TEXT,
    points INTEGER NOT NULL DEFAULT 10
        CHECK (points >= 0),
    display_order INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    image_media_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_adventure
        FOREIGN KEY (adventure_id)
        REFERENCES adventures(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_questions_image_media
        FOREIGN KEY (image_media_id)
        REFERENCES media(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_questions_display_order_positive
        CHECK (display_order > 0),
    CONSTRAINT chk_questions_adventure_relationship
        CHECK (
            (question_type = 'adventure' AND adventure_id IS NOT NULL)
            OR
            (question_type IN ('pre_test', 'post_test') AND adventure_id IS NULL)
        )
);

CREATE TABLE question_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer CHAR(1) NOT NULL
        CHECK (selected_answer IN ('A', 'B', 'C')),
    is_correct BOOLEAN NOT NULL,
    points_awarded INTEGER NOT NULL DEFAULT 0
        CHECK (points_awarded >= 0),
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_attempt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_question_attempt_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

CREATE TABLE attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    test_type VARCHAR(20) NOT NULL
        CHECK (test_type IN ('pre_test', 'post_test')),
    correct_answers INTEGER NOT NULL DEFAULT 0
        CHECK (correct_answers >= 0),
    total_questions INTEGER NOT NULL
        CHECK (total_questions > 0),
    score_percentage NUMERIC(5,2) NOT NULL
        CHECK (score_percentage >= 0 AND score_percentage <= 100),
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_attempts_correct_answers_total
        CHECK (correct_answers <= total_questions)
);

CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    adventure_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0
        CHECK (score >= 0 AND score <= 100),
    earned_points INTEGER NOT NULL DEFAULT 0
        CHECK (earned_points >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    name VARCHAR(255) UNIQUE NOT NULL,
    title_ar VARCHAR(150) NOT NULL,
    title_en VARCHAR(150) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    icon VARCHAR(100),
    required_points INTEGER NOT NULL DEFAULT 0
        CHECK (required_points >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE parent_children (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_children_parent
        FOREIGN KEY (parent_id)
        REFERENCES parents(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_parent_children_child
        FOREIGN KEY (child_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_parent_child
        UNIQUE (parent_id, child_id)
);

CREATE TABLE link_codes (
    code VARCHAR(6) PRIMARY KEY,
    parent_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_link_code_parent
        FOREIGN KEY (parent_id)
        REFERENCES parents(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_adventures_deleted_at
ON adventures(deleted_at);

CREATE INDEX idx_questions_adventure
ON questions(adventure_id);

CREATE INDEX idx_questions_type
ON questions(question_type);

CREATE INDEX idx_questions_age
ON questions(age_group);

CREATE INDEX idx_questions_deleted_at
ON questions(deleted_at);

CREATE INDEX idx_question_attempts_user
ON question_attempts(user_id);

CREATE INDEX idx_question_attempts_question
ON question_attempts(question_id);

CREATE INDEX idx_attempts_type
ON attempts(test_type);

CREATE INDEX idx_progress_adventure
ON progress(adventure_id);

CREATE INDEX idx_user_badges_badge
ON user_badges(badge_id);

CREATE INDEX idx_parent_children_child
ON parent_children(child_id);

CREATE INDEX idx_link_codes_parent
ON link_codes(parent_id);

CREATE INDEX idx_link_codes_expires
ON link_codes(expires_at);

CREATE INDEX idx_media_deleted_at
ON media(deleted_at);

CREATE INDEX idx_media_created_at
ON media(created_at);

CREATE INDEX idx_media_uploaded_by_admin
ON media(uploaded_by_admin_id);

CREATE INDEX idx_adventures_image_media_id
ON adventures(image_media_id);

CREATE INDEX idx_questions_image_media_id
ON questions(image_media_id);

CREATE UNIQUE INDEX uq_question_reward_once
ON question_attempts(user_id, question_id)
WHERE is_correct = TRUE AND points_awarded > 0;

CREATE UNIQUE INDEX uq_attempts_user_test_type
ON attempts(user_id, test_type);

CREATE UNIQUE INDEX uq_active_adventure_question_position
ON questions(adventure_id, age_group, display_order)
WHERE question_type = 'adventure' AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_active_assessment_question_position
ON questions(question_type, age_group, display_order)
WHERE question_type IN ('pre_test', 'post_test') AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_active_adventure_display_order
ON adventures(display_order)
WHERE deleted_at IS NULL;

INSERT INTO badges (
    name,
    title_ar,
    title_en,
    description_ar,
    description_en,
    icon,
    required_points
)
VALUES
('password_protector','حامي كلمة المرور','Password Protector','أكملت مغامرة سرّي الرقمي.','Completed My Digital Secret adventure.','lock',50),
('link_detective','محقق الروابط','Link Detective','أكملت مغامرة الرابط الغامض.','Completed The Mystery Link adventure.','link',100),
('stranger_spotter','مكتشف الغرباء','Stranger Spotter','أكملت مغامرة من خلف الشاشة.','Completed Who Is Behind the Screen adventure.','user',150),
('kindness_hero','بطل اللطف الرقمي','Kindness Hero','أكملت مغامرة كن لطيفًا أونلاين.','Completed Be Kind Online adventure.','heart',200),
('privacy_guardian','حارس الخصوصية','Privacy Guardian','أكملت مغامرة فكر قبل أن تنشر.','Completed Think Before You Share adventure.','shield',250),
('smart_helper','طالب المساعدة الذكي','Smart Helper','أكملت مغامرة أحتاج مساعدة.','Completed I Need Help adventure.','help',300),
('cyber_hero','بطل الأمان الرقمي','Cyber Hero','أكملت جميع مغامرات أمانك الرقمي.','Completed all Amanak Alraqami adventures.','trophy',300);


INSERT INTO adventures (
    title_ar,
    title_en,
    description_ar,
    description_en,
    icon,
    badge_name,
    completion_points,
    display_order
)
VALUES
('سرّي الرقمي','My Digital Secret','تعلم كيف تحمي كلمات المرور والمعلومات الشخصية.','Learn how to protect passwords and personal information.','lock','password_protector',50,1),
('الرابط الغامض','The Mystery Link','تعلم كيفية التعرف على الروابط والرسائل المشبوهة.','Learn how to recognize suspicious links and messages.','link','link_detective',50,2),
('من خلف الشاشة؟','Who Is Behind the Screen?','تعلم كيف تتعامل بأمان مع الأشخاص غير المعروفين عبر الإنترنت.','Learn how to safely interact with unknown people online.','user','stranger_spotter',50,3),
('كن لطيفًا أونلاين','Be Kind Online','تعلم السلوك الرقمي الإيجابي وكيفية التعامل مع التنمر الإلكتروني.','Learn positive digital behavior and how to deal with cyberbullying.','message','kindness_hero',50,4),
('فكّر قبل أن تنشر','Think Before You Share','تعلم حماية خصوصيتك قبل نشر الصور والمعلومات.','Learn how to protect your privacy before sharing photos and information.','camera','privacy_guardian',50,5),
('أحتاج مساعدة','I Need Help','تعلم متى وكيف تطلب المساعدة من شخص بالغ موثوق.','Learn when and how to ask a trusted adult for help.','help','smart_helper',50,6);

INSERT INTO questions (
    id,
    adventure_id,
    question_type,
    age_group,
    story_text_ar,
    story_text_en,
    question_ar,
    question_en,
    option_a_ar,
    option_a_en,
    option_b_ar,
    option_b_en,
    option_c_ar,
    option_c_en,
    correct_answer,
    feedback_correct_ar,
    feedback_correct_en,
    feedback_wrong_ar,
    feedback_wrong_en,
    points,
    display_order
)
VALUES
(1, 1, 'adventure', '8-10', 'لديك كلمة مرور لحسابك.', 'You have a password for your account.', 'ما أفضل طريقة للحفاظ على كلمة المرور آمنة؟', 'What is the best way to keep your password safe?', 'أشاركها مع أصدقائي', 'Share it with my friends', 'أحتفظ بها لنفسي', 'Keep it to myself', 'أكتبها في مكان عام', 'Write it somewhere public', 'B', 'رائع! كلمة المرور يجب أن تبقى سرية.', 'Great! Your password should stay private.', 'حاول مرة أخرى. كلمة المرور يجب ألا تتم مشاركتها.', 'Try again. Passwords should not be shared.', 10, 1),
(2, 1, 'adventure', '8-10', 'أنشأت كلمة مرور جديدة لحسابك.', 'You created a new password for your account.', 'أي كلمة مرور هي الأكثر أماناً؟', 'Which password is safer?', '123456', '123456', 'Saif2026', 'Saif2026', 'M7#pQ2!x', 'M7#pQ2!x', 'C', 'ممتاز! كلمة المرور القوية تحتوي على أحرف وأرقام ورموز.', 'Excellent! A strong password uses letters, numbers, and symbols.', 'حاول اختيار كلمة مرور أصعب في التخمين.', 'Try choosing a password that is harder to guess.', 10, 2),
(3, 1, 'adventure', '8-10', 'طلب منك صديق أن تعطيه كلمة مرور حسابك.', 'A friend asks you to give them your account password.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أعطيه كلمة المرور', 'Give them the password', 'أحتفظ بكلمة المرور لنفسي', 'Keep the password private', 'أنشرها في مجموعة الأصدقاء', 'Post it in the friends group', 'B', 'صحيح! كلمة المرور يجب أن تبقى خاصة.', 'Correct! Your password should stay private.', 'لا تشارك كلمة المرور مع الآخرين.', 'Do not share your password with others.', 10, 3),
(4, 1, 'adventure', '8-10', 'تستخدم جهازاً ليس جهازك الشخصي.', 'You are using a device that is not your own.', 'ماذا تفعل بعد الانتهاء من حسابك؟', 'What should you do when you finish using your account?', 'أترك الحساب مفتوحاً', 'Leave the account signed in', 'أسجل الخروج من الحساب', 'Log out of the account', 'أحفظ كلمة المرور على الجهاز', 'Save the password on the device', 'B', 'رائع! تسجيل الخروج يحمي حسابك.', 'Great! Logging out helps protect your account.', 'الأفضل تسجيل الخروج عند استخدام جهاز غير جهازك.', 'It is safer to log out when using someone else''s device.', 10, 4),
(5, 1, 'adventure', '8-10', 'وصلتك رسالة تطلب منك إرسال كلمة المرور.', 'You receive a message asking you to send your password.', 'ما التصرف الصحيح؟', 'What is the correct action?', 'أرسل كلمة المرور', 'Send the password', 'أتجاهل الطلب وأخبر شخصاً بالغاً موثوقاً', 'Ignore the request and tell a trusted adult', 'أرسل كلمة المرور ثم أغيرها لاحقاً', 'Send it and change it later', 'B', 'أحسنت! لا ترسل كلمة المرور واطلب المساعدة عند الحاجة.', 'Well done! Never send your password and ask for help when needed.', 'لا ترسل كلمة المرور لأي شخص يطلبها برسالة.', 'Never send your password to someone asking for it in a message.', 10, 5),
(6, NULL, 'pre_test', '8-10', NULL, NULL, 'إذا عرفت كلمة مرور حسابك، ماذا يجب أن تفعل بها؟', 'What should you do with your account password?', 'أشاركها مع أصدقائي', 'Share it with my friends', 'أحتفظ بها لنفسي', 'Keep it private', 'أنشرها في مجموعة', 'Post it in a group', 'B', NULL, NULL, NULL, NULL, 0, 1),
(7, NULL, 'pre_test', '8-10', NULL, NULL, 'وصلتك رسالة فيها رابط غريب. ماذا تفعل؟', 'You receive a message with a strange link. What should you do?', 'أضغط على الرابط بسرعة', 'Click the link immediately', 'أرسله لأصدقائي', 'Send it to my friends', 'لا أضغط عليه وأخبر شخصاً بالغاً موثوقاً', 'Do not click it and tell a trusted adult', 'C', NULL, NULL, NULL, NULL, 0, 2),
(8, NULL, 'pre_test', '8-10', NULL, NULL, 'شخص لا تعرفه على الإنترنت طلب عنوان منزلك. ماذا تفعل؟', 'Someone you do not know online asks for your home address. What should you do?', 'أرسل له العنوان', 'Send the address', 'لا أشارك المعلومات وأخبر شخصاً بالغاً موثوقاً', 'Do not share it and tell a trusted adult', 'أطلب منه عنوانه أولاً', 'Ask for their address first', 'B', NULL, NULL, NULL, NULL, 0, 3),
(9, NULL, 'pre_test', '8-10', NULL, NULL, 'إذا كتب شخص تعليقاً سيئاً عنك على الإنترنت، ما التصرف الأفضل؟', 'If someone posts a mean comment about you online, what is the best action?', 'أكتب تعليقاً أسوأ له', 'Write an even meaner comment', 'أنشر معلوماته الشخصية', 'Post their personal information', 'أحظره أو أبلغ عنه وأخبر شخصاً موثوقاً', 'Block or report them and tell someone you trust', 'C', NULL, NULL, NULL, NULL, 0, 4),
(10, NULL, 'pre_test', '8-10', NULL, NULL, 'قبل نشر صورة على الإنترنت، ماذا يجب أن تفعل؟', 'Before posting a photo online, what should you do?', 'أنشرها مباشرة', 'Post it immediately', 'أتأكد أنها لا تكشف معلومات خاصة', 'Make sure it does not reveal private information', 'أرسلها لكل شخص أعرفه', 'Send it to everyone I know', 'B', NULL, NULL, NULL, NULL, 0, 5),
(11, NULL, 'post_test', '8-10', NULL, NULL, 'أي كلمة مرور من التالية أكثر أماناً؟', 'Which of these passwords is safer?', '123456', '123456', 'password', 'password', 'R8#mT2!q', 'R8#mT2!q', 'C', NULL, NULL, NULL, NULL, 0, 1),
(12, NULL, 'post_test', '8-10', NULL, NULL, 'رسالة تقول إنك ربحت جائزة وتطلب منك الضغط على رابط وتسجيل الدخول. ماذا تفعل؟', 'A message says you won a prize and asks you to click a link and log in. What should you do?', 'أضغط على الرابط وأدخل كلمة المرور', 'Click the link and enter my password', 'أتجاهل الرابط وأخبر شخصاً بالغاً موثوقاً', 'Ignore the link and tell a trusted adult', 'أرسل الرابط إلى أصدقائي', 'Send the link to my friends', 'B', NULL, NULL, NULL, NULL, 0, 2),
(13, NULL, 'post_test', '8-10', NULL, NULL, 'شخص تعرفت عليه فقط عبر الإنترنت يطلب معرفة موقعك الحالي. ماذا تفعل؟', 'Someone you only know online asks for your current location. What should you do?', 'أرسل له موقعي', 'Send my location', 'أرفض مشاركة موقعي وأخبر شخصاً بالغاً موثوقاً', 'Refuse to share my location and tell a trusted adult', 'أرسل له صورة لمكاني', 'Send a photo of where I am', 'B', NULL, NULL, NULL, NULL, 0, 3),
(14, NULL, 'post_test', '8-10', NULL, NULL, 'رأيت شخصاً يتعرض للتنمر على الإنترنت. ماذا يمكنك أن تفعل؟', 'You see someone being bullied online. What can you do?', 'أشارك في السخرية', 'Join in', 'أتجاهل الأمر دائماً', 'Always ignore it', 'أدعمه وأبلغ عن التنمر وأخبر شخصاً موثوقاً', 'Support them, report the bullying, and tell someone you trust', 'C', NULL, NULL, NULL, NULL, 0, 4),
(15, NULL, 'post_test', '8-10', NULL, NULL, 'إذا رأيت شيئاً مخيفاً أو غير مريح على الإنترنت، ماذا يجب أن تفعل؟', 'If you see something scary or uncomfortable online, what should you do?', 'أخفي الأمر عن الجميع', 'Hide it from everyone', 'أخبر شخصاً بالغاً موثوقاً وأطلب المساعدة', 'Tell a trusted adult and ask for help', 'أستمر في مشاهدته', 'Keep watching it', 'B', NULL, NULL, NULL, NULL, 0, 5),
(17, 2, 'adventure', '8-10', 'وصلتك رسالة من شخص لا تعرفه تقول: اضغط على هذا الرابط لتحصل على جائزة.', 'You receive a message from someone you do not know saying: Click this link to win a prize.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أضغط على الرابط بسرعة', 'Click the link quickly', 'لا أضغط على الرابط وأخبر شخصاً بالغاً موثوقاً', 'Do not click the link and tell a trusted adult', 'أرسل الرابط إلى أصدقائي', 'Send the link to my friends', 'B', 'أحسنت! الروابط من أشخاص غير معروفين قد تكون خطيرة. من الأفضل عدم الضغط عليها وطلب المساعدة.', 'Well done! Links from unknown people can be dangerous. Do not click them and ask a trusted adult for help.', 'حاول مرة أخرى. لا تضغط على رابط من شخص لا تعرفه ولا ترسله للآخرين.', 'Try again. Do not click or share a link sent by someone you do not know.', 10, 1),
(18, 2, 'adventure', '8-10', 'وصلك رابط من رقم غير محفوظ عندك، والرسالة تقول إنه من لعبة تحبها.', 'You receive a link from a number you do not have saved, and the message says it is from a game you like.', 'ما أول شيء يجب أن تتحقق منه قبل التفكير في فتح الرابط؟', 'What should you check first before thinking about opening the link?', 'من أرسل الرسالة وهل أعرفه أو أثق به', 'Who sent the message and whether I know or trust them', 'لون الرابط', 'The color of the link', 'عدد الكلمات في الرسالة', 'The number of words in the message', 'A', 'رائع! معرفة مصدر الرسالة خطوة مهمة قبل فتح أي رابط.', 'Great! Checking who sent the message is an important step before opening any link.', 'حاول مرة أخرى. الأهم هو معرفة من أرسل الرابط وهل المصدر موثوق.', 'Try again. The most important thing is to check who sent the link and whether the source is trustworthy.', 10, 2),
(19, 2, 'adventure', '8-10', 'وصلتك رسالة تقول إن حسابك سيتوقف إذا لم تضغط على الرابط وتسجل الدخول الآن.', 'You receive a message saying your account will be blocked unless you click a link and log in now.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أضغط على الرابط وأدخل كلمة المرور بسرعة', 'Click the link and enter my password quickly', 'أتجاهل الرابط وأفتح التطبيق أو الموقع الرسمي بنفسي', 'Ignore the link and open the official app or website myself', 'أرسل الرابط لصديق ليفحصه', 'Send the link to a friend to check it', 'B', 'ممتاز! الأفضل عدم تسجيل الدخول من رابط مشبوه، بل فتح التطبيق أو الموقع الرسمي مباشرة.', 'Excellent! Do not log in through a suspicious link. Open the official app or website directly instead.', 'حاول مرة أخرى. لا تدخل كلمة المرور من خلال رابط مشبوه.', 'Try again. Never enter your password through a suspicious link.', 10, 3),
(20, 2, 'adventure', '8-10', 'وصلك رابط قصير وغريب ولا يوضح اسم الموقع الحقيقي.', 'You receive a short and strange link that does not clearly show the real website name.', 'ماذا يجب أن تفعل قبل فتحه؟', 'What should you do before opening it?', 'أفتحه لأن الرابط قصير', 'Open it because the link is short', 'لا أفتحه وأطلب مساعدة شخص بالغ موثوق', 'Do not open it and ask a trusted adult for help', 'أرسله إلى شخص آخر ليجربه', 'Send it to someone else to try it', 'B', 'أحسنت! الرابط الغريب أو غير الواضح قد يكون خطيراً، لذلك لا تفتحه واطلب المساعدة.', 'Well done! A strange or unclear link may be dangerous, so do not open it and ask for help.', 'حاول مرة أخرى. لا تفتح أو ترسل رابطاً غريباً لا تعرف إلى أين يؤدي.', 'Try again. Do not open or share a strange link when you do not know where it leads.', 10, 4),
(21, 2, 'adventure', '8-10', 'ضغطت بالخطأ على رابط مشبوه وفتح لك صفحة غريبة.', 'You accidentally click a suspicious link and a strange page opens.', 'ماذا يجب أن تفعل الآن؟', 'What should you do now?', 'أدخل بياناتي لأرى ماذا سيحدث', 'Enter my information to see what happens', 'أغلق الصفحة وأخبر شخصاً بالغاً موثوقاً', 'Close the page and tell a trusted adult', 'أرسل الرابط إلى أصدقائي', 'Send the link to my friends', 'B', 'ممتاز! إذا ضغطت على رابط مشبوه بالخطأ، أغلق الصفحة ولا تدخل أي معلومات واطلب المساعدة.', 'Excellent! If you accidentally click a suspicious link, close the page, do not enter any information, and ask for help.', 'حاول مرة أخرى. لا تدخل أي بيانات ولا تشارك الرابط بعد فتح صفحة مشبوهة.', 'Try again. Do not enter any information or share the link after opening a suspicious page.', 10, 5),
(22, 3, 'adventure', '8-10', 'بدأ شخص جديد يراسلك في لعبة على الإنترنت ويقول إنه في نفس عمرك.', 'A new person starts messaging you in an online game and says they are the same age as you.', 'هل يمكنك التأكد أن هذا الشخص يقول الحقيقة فقط من كلامه؟', 'Can you be sure this person is telling the truth just from what they say?', 'نعم، إذا قال إنه في نفس عمري', 'Yes, if they say they are my age', 'لا، لا يمكنني التأكد من هوية شخص على الإنترنت من كلامه فقط', 'No, I cannot be sure who someone is online just from what they say', 'نعم، إذا كان اسمه لطيفاً', 'Yes, if they have a nice username', 'B', 'أحسنت! الأشخاص على الإنترنت قد لا يكونون كما يقولون، لذلك يجب أن تكون حذراً.', 'Well done! People online may not be who they say they are, so you should be careful.', 'حاول مرة أخرى. لا يمكنك معرفة هوية شخص حقيقية من كلامه أو اسمه على الإنترنت فقط.', 'Try again. You cannot know someone''s real identity only from what they say or their username online.', 10, 1),
(23, 3, 'adventure', '8-10', 'طلب منك شخص تعرفت عليه فقط عبر الإنترنت أن ترسل له صورتك وعنوان منزلك.', 'Someone you only know online asks you to send them your photo and home address.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أرسل الصورة والعنوان لأنه يبدو لطيفاً', 'Send the photo and address because they seem nice', 'لا أشارك معلوماتي وأخبر شخصاً بالغاً موثوقاً', 'Do not share my information and tell a trusted adult', 'أرسل العنوان فقط', 'Send only the address', 'B', 'أحسنت! لا تشارك صورك أو معلوماتك الخاصة مع أشخاص تعرفت عليهم فقط عبر الإنترنت.', 'Well done! Do not share your photos or private information with people you only know online.', 'حاول مرة أخرى. الصور والعنوان معلومات خاصة ويجب عدم مشاركتها مع شخص غريب على الإنترنت.', 'Try again. Photos and your home address are private information and should not be shared with an online stranger.', 10, 2),
(24, 3, 'adventure', '8-10', 'طلب منك شخص تعرفت عليه عبر الإنترنت أن تقابله في مكان قريب دون أن تخبر عائلتك.', 'Someone you met online asks you to meet them nearby without telling your family.', 'ما التصرف الصحيح؟', 'What is the right thing to do?', 'أذهب لمقابلته وحدي', 'Go meet them alone', 'لا أذهب وأخبر شخصاً بالغاً موثوقاً', 'Do not go and tell a trusted adult', 'أقابله لكن لفترة قصيرة فقط', 'Meet them, but only for a short time', 'B', 'أحسنت! لا تقابل شخصاً تعرفت عليه فقط عبر الإنترنت دون علم وموافقة شخص بالغ موثوق.', 'Well done! Never meet someone you only know online without the knowledge and approval of a trusted adult.', 'حاول مرة أخرى. مقابلة شخص من الإنترنت وحدك قد تكون خطيرة.', 'Try again. Meeting someone from the internet alone can be dangerous.', 10, 3),
(25, 3, 'adventure', '8-10', 'قال لك شخص تعرفت عليه عبر الإنترنت: لا تخبر والديك أو أي شخص بالغ عن محادثتنا.', 'Someone you met online tells you: Do not tell your parents or any adult about our conversation.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أبقي المحادثة سرية كما طلب', 'Keep the conversation secret as they asked', 'أخبر شخصاً بالغاً موثوقاً بالمحادثة', 'Tell a trusted adult about the conversation', 'أحذف المحادثة وأستمر في الحديث معه', 'Delete the conversation and keep talking to them', 'B', 'أحسنت! إذا طلب منك شخص على الإنترنت إخفاء المحادثة عن شخص بالغ موثوق، فمن المهم أن تطلب المساعدة.', 'Well done! If someone online asks you to hide a conversation from a trusted adult, it is important to ask for help.', 'حاول مرة أخرى. لا تحتفظ بسر يطلبه منك شخص غريب على الإنترنت عن الأشخاص البالغين الذين تثق بهم.', 'Try again. Do not keep a secret from trusted adults just because an online stranger asks you to.', 10, 4),
(26, 3, 'adventure', '8-10', 'استمر شخص غريب على الإنترنت في إرسال رسائل لك وجعلك تشعر بعدم الارتياح.', 'A stranger online keeps sending you messages and makes you feel uncomfortable.', 'ما أفضل تصرف؟', 'What is the best thing to do?', 'أستمر في الرد عليه', 'Keep replying to them', 'أحظره وأبلغ عنه وأخبر شخصاً بالغاً موثوقاً', 'Block and report them, and tell a trusted adult', 'أرسل له معلومات أكثر عني', 'Send them more information about me', 'B', 'أحسنت! الحظر والإبلاغ وطلب المساعدة من شخص بالغ موثوق هي أفضل طريقة للتعامل مع شخص يجعلك تشعر بعدم الارتياح على الإنترنت.', 'Well done! Blocking, reporting, and asking a trusted adult for help are the safest ways to deal with someone who makes you uncomfortable online.', 'حاول مرة أخرى. لا تستمر في التواصل مع شخص يجعلك تشعر بعدم الارتياح، ولا تشارك معه معلوماتك.', 'Try again. Do not keep talking to someone who makes you uncomfortable, and do not share your information with them.', 10, 5),
(27, 4, 'adventure', '8-10', 'رأيت طالباً في مجموعة على الإنترنت يكتب تعليقاً سيئاً عن طفل آخر.', 'You see a student in an online group posting a mean comment about another child.', 'ما أفضل تصرف؟', 'What is the best thing to do?', 'أشارك في السخرية', 'Join in and make fun of them', 'لا أشارك في التنمر وأدعم الطفل وأخبر شخصاً بالغاً موثوقاً', 'Do not join the bullying, support the child, and tell a trusted adult', 'أرسل التعليق السيئ إلى أصدقائي', 'Send the mean comment to my friends', 'B', 'أحسنت! كن لطيفاً على الإنترنت، ولا تشارك في التنمر وساعد الشخص الذي يتعرض له.', 'Well done! Be kind online, do not join in bullying, and support the person being targeted.', 'حاول مرة أخرى. المشاركة في السخرية أو نشر التعليق يزيد الضرر.', 'Try again. Joining in or sharing the mean comment can make the situation worse.', 10, 1),
(28, 4, 'adventure', '8-10', 'كنت غاضباً من صديقك وفكرت أن تكتب له تعليقاً قاسياً على الإنترنت.', 'You are angry with your friend and think about posting a hurtful comment online.', 'ما الأفضل أن تفعله قبل أن تنشر التعليق؟', 'What is the best thing to do before posting the comment?', 'أنشره فوراً وأنا غاضب', 'Post it immediately while I am angry', 'أتوقف وأفكر إذا كان كلامي سيؤذي شخصاً', 'Stop and think about whether my words could hurt someone', 'أطلب من صديق آخر أن يكتب تعليقاً أسوأ', 'Ask another friend to post an even worse comment', 'B', 'أحسنت! التفكير قبل النشر يساعدك على استخدام كلمات محترمة ولطيفة.', 'Well done! Thinking before you post helps you use respectful and kind words.', 'حاول مرة أخرى. عندما تكون غاضباً، توقف وفكر قبل أن تكتب شيئاً قد يجرح الآخرين.', 'Try again. When you are angry, stop and think before posting something that could hurt others.', 10, 2),
(29, 4, 'adventure', '8-10', 'كتب شخص تعليقاً سيئاً عنك على الإنترنت وجعلك تشعر بالحزن.', 'Someone posts a mean comment about you online and it makes you feel upset.', 'ما أفضل تصرف؟', 'What is the best thing to do?', 'أرد عليه بتعليق أسوأ', 'Reply with an even meaner comment', 'أحظره أو أبلغ عنه وأخبر شخصاً بالغاً موثوقاً', 'Block or report them and tell a trusted adult', 'أنشر معلوماته الشخصية', 'Post their personal information', 'B', 'أحسنت! لا ترد بالإساءة. استخدم الحظر أو الإبلاغ واطلب المساعدة من شخص بالغ موثوق.', 'Well done! Do not respond with more hurtful words. Block or report the person and ask a trusted adult for help.', 'حاول مرة أخرى. الرد بالإساءة أو نشر معلومات الآخرين قد يزيد المشكلة سوءاً.', 'Try again. Responding with hurtful words or sharing someone''s private information can make the situation worse.', 10, 3),
(30, 4, 'adventure', '8-10', 'لديك صورة محرجة لصديقك وفكرت أن تنشرها في مجموعة للضحك.', 'You have an embarrassing photo of your friend and think about sharing it in a group for fun.', 'ما التصرف الصحيح؟', 'What is the right thing to do?', 'أنشرها لأن الجميع سيضحك', 'Share it because everyone will laugh', 'لا أنشرها وأحترم خصوصية صديقي', 'Do not share it and respect my friend''s privacy', 'أرسلها لشخص واحد فقط', 'Send it to only one person', 'B', 'أحسنت! احترام خصوصية الآخرين وعدم نشر صورهم المحرجة بدون إذن تصرف مسؤول.', 'Well done! Respecting other people''s privacy and not sharing embarrassing photos without permission is the responsible choice.', 'حاول مرة أخرى. نشر صورة محرجة دون إذن قد يسبب الأذى حتى لو أرسلتها لشخص واحد فقط.', 'Try again. Sharing an embarrassing photo without permission can hurt someone, even if you send it to only one person.', 10, 4),
(31, 4, 'adventure', '8-10', 'رأيت طفلاً في مجموعة على الإنترنت يتعرض للسخرية من عدة أشخاص.', 'You see a child in an online group being made fun of by several people.', 'كيف يمكنك أن تكون لطيفاً ومسانداً؟', 'How can you be kind and supportive?', 'أنضم للسخرية حتى لا يسخروا مني', 'Join in so they do not make fun of me', 'أدعمه، ولا أشارك في الإساءة، وأخبر شخصاً بالغاً موثوقاً', 'Support them, do not join the hurtful behavior, and tell a trusted adult', 'أتجاهله وأشارك التعليقات مع أصدقائي', 'Ignore it and share the comments with my friends', 'B', 'أحسنت! دعم الشخص الذي يتعرض للتنمر وعدم المشاركة في الإساءة وطلب المساعدة تصرف مسؤول ولطيف.', 'Well done! Supporting someone who is being bullied, not joining in, and asking for help is kind and responsible.', 'حاول مرة أخرى. المشاركة في السخرية أو نشرها قد يزيد الأذى.', 'Try again. Joining in or spreading the hurtful comments can make the bullying worse.', 10, 5),
(32, 5, 'adventure', '8-10', 'التقطت صورة في المنزل وتريد نشرها على الإنترنت.', 'You take a photo at home and want to post it online.', 'ماذا يجب أن تتحقق منه قبل نشر الصورة؟', 'What should you check before posting the photo?', 'أتأكد أن الصورة لا تظهر معلومات خاصة مثل عنوان المنزل أو المدرسة', 'Make sure the photo does not show private information like my home address or school', 'أنشرها فوراً دون النظر إليها', 'Post it immediately without checking it', 'أرسلها أولاً إلى شخص غريب', 'Send it to a stranger first', 'A', 'أحسنت! قبل نشر أي صورة، تأكد أنها لا تكشف معلومات شخصية أو خاصة.', 'Well done! Before posting a photo, make sure it does not reveal personal or private information.', 'حاول مرة أخرى. من المهم فحص الصورة قبل نشرها والتأكد أنها لا تكشف معلومات خاصة.', 'Try again. Always check a photo before posting it to make sure it does not reveal private information.', 10, 1),
(33, 5, 'adventure', '8-10', 'أنت في مكان عام وفكرت أن تنشر موقعك الحالي على الإنترنت.', 'You are in a public place and think about posting your current location online.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أنشر موقعي الحالي للجميع', 'Share my current location with everyone', 'أتجنب نشر موقعي الحالي وأحافظ على خصوصيتي', 'Avoid sharing my current location and protect my privacy', 'أرسل موقعي إلى أشخاص لا أعرفهم', 'Send my location to people I do not know', 'B', 'أحسنت! من الأفضل عدم مشاركة موقعك الحالي على الإنترنت للحفاظ على سلامتك وخصوصيتك.', 'Well done! It is safer not to share your current location online so you can protect your privacy and safety.', 'حاول مرة أخرى. مشاركة موقعك الحالي قد تكشف مكانك لأشخاص لا تعرفهم.', 'Try again. Sharing your current location can reveal where you are to people you do not know.', 10, 2),
(35, 5, 'adventure', '8-10', 'طلب منك شخص على الإنترنت أن تخبره باسم مدرستك ورقم هاتفك.', 'Someone online asks you to tell them your school name and phone number.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أرسل له اسم المدرسة ورقم الهاتف', 'Send them my school name and phone number', 'لا أشارك هذه المعلومات وأخبر شخصاً بالغاً موثوقاً', 'Do not share this information and tell a trusted adult', 'أرسل رقم الهاتف فقط', 'Send only my phone number', 'B', 'أحسنت! اسم المدرسة ورقم الهاتف من المعلومات الشخصية التي يجب حمايتها وعدم مشاركتها مع الغرباء.', 'Well done! Your school name and phone number are personal information that should be protected and not shared with strangers.', 'حاول مرة أخرى. لا تشارك معلومات شخصية مثل المدرسة أو رقم الهاتف مع أشخاص لا تعرفهم.', 'Try again. Do not share personal information such as your school or phone number with people you do not know.', 10, 3),
(36, 5, 'adventure', '8-10', 'نشرت صورة على الإنترنت ثم ندمت وحذفتها بعد قليل.', 'You post a photo online, then regret it and delete it a short time later.', 'هل يعني حذف الصورة أن لا أحد يستطيع أن يكون قد حفظها أو شاركها؟', 'Does deleting the photo mean no one could have saved or shared it?', 'نعم، تختفي من كل مكان فوراً', 'Yes, it disappears from everywhere immediately', 'لا، قد يكون شخص قد حفظها أو شاركها قبل حذفها', 'No, someone may have saved or shared it before it was deleted', 'نعم، إذا حذفتها خلال دقيقة', 'Yes, if I delete it within one minute', 'B', 'أحسنت! ما تنشره على الإنترنت قد يتم حفظه أو مشاركته، لذلك من المهم التفكير قبل النشر.', 'Well done! Something posted online may be saved or shared, so it is important to think before posting.', 'حاول مرة أخرى. حتى لو حذفت شيئاً، قد يكون شخص آخر قد حفظه أو شاركه.', 'Try again. Even if you delete something, another person may already have saved or shared it.', 10, 4),
(37, 5, 'adventure', '8-10', 'التقطت صورة لصديقك وتريد نشرها على الإنترنت.', 'You take a photo of your friend and want to post it online.', 'ماذا يجب أن تفعل قبل نشر الصورة؟', 'What should you do before posting the photo?', 'أنشرها مباشرة لأنها صورتي', 'Post it immediately because I took the photo', 'أطلب إذن صديقي قبل نشر صورته', 'Ask my friend for permission before posting their photo', 'أنشرها وأخبره بعد ذلك', 'Post it first and tell them later', 'B', 'أحسنت! من المهم احترام خصوصية الآخرين وطلب إذنهم قبل نشر صورهم.', 'Well done! It is important to respect other people''s privacy and ask permission before posting their photos.', 'حاول مرة أخرى. يجب احترام خصوصية الآخرين وطلب الإذن قبل نشر صورهم.', 'Try again. Respect other people''s privacy and ask for permission before posting their photos.', 10, 5),
(38, 6, 'adventure', '8-10', 'رأيت شيئاً على الإنترنت أخافك وجعلك تشعر بعدم الارتياح.', 'You see something online that scares you and makes you feel uncomfortable.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أخفي الأمر عن الجميع', 'Hide it from everyone', 'أخبر شخصاً بالغاً موثوقاً وأطلب المساعدة', 'Tell a trusted adult and ask for help', 'أستمر في مشاهدته', 'Keep watching it', 'B', 'أحسنت! إذا رأيت شيئاً مخيفاً أو غير مريح على الإنترنت، اطلب المساعدة من شخص بالغ تثق به.', 'Well done! If you see something scary or uncomfortable online, ask a trusted adult for help.', 'حاول مرة أخرى. لا تحتفظ بالمشكلة لنفسك ولا تستمر في مشاهدة شيء يجعلك غير مرتاح.', 'Try again. Do not keep the problem to yourself or continue viewing something that makes you uncomfortable.', 10, 1),
(39, 6, 'adventure', '8-10', 'أرسل لك شخص على الإنترنت رسالة يهددك فيها ويقول إنه سيؤذيك إذا أخبرت أحداً.', 'Someone online sends you a threatening message and says they will hurt you if you tell anyone.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أخفي الرسالة ولا أخبر أحداً', 'Hide the message and tell no one', 'لا أرد عليه، وأحفظ الرسالة، وأخبر شخصاً بالغاً موثوقاً فوراً', 'Do not reply, keep the message, and tell a trusted adult immediately', 'أهدده برسالة أقوى', 'Threaten them back with a stronger message', 'B', 'أحسنت! إذا هددك شخص على الإنترنت، لا تواجهه وحدك. احتفظ بالدليل واطلب المساعدة من شخص بالغ موثوق.', 'Well done! If someone threatens you online, do not handle it alone. Keep the evidence and ask a trusted adult for help.', 'حاول مرة أخرى. لا تخفِ التهديد ولا ترد بتهديد آخر. اطلب المساعدة من شخص بالغ موثوق.', 'Try again. Do not hide the threat or threaten them back. Ask a trusted adult for help.', 10, 2),
(40, 6, 'adventure', '8-10', 'لاحظت أن حسابك أرسل رسائل لم تكتبها أنت.', 'You notice that your account sent messages that you did not write.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أتجاهل الأمر', 'Ignore it', 'أخبر شخصاً بالغاً موثوقاً وأغير كلمة المرور وأراجع أمان الحساب', 'Tell a trusted adult, change my password, and check the account security', 'أرسل كلمة المرور لأصدقائي ليتأكدوا من الحساب', 'Send my password to my friends so they can check the account', 'B', 'أحسنت! النشاط الغريب قد يعني أن شخصاً آخر دخل إلى حسابك، لذلك اطلب المساعدة وغيّر كلمة المرور.', 'Well done! Strange activity may mean someone else accessed your account, so ask for help and change your password.', 'حاول مرة أخرى. لا تتجاهل النشاط الغريب ولا تشارك كلمة المرور مع الآخرين.', 'Try again. Do not ignore strange activity and never share your password with others.', 10, 3),
(41, 6, 'adventure', '8-10', 'شاركت بالخطأ صورة أو معلومة خاصة على الإنترنت ثم شعرت بالقلق.', 'You accidentally share a private photo or piece of information online and then feel worried.', 'ماذا يجب أن تفعل؟', 'What should you do?', 'أخفي الأمر وأتمنى ألا يلاحظه أحد', 'Hide it and hope no one notices', 'أخبر شخصاً بالغاً موثوقاً بسرعة وأطلب المساعدة', 'Tell a trusted adult quickly and ask for help', 'أشارك معلومات أكثر حتى أنسى المشكلة', 'Share more information so I forget about the problem', 'B', 'أحسنت! إذا شاركت شيئاً خاصاً بالخطأ، اطلب المساعدة بسرعة من شخص بالغ موثوق.', 'Well done! If you accidentally share something private, quickly ask a trusted adult for help.', 'حاول مرة أخرى. إخفاء المشكلة قد يجعلها أصعب، والأفضل طلب المساعدة بسرعة.', 'Try again. Hiding the problem may make it harder to solve, so it is better to ask for help quickly.', 10, 4),
(42, 6, 'adventure', '8-10', 'حدث معك موقف مزعج على الإنترنت وتريد أن تطلب المساعدة.', 'Something upsetting happens to you online and you want to ask for help.', 'من هو الشخص المناسب الذي يمكنك طلب المساعدة منه؟', 'Who is a good person to ask for help?', 'شخص بالغ أثق به مثل أحد الوالدين أو المعلم', 'A trusted adult such as a parent or teacher', 'شخص غريب تعرفت عليه على الإنترنت', 'A stranger I met online', 'أي شخص يرسل لي رسالة', 'Anyone who sends me a message', 'A', 'أحسنت! الشخص البالغ الموثوق مثل أحد الوالدين أو المعلم يمكنه مساعدتك عندما تواجه مشكلة على الإنترنت.', 'Well done! A trusted adult such as a parent or teacher can help you when you have a problem online.', 'حاول مرة أخرى. عند مواجهة مشكلة على الإنترنت، اطلب المساعدة من شخص بالغ تعرفه وتثق به.', 'Try again. When you have an online problem, ask an adult you know and trust for help.', 10, 5),
(43, 1, 'adventure', '11-14', 'أنت تنشئ حساباً جديداً وتحتاج إلى اختيار كلمة مرور قوية.', 'You are creating a new account and need to choose a strong password.', 'أي خيار يعتبر أفضل كلمة مرور؟', 'Which option is the best password?', 'Saif2012', 'Saif2012', '12345678', '12345678', 'T7!mQ#4vL9@p', 'T7!mQ#4vL9@p', 'C', 'ممتاز! كلمة المرور الطويلة والفريدة التي يصعب تخمينها أكثر أماناً.', 'Excellent! A long, unique password that is difficult to guess is more secure.', 'حاول مرة أخرى. تجنب الأسماء والمعلومات الشخصية وتسلسلات الأرقام السهلة.', 'Try again. Avoid names, personal information, and easy number sequences.', 10, 1),
(44, 1, 'adventure', '11-14', 'لديك حسابات للألعاب والبريد الإلكتروني ومنصة تعليمية.', 'You have accounts for games, email, and an educational platform.', 'ما أفضل طريقة لاستخدام كلمات المرور لهذه الحسابات؟', 'What is the best way to use passwords for these accounts?', 'أستخدم نفس كلمة المرور لكل الحسابات حتى أتذكرها بسهولة', 'Use the same password for every account so it is easy to remember', 'أستخدم كلمة مرور قوية ومختلفة لكل حساب', 'Use a strong, different password for each account', 'أستخدم اسمي وتاريخ ميلادي في كل الحسابات', 'Use my name and birthday for every account', 'B', 'أحسنت! استخدام كلمة مرور مختلفة لكل حساب يقلل الضرر إذا تم اختراق أحد الحسابات.', 'Well done! Using a different password for each account limits the damage if one account is compromised.', 'حاول مرة أخرى. استخدام نفس كلمة المرور في عدة حسابات قد يعرض جميع حساباتك للخطر إذا تم كشفها.', 'Try again. Reusing the same password across multiple accounts can put all of them at risk if one password is exposed.', 10, 2),
(45, 1, 'adventure', '11-14', 'أصبح لديك العديد من الحسابات وكلمات المرور المختلفة ويصعب عليك تذكرها كلها.', 'You now have many accounts with different passwords and find it difficult to remember them all.', 'ما الخيار الأكثر أماناً لإدارة كلمات المرور؟', 'What is the safest option for managing your passwords?', 'أكتب كل كلمات المرور في منشور عام', 'Write all my passwords in a public post', 'أستخدم مدير كلمات مرور موثوقاً لحفظ كلمات مرور قوية وفريدة', 'Use a trusted password manager to store strong, unique passwords', 'أستخدم كلمة مرور واحدة سهلة لكل الحسابات', 'Use one easy password for all accounts', 'B', 'ممتاز! مدير كلمات المرور الموثوق يساعدك على استخدام كلمات مرور قوية ومختلفة دون الحاجة إلى حفظها كلها.', 'Excellent! A trusted password manager helps you use strong, different passwords without having to memorize every one.', 'حاول مرة أخرى. لا تنشر كلمات المرور ولا تستخدم كلمة مرور واحدة لجميع حساباتك.', 'Try again. Do not publish passwords or reuse one password across all your accounts.', 10, 3),
(46, 1, 'adventure', '11-14', 'يوفر أحد حساباتك ميزة التحقق بخطوتين (2FA).', 'One of your accounts offers two-factor authentication (2FA).', 'لماذا يُفضل تفعيل التحقق بخطوتين؟', 'Why is it better to enable two-factor authentication?', 'لأنه يضيف خطوة حماية إضافية حتى إذا عرف شخص كلمة المرور', 'Because it adds an extra layer of protection even if someone knows the password', 'لأنه يجعل كلمة المرور أقصر', 'Because it makes the password shorter', 'لأنه يسمح لأي شخص بالدخول إلى الحساب', 'Because it allows anyone to access the account', 'A', 'ممتاز! التحقق بخطوتين يضيف طبقة أمان إضافية، لذلك معرفة كلمة المرور وحدها قد لا تكون كافية للدخول إلى الحساب.', 'Excellent! Two-factor authentication adds another layer of security, so knowing the password alone may not be enough to access the account.', 'حاول مرة أخرى. الهدف من التحقق بخطوتين هو إضافة حماية أخرى إلى جانب كلمة المرور.', 'Try again. The purpose of two-factor authentication is to add another layer of protection in addition to the password.', 10, 4),
(47, 1, 'adventure', '11-14', 'وصلك إشعار بأن شخصاً سجّل الدخول إلى حسابك من جهاز أو مكان لا تعرفه.', 'You receive a notification that someone logged into your account from a device or location you do not recognize.', 'ما أفضل تصرف؟', 'What is the best thing to do?', 'أتجاهل الإشعار إذا كان الحساب ما زال يعمل', 'Ignore the notification if the account still works', 'أغيّر كلمة المرور فوراً، أراجع الأجهزة المسجلة، وأفعّل التحقق بخطوتين إن لم يكن مفعلاً', 'Change the password immediately, review signed-in devices, and enable two-factor authentication if it is not already enabled', 'أرسل كلمة المرور لأصدقائي وأسألهم إن كانوا دخلوا إلى الحساب', 'Send my password to my friends and ask if they logged into the account', 'B', 'أحسنت! تسجيل دخول غير معروف قد يعني أن شخصاً آخر وصل إلى حسابك، لذلك يجب تأمين الحساب بسرعة.', 'Well done! An unfamiliar login may mean someone else accessed your account, so you should secure the account quickly.', 'حاول مرة أخرى. لا تتجاهل تسجيل الدخول غير المعروف ولا تشارك كلمة المرور مع أي شخص.', 'Try again. Do not ignore an unfamiliar login and never share your password with anyone.', 10, 5),
(48, 2, 'adventure', '11-14', 'وصلك بريد إلكتروني يدّعي أنه من منصة تستخدمها ويطلب منك تسجيل الدخول فوراً بسبب مشكلة أمنية.', 'You receive an email claiming to be from a platform you use and asking you to log in immediately because of a security issue.', 'ما أفضل طريقة للتحقق من الرسالة؟', 'What is the best way to verify the message?', 'أضغط على الرابط الموجود في الرسالة مباشرة', 'Click the link in the message immediately', 'أفتح الموقع أو التطبيق الرسمي بنفسي وأتحقق من الحساب من هناك', 'Open the official website or app myself and check the account there', 'أرسل الرابط إلى أصدقائي وأسألهم إن كان آمناً', 'Send the link to my friends and ask if it is safe', 'B', 'أحسنت! فتح الموقع أو التطبيق الرسمي بنفسك يقلل خطر الوقوع في صفحات تصيد مزيفة.', 'Well done! Opening the official website or app yourself reduces the risk of falling for a fake phishing page.', 'حاول مرة أخرى. لا تعتمد على الرابط الموجود في الرسالة المشبوهة، وافتح الخدمة الرسمية بنفسك.', 'Try again. Do not rely on a link inside a suspicious message; open the official service yourself.', 10, 1),
(49, 2, 'adventure', '11-14', 'وصلك رابط يبدو كأنه لموقع معروف، لكن اسم النطاق فيه حرف مختلف عن الاسم الحقيقي.', 'You receive a link that looks like a well-known website, but the domain name has one letter different from the real one.', 'ما الذي يجب أن تفعله؟', 'What should you do?', 'أضغط عليه لأن التصميم يبدو صحيحاً', 'Click it because the design looks correct', 'لا أضغط عليه وأتحقق من اسم النطاق الرسمي بنفسي', 'Do not click it and verify the official domain name myself', 'أشاركه مع أصدقائي ليجربوه', 'Share it with my friends so they can try it', 'B', 'ممتاز! اختلاف بسيط في اسم النطاق قد يكون علامة على موقع مزيف أو محاولة تصيد.', 'Excellent! A small difference in a domain name can be a sign of a fake website or phishing attempt.', 'حاول مرة أخرى. شكل الموقع وحده لا يكفي، ومن المهم التحقق من اسم النطاق الحقيقي.', 'Try again. The appearance of a website is not enough; you should verify the real domain name.', 10, 2),
(50, 2, 'adventure', '11-14', 'وصلك تنبيه يقول: سيتم إغلاق حسابك خلال 10 دقائق إذا لم تضغط على الرابط الآن.', 'You receive a warning saying: Your account will be closed in 10 minutes unless you click this link now.', 'ما الذي قد تشير إليه هذه الرسالة؟', 'What might this message be trying to do?', 'استخدام الاستعجال والخوف لدفعك للضغط على الرابط', 'Use urgency and fear to pressure me into clicking the link', 'مساعدتي على اختيار كلمة مرور أطول', 'Help me choose a longer password', 'إخباري أن الإنترنت بطيء', 'Tell me that the internet is slow', 'A', 'أحسنت! رسائل التصيد كثيراً ما تستخدم الاستعجال أو الخوف حتى تتصرف بسرعة دون التحقق.', 'Well done! Phishing messages often use urgency or fear to make you act quickly without checking.', 'حاول مرة أخرى. الرسائل التي تضغط عليك للتصرف بسرعة قد تكون محاولة تصيد.', 'Try again. Messages that pressure you to act immediately may be phishing attempts.', 10, 3),
(51, 2, 'adventure', '11-14', 'وصلك رابط مختصر مثل bit.ly ولا يمكنك معرفة الموقع الحقيقي الذي سيأخذك إليه.', 'You receive a shortened link such as bit.ly and cannot see the real website it will take you to.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أضغط عليه لمعرفة أين يذهب', 'Click it to find out where it goes', 'لا أفتحه إذا لم أثق بالمصدر، وأتحقق من الرابط أو أطلب المساعدة', 'Do not open it if I do not trust the source, and verify the link or ask for help', 'أرسله إلى شخص آخر ليجربه أولاً', 'Send it to someone else to try first', 'B', 'ممتاز! الروابط المختصرة قد تخفي الموقع الحقيقي، لذلك تحقق منها ولا تفتحها إذا كان المصدر غير موثوق.', 'Excellent! Shortened links can hide the real destination, so verify them and do not open them if the source is untrusted.', 'حاول مرة أخرى. لا تستخدم نفسك أو شخصاً آخر لتجربة رابط غير معروف.', 'Try again. Do not use yourself or someone else to test an unknown link.', 10, 4),
(52, 2, 'adventure', '11-14', 'ضغطت على رابط مشبوه وأدخلت كلمة المرور قبل أن تكتشف أن الصفحة مزيفة.', 'You click a suspicious link and enter your password before realizing the page is fake.', 'ما أفضل تصرف الآن؟', 'What is the best thing to do now?', 'لا أفعل شيئاً لأنني أغلقت الصفحة', 'Do nothing because I closed the page', 'أغيّر كلمة المرور فوراً من الموقع الرسمي، وأفحص الحساب، وأفعّل التحقق بخطوتين', 'Change the password immediately from the official website, review the account, and enable two-factor authentication', 'أستخدم نفس كلمة المرور في حساب آخر', 'Use the same password on another account', 'B', 'أحسنت! إذا أدخلت كلمة مرور في صفحة مزيفة، غيّرها فوراً من الموقع الرسمي وراجع أمان الحساب.', 'Well done! If you enter a password on a fake page, change it immediately from the official website and review your account security.', 'حاول مرة أخرى. إغلاق الصفحة وحده لا يكفي إذا كنت قد أدخلت كلمة المرور بالفعل.', 'Try again. Closing the page is not enough if you already entered your password.', 10, 5),
(53, 3, 'adventure', '11-14', 'تتحدث منذ فترة مع شخص على الإنترنت ويخبرك أنه في نفس عمرك، لكنه يرفض دائماً إثبات هويته.', 'You have been talking online with someone who says they are your age, but they always refuse to verify who they are.', 'ما أفضل طريقة للتعامل مع هذا الموقف؟', 'What is the safest way to handle this situation?', 'أثق به لأننا نتحدث منذ فترة', 'Trust them because we have been talking for a while', 'أبقى حذراً ولا أشارك معلومات خاصة وأخبر شخصاً بالغاً موثوقاً إذا شعرت بالقلق', 'Stay cautious, do not share private information, and tell a trusted adult if I feel concerned', 'أرسل له معلومات شخصية حتى يثق بي', 'Send personal information so they will trust me', 'B', 'أحسنت! طول فترة المحادثة لا يثبت هوية الشخص، لذلك يجب حماية معلوماتك والبقاء حذراً.', 'Well done! Talking to someone for a long time does not prove their identity, so protect your information and stay cautious.', 'حاول مرة أخرى. لا تعتبر مدة التواصل دليلاً على هوية الشخص ولا تشارك معلومات خاصة لإثبات الثقة.', 'Try again. The length of an online conversation does not prove someone''s identity, and you should not share private information to gain trust.', 10, 1),
(54, 3, 'adventure', '11-14', 'شخص تعرفت عليه عبر الإنترنت كان لطيفاً معك لفترة، ثم بدأ يطلب منك أن تبقي محادثاتكما سرية وأن ترسل له معلومات شخصية.', 'Someone you met online was friendly with you for a while, then started asking you to keep your conversations secret and send personal information.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أرسل المعلومات لأنني أصبحت أثق به', 'Send the information because I now trust them', 'أتوقف عن مشاركة المعلومات وأخبر شخصاً بالغاً موثوقاً', 'Stop sharing information and tell a trusted adult', 'أوافق على السرية ما دام الشخص لطيفاً', 'Agree to keep it secret as long as the person seems nice', 'B', 'أحسنت! طلب السرية والمعلومات الشخصية قد يكون علامة تحذير، ومن الأفضل إيقاف المشاركة وطلب المساعدة.', 'Well done! Requests for secrecy and personal information can be warning signs, so stop sharing and ask for help.', 'حاول مرة أخرى. كون الشخص لطيفاً لفترة لا يعني أنه آمن أو أن عليك مشاركة معلوماتك معه.', 'Try again. Someone being friendly for a while does not mean they are safe or that you should share personal information with them.', 10, 2),
(55, 3, 'adventure', '11-14', 'طلب منك شخص تعرفت عليه عبر الإنترنت أن تنقل المحادثة إلى تطبيق خاص وأن تستخدم حساباً سرياً حتى لا يعرف أحد أنكما تتحدثان.', 'Someone you met online asks you to move the conversation to a private app and use a secret account so no one knows you are talking.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أوافق لأن المحادثة الخاصة أكثر أماناً', 'Agree because private chats are safer', 'لا أنقل المحادثة للسرية، وأخبر شخصاً بالغاً موثوقاً إذا شعرت بالضغط أو القلق', 'Do not move the conversation into secrecy, and tell a trusted adult if I feel pressured or concerned', 'أنشئ حساباً جديداً باسم مزيف وأستمر في الحديث معه', 'Create a new account with a fake name and keep talking to them', 'B', 'أحسنت! طلب إخفاء المحادثة أو نقلها إلى مكان سري قد يكون علامة تحذير، لذلك حافظ على حدود واضحة واطلب المساعدة عند الحاجة.', 'Well done! Asking to hide or move a conversation into secrecy can be a warning sign, so keep clear boundaries and ask for help when needed.', 'حاول مرة أخرى. السرية لا تجعل الشخص أكثر أماناً، وقد تكون محاولة لإبعاد المحادثة عن الأشخاص الذين يمكنهم مساعدتك.', 'Try again. Secrecy does not make someone safer and may be an attempt to keep the conversation away from people who could help you.', 10, 3),
(56, 3, 'adventure', '11-14', 'طلب منك شخص تعرفت عليه عبر الإنترنت أن ترسل له صورة شخصية، واستمر في الضغط عليك عندما رفضت.', 'Someone you met online asks you to send them a personal photo and keeps pressuring you after you refuse.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أرسل الصورة حتى يتوقف عن الضغط علي', 'Send the photo so they stop pressuring me', 'أرفض، وأوقف التواصل، وأحظره أو أبلغ عنه، وأخبر شخصاً بالغاً موثوقاً', 'Refuse, stop communicating, block or report them, and tell a trusted adult', 'أرسل له صورة شخص آخر بدلاً من صورتي', 'Send them someone else''s photo instead', 'B', 'أحسنت! لا يجب أن يضغط عليك أحد لمشاركة صورة أو معلومات شخصية. ضع حدوداً واضحة واطلب المساعدة.', 'Well done! No one should pressure you to share a photo or personal information. Set clear boundaries and ask for help.', 'حاول مرة أخرى. الاستجابة للضغط أو إرسال صورة بديلة لا يحل المشكلة، والأفضل إيقاف التواصل وطلب المساعدة.', 'Try again. Giving in to pressure or sending a different photo does not solve the problem. Stop communicating and ask for help.', 10, 4),
(57, 3, 'adventure', '11-14', 'طلب منك شخص تعرفت عليه عبر الإنترنت أن تقابله في مكان عام، وقال لك ألا تخبر أحداً.', 'Someone you met online asks you to meet them in a public place and tells you not to tell anyone.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أذهب وحدي لأن المكان عام', 'Go alone because the place is public', 'لا أذهب وحدي، وأخبر شخصاً بالغاً موثوقاً ولا أرتب أي لقاء دون علمه وموافقته', 'Do not go alone, tell a trusted adult, and do not arrange any meeting without their knowledge and approval', 'أذهب لكن أخبر صديقاً فقط', 'Go, but only tell a friend', 'B', 'أحسنت! لا تقابل شخصاً تعرفت عليه فقط عبر الإنترنت بمفردك، خصوصاً إذا طلب منك إبقاء اللقاء سراً.', 'Well done! Do not meet someone you only know online by yourself, especially if they ask you to keep the meeting secret.', 'حاول مرة أخرى. كون المكان عاماً لا يعني أن اللقاء آمن، وطلب السرية علامة تحذير مهمة.', 'Try again. A public place does not automatically make the meeting safe, and asking for secrecy is an important warning sign.', 10, 5),
(58, 4, 'adventure', '11-14', 'في مجموعة مدرسية على الإنترنت بدأ عدة طلاب بنشر تعليقات ساخرة عن طالب آخر.', 'In an online school group, several students start posting mocking comments about another student.', 'ما التصرف الأكثر مسؤولية؟', 'What is the most responsible thing to do?', 'أشارك في التعليقات حتى لا أبدو مختلفاً', 'Join the comments so I do not look different', 'لا أشارك في التنمر، وأدعم الطالب، وأبلغ عن المحتوى عند الحاجة', 'Do not participate in the bullying, support the student, and report the content when appropriate', 'ألتقط صورة للشاشة وأنشرها في مجموعة أخرى للضحك', 'Take a screenshot and share it in another group for fun', 'B', 'أحسنت! عدم المشاركة في التنمر ودعم الشخص المتضرر والإبلاغ عند الحاجة سلوك رقمي مسؤول.', 'Well done! Refusing to participate in bullying, supporting the person affected, and reporting when needed are responsible digital behaviors.', 'حاول مرة أخرى. المشاركة أو إعادة نشر الإساءة قد تزيد الضرر حتى لو لم تبدأ التنمر بنفسك.', 'Try again. Joining in or resharing hurtful content can increase the harm even if you did not start the bullying.', 10, 1),
(59, 4, 'adventure', '11-14', 'يكرر بعض الطلاب نشر نكات وتعليقات عن طالب معين، والطالب أخبرهم أن ذلك يزعجه لكنه استمر.', 'Some students repeatedly post jokes and comments about one student. The student tells them it is upsetting, but they continue.', 'كيف يمكن وصف هذا السلوك؟', 'How should this behavior be described?', 'مزاح عادي لأنهم يقولون إنها مجرد نكتة', 'Normal joking because they say it is only a joke', 'قد يكون تنمراً إلكترونياً لأنه متكرر ويسبب الأذى رغم طلب الشخص التوقف', 'It may be cyberbullying because it is repeated and causes harm even after the person asks them to stop', 'ليس مشكلة لأن التعليقات تحدث على الإنترنت', 'It is not a problem because the comments happen online', 'B', 'أحسنت! عندما يتكرر السلوك ويؤذي الشخص ويستمر رغم طلبه التوقف، فقد يكون تنمراً إلكترونياً وليس مجرد مزاح.', 'Well done! When behavior is repeated, causes harm, and continues after someone asks for it to stop, it may be cyberbullying rather than harmless joking.', 'حاول مرة أخرى. وصف السلوك بأنه مزاح لا يجعله مقبولاً إذا كان متكرراً ويؤذي الشخص الآخر.', 'Try again. Calling something a joke does not make it acceptable when it is repeated and hurts another person.', 10, 2),
(60, 4, 'adventure', '11-14', 'شاهدت رسائل مسيئة ومتكررة ضد طالب في مجموعة إلكترونية، وتعتقد أن الأمر قد يحتاج إلى تدخل.', 'You see repeated abusive messages targeting a student in an online group, and you think the situation may need intervention.', 'ما التصرف الأكثر فائدة؟', 'What is the most helpful action?', 'أعيد نشر الرسائل حتى يعرف الجميع ما حدث', 'Reshare the messages so everyone knows what happened', 'أحفظ دليلاً مناسباً مثل لقطة شاشة، وأبلغ عن المحتوى، وأخبر شخصاً بالغاً موثوقاً', 'Keep appropriate evidence such as a screenshot, report the content, and tell a trusted adult', 'أرد على المتنمر برسائل مسيئة أكثر', 'Respond to the bully with even more abusive messages', 'B', 'أحسنت! حفظ الدليل والإبلاغ وطلب المساعدة يمكن أن يساعد في التعامل مع التنمر دون زيادة نشر الإساءة.', 'Well done! Keeping evidence, reporting the behavior, and asking for help can address cyberbullying without spreading the harmful content further.', 'حاول مرة أخرى. إعادة نشر الإساءة أو الرد بإساءة أخرى قد يزيد الضرر بدلاً من حله.', 'Try again. Resharing the abuse or responding with more abuse can make the situation worse instead of solving it.', 10, 3),
(61, 4, 'adventure', '11-14', 'أرسل لك صديق رسالة خاصة تحتوي على معلومات شخصية، وفكرت أن تلتقط صورة للمحادثة وتنشرها في مجموعة.', 'A friend sends you a private message containing personal information, and you think about taking a screenshot and sharing it in a group.', 'ما التصرف الأكثر احتراماً ومسؤولية؟', 'What is the most respectful and responsible action?', 'أنشر لقطة الشاشة لأن الرسالة وصلت إلى حسابي', 'Share the screenshot because the message was sent to my account', 'أحترم خصوصية صديقي ولا أنشر المحادثة أو معلوماته دون إذنه', 'Respect my friend''s privacy and do not share the conversation or their information without permission', 'أنشرها بعد حذف اسم صديقي فقط', 'Share it after removing only my friend''s name', 'B', 'أحسنت! الرسائل والمعلومات الخاصة يجب التعامل معها باحترام، ولا ينبغي مشاركتها دون إذن.', 'Well done! Private messages and personal information should be treated respectfully and should not be shared without permission.', 'حاول مرة أخرى. وصول الرسالة إليك لا يعني أن لديك الحق في نشر محتواها أو معلومات الشخص الآخر.', 'Try again. Receiving a private message does not give you permission to share its contents or someone else''s personal information.', 10, 4),
(62, 4, 'adventure', '11-14', 'كنت غاضباً وكتبت تعليقاً جارحاً عن شخص على الإنترنت، ثم حذفته بعد فترة قصيرة.', 'You are angry and post a hurtful comment about someone online, then delete it a short time later.', 'لماذا يجب التفكير قبل نشر مثل هذه التعليقات؟', 'Why should you think before posting comments like this?', 'لأن المحتوى قد يتم حفظه أو مشاركته وقد يؤذي الآخرين ويؤثر على بصمتي الرقمية', 'Because the content may be saved or shared, can hurt others, and may affect my digital footprint', 'لأن كل ما أحذفه يختفي فوراً من الإنترنت', 'Because everything I delete disappears from the internet immediately', 'لأن التعليقات على الإنترنت لا تؤثر على أحد في الواقع', 'Because online comments do not affect anyone in real life', 'A', 'ممتاز! ما تنشره قد يبقى أو يتم مشاركته حتى بعد حذفه، ويمكن أن يؤثر على الآخرين وعلى سمعتك الرقمية.', 'Excellent! What you post may remain or be shared even after deletion, and it can affect other people and your digital reputation.', 'حاول مرة أخرى. المحتوى الرقمي قد يتم حفظه أو مشاركته، ويمكن أن يكون له تأثير حقيقي حتى بعد حذفه.', 'Try again. Digital content can be saved or shared and may have real effects even after you delete it.', 10, 5),
(63, 5, 'adventure', '11-14', 'تريد نشر صورة التقطتها في المنزل، لكن الصورة تظهر معلومات يمكن أن تساعد شخصاً على معرفة مكانك.', 'You want to post a photo taken at home, but the photo shows information that could help someone identify where you live.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أنشر الصورة كما هي لأن المعلومات صغيرة', 'Post the photo as it is because the information is small', 'أراجع الصورة وأزيل أو أخفي أي تفاصيل تكشف موقعي أو معلوماتي الخاصة قبل النشر', 'Review the photo and remove or hide details that reveal my location or private information before posting', 'أنشرها ثم أحذفها لاحقاً إذا لاحظ أحد المعلومات', 'Post it and delete it later if someone notices the information', 'B', 'أحسنت! الصور قد تكشف معلومات من الخلفية أو التفاصيل الصغيرة، لذلك يجب مراجعتها قبل النشر.', 'Well done! Photos can reveal information through background details, so review them carefully before posting.', 'حاول مرة أخرى. حتى التفاصيل الصغيرة في الصورة قد تكشف معلومات خاصة أو موقعك.', 'Try again. Even small details in a photo can reveal private information or your location.', 10, 1),
(64, 5, 'adventure', '11-14', 'لاحظت أن تطبيق الصور يضيف موقعك الجغرافي تلقائياً عند نشر الصور.', 'You notice that a photo app automatically adds your location when you post pictures.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أترك مشاركة الموقع مفعلة دائماً', 'Leave location sharing enabled all the time', 'أراجع إعدادات الموقع وأعطل مشاركة الموقع عندما لا تكون ضرورية', 'Review the location settings and disable location sharing when it is not necessary', 'أنشر موقعي الحالي حتى يعرف الجميع أين أنا', 'Share my current location so everyone knows where I am', 'B', 'أحسنت! مشاركة الموقع تلقائياً قد تكشف مكانك، لذلك من الأفضل التحكم بإعدادات الموقع ومشاركته فقط عند الحاجة.', 'Well done! Automatic location sharing can reveal where you are, so control your location settings and share location only when necessary.', 'حاول مرة أخرى. مشاركة الموقع بشكل دائم قد تكشف معلومات عن مكانك وتحركاتك.', 'Try again. Always sharing your location can reveal information about where you are and where you go.', 10, 2),
(65, 5, 'adventure', '11-14', 'اكتشفت أن حسابك على أحد تطبيقات التواصل مضبوط على الوضع العام ويمكن لأي شخص رؤية منشوراتك ومعلوماتك.', 'You discover that one of your social media accounts is public and anyone can see your posts and information.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أترك الحساب عاماً دائماً', 'Keep the account public all the time', 'أراجع إعدادات الخصوصية وأحدد من يمكنه رؤية منشوراتي ومعلوماتي', 'Review the privacy settings and control who can see my posts and information', 'أنشر معلومات أكثر حتى يعرف الناس من أنا', 'Post more information so people know who I am', 'B', 'أحسنت! مراجعة إعدادات الخصوصية تساعدك على التحكم بمن يستطيع رؤية معلوماتك ومحتواك.', 'Well done! Reviewing privacy settings helps you control who can see your information and content.', 'حاول مرة أخرى. ترك الحساب عاماً قد يسمح لأشخاص لا تعرفهم برؤية معلوماتك ومحتواك.', 'Try again. Keeping an account public may allow people you do not know to see your information and content.', 10, 3),
(66, 5, 'adventure', '11-14', 'تنشر يومياً اسم مدرستك، وقت خروجك من المنزل، الأماكن التي تزورها، ومتى تكون وحدك.', 'You regularly post your school name, when you leave home, the places you visit, and when you are alone.', 'ما المشكلة في مشاركة هذه التفاصيل بشكل مستمر؟', 'What is the risk of regularly sharing these details?', 'لا توجد مشكلة لأنها معلومات عادية', 'There is no risk because this is normal information', 'قد تساعد هذه التفاصيل أشخاصاً لا أعرفهم على معرفة روتيني ومكاني', 'These details could help people I do not know learn my routine and location', 'المشكلة فقط إذا كانت الصور غير واضحة', 'It is only a problem if the photos are unclear', 'B', 'أحسنت! مشاركة تفاصيل كثيرة عن روتينك وموقعك قد تكشف معلومات عن تحركاتك للأشخاص الآخرين.', 'Well done! Sharing too many details about your routine and location can reveal information about your movements to other people.', 'حاول مرة أخرى. حتى المعلومات التي تبدو بسيطة قد تصبح حساسة عندما يتم جمعها معاً.', 'Try again. Even information that seems harmless can become sensitive when several details are combined.', 10, 4),
(67, 5, 'adventure', '11-14', 'فكرت في نشر صورة أو تعليق قد يكون محرجاً أو غير مناسب لأنك تعتقد أنك تستطيع حذفه لاحقاً.', 'You think about posting a photo or comment that may be embarrassing or inappropriate because you believe you can delete it later.', 'لماذا من المهم التفكير قبل النشر؟', 'Why is it important to think before posting?', 'لأن المحتوى قد يتم حفظه أو مشاركته وقد يؤثر على سمعتي الرقمية في المستقبل', 'Because the content may be saved or shared and could affect my digital reputation in the future', 'لأن أي شيء أحذفه يختفي من كل مكان فوراً', 'Because anything I delete disappears from everywhere immediately', 'لأن المنشورات القديمة لا يمكن لأحد رؤيتها', 'Because no one can ever see old posts', 'A', 'أحسنت! ما تنشره يمكن أن يصبح جزءاً من بصمتك الرقمية، وقد يتم حفظه أو مشاركته حتى بعد حذفه.', 'Well done! What you post can become part of your digital footprint and may be saved or shared even after you delete it.', 'حاول مرة أخرى. حذف المحتوى لا يضمن اختفاءه تماماً، لذلك فكر دائماً قبل النشر.', 'Try again. Deleting content does not guarantee that it is completely gone, so always think before posting.', 10, 5),
(68, 6, 'adventure', '11-14', 'تلقيت رسائل متكررة على الإنترنت تجعلك تشعر بالخوف أو التهديد، ولا تعرف إن كان عليك التعامل معها وحدك.', 'You receive repeated online messages that make you feel scared or threatened, and you are unsure whether you should handle the situation alone.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أتعامل مع المشكلة وحدي ولا أخبر أحداً', 'Handle the problem alone and tell no one', 'أحفظ الأدلة وأوقف التواصل وأخبر شخصاً بالغاً موثوقاً', 'Keep evidence, stop communicating, and tell a trusted adult', 'أرد برسائل تهديد أقوى', 'Respond with stronger threats', 'B', 'أحسنت! حفظ الأدلة وإيقاف التواصل وطلب المساعدة يساعدك على التعامل مع التهديد بشكل أكثر أماناً.', 'Well done! Keeping evidence, stopping communication, and asking for help can make it safer to deal with online threats.', 'حاول مرة أخرى. لا تواجه التهديد وحدك ولا ترد بتهديد آخر، بل اطلب المساعدة من شخص بالغ موثوق.', 'Try again. Do not handle threats alone or respond with another threat; ask a trusted adult for help.', 10, 1),
(69, 6, 'adventure', '11-14', 'لاحظت رسائل لم ترسلها وتغييرات غريبة في حسابك، وتعتقد أن شخصاً آخر قد دخل إليه.', 'You notice messages you did not send and strange changes to your account, and you think someone else may have accessed it.', 'ما أفضل تصرف؟', 'What is the best thing to do?', 'أتجاهل الأمر طالما أنني ما زلت أستطيع فتح الحساب', 'Ignore it as long as I can still access the account', 'أغيّر كلمة المرور من الخدمة الرسمية، أراجع الأجهزة والجلسات المسجلة، وأفعّل التحقق بخطوتين', 'Change the password through the official service, review signed-in devices and sessions, and enable two-factor authentication', 'أرسل كلمة المرور لأصدقائي وأسألهم إن كانوا استخدموا الحساب', 'Send my password to my friends and ask whether they used the account', 'B', 'أحسنت! النشاط غير المعروف قد يعني أن الحساب تعرض للاختراق، لذلك يجب تأمينه بسرعة ومراجعة الأجهزة المسجلة.', 'Well done! Unfamiliar activity may mean the account was compromised, so secure it quickly and review signed-in devices.', 'حاول مرة أخرى. لا تتجاهل النشاط الغريب ولا تشارك كلمة المرور مع أي شخص.', 'Try again. Do not ignore suspicious account activity and never share your password with anyone.', 10, 2),
(70, 6, 'adventure', '11-14', 'هددك شخص على الإنترنت بنشر صورة أو محادثة خاصة إذا لم ترسل له مالاً أو معلومات إضافية.', 'Someone online threatens to share a private photo or conversation unless you send them money or more information.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أرسل له ما يطلبه حتى يتوقف', 'Send what they ask for so they stop', 'لا أستجيب للتهديد، أحفظ الأدلة، أوقف التواصل، وأخبر شخصاً بالغاً موثوقاً', 'Do not give in to the threat, keep evidence, stop communicating, and tell a trusted adult', 'أهدده بنشر معلومات عنه أيضاً', 'Threaten to share information about them too', 'B', 'أحسنت! الاستجابة للابتزاز قد تؤدي إلى مزيد من الطلبات. الأفضل حفظ الأدلة وطلب المساعدة فوراً.', 'Well done! Giving in to blackmail can lead to more demands. Keep the evidence and ask for help immediately.', 'حاول مرة أخرى. لا تدفع ولا ترسل معلومات إضافية ولا ترد بتهديد آخر. احفظ الأدلة واطلب المساعدة.', 'Try again. Do not pay, send more information, or respond with another threat. Keep the evidence and ask for help.', 10, 3),
(71, 6, 'adventure', '11-14', 'قمت بالإبلاغ عن حساب يرسل لك رسائل مسيئة، لكن الرسائل استمرت وبدأت تصبح أكثر تهديداً.', 'You reported an account that was sending abusive messages, but the messages continued and became more threatening.', 'ما الخطوة الأفضل الآن؟', 'What is the best next step?', 'أتجاهل الأمر تماماً حتى لو أصبحت الرسائل أخطر', 'Ignore it completely even if the messages become more serious', 'أحفظ الأدلة، أحظر الحساب، وأخبر شخصاً بالغاً موثوقاً لطلب مزيد من المساعدة', 'Keep evidence, block the account, and tell a trusted adult to get further help', 'أنشئ حساباً آخر وأبدأ بمجادلة الشخص', 'Create another account and start arguing with the person', 'B', 'أحسنت! إذا استمرت المشكلة أو أصبحت أكثر خطورة، فمن المهم حفظ الأدلة وتصعيد الأمر إلى شخص بالغ موثوق وعدم التعامل معها وحدك.', 'Well done! If the problem continues or becomes more serious, keep the evidence, involve a trusted adult, and do not handle it alone.', 'حاول مرة أخرى. استمرار التهديدات يحتاج إلى مزيد من المساعدة، وليس التجاهل أو الدخول في مواجهة جديدة.', 'Try again. Continuing threats require further help, not ignoring the problem or starting another confrontation.', 10, 4),
(72, 6, 'adventure', '11-14', 'واجهت مشكلة رقمية خطيرة ولا تعرف كيف تتصرف بمفردك.', 'You face a serious online problem and do not know how to handle it by yourself.', 'من الأفضل أن تطلب منه المساعدة؟', 'Who is the best person to ask for help?', 'شخص بالغ موثوق مثل أحد الوالدين أو المعلم أو المرشد', 'A trusted adult such as a parent, teacher, or counselor', 'شخص غريب تعرفت عليه عبر الإنترنت', 'A stranger you met online', 'لا أحد، لأنني يجب أن أحل كل المشاكل وحدي', 'No one, because I should solve every problem alone', 'A', 'أحسنت! طلب المساعدة من شخص بالغ موثوق خطوة مهمة عندما تواجه مشكلة رقمية خطيرة أو تشعر بالخوف أو التهديد.', 'Well done! Asking a trusted adult for help is important when you face a serious online problem or feel scared or threatened.', 'حاول مرة أخرى. لا يجب أن تواجه المشكلة الخطيرة وحدك، وطلب المساعدة من شخص بالغ موثوق هو الخيار الأكثر أماناً.', 'Try again. You should not face a serious problem alone. Asking a trusted adult for help is the safer choice.', 10, 5),
(73, NULL, 'pre_test', '11-14', 'لديك عدة حسابات على الإنترنت وتريد حمايتها.', 'You have several online accounts and want to keep them secure.', 'أي خيار يوفر حماية أفضل لحساباتك؟', 'Which option provides better protection for your accounts?', 'استخدام نفس كلمة المرور السهلة في كل الحسابات', 'Use the same easy password for every account', 'استخدام كلمات مرور قوية ومختلفة وتفعيل التحقق بخطوتين عند توفره', 'Use strong, different passwords and enable two-factor authentication when available', 'مشاركة كلمة المرور مع صديق حتى يساعدني إذا نسيتها', 'Share the password with a friend so they can help if I forget it', 'B', NULL, NULL, NULL, NULL, 0, 1),
(74, NULL, 'pre_test', '11-14', 'وصلتك رسالة تقول إن حسابك سيتوقف إذا لم تضغط على رابط وتسجل الدخول فوراً.', 'You receive a message saying your account will be suspended unless you click a link and sign in immediately.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أضغط على الرابط وأسجل الدخول بسرعة', 'Click the link and sign in quickly', 'أتجنب الرابط وأفتح الموقع أو التطبيق الرسمي بنفسي للتحقق', 'Avoid the link and open the official website or app myself to check', 'أرسل الرابط إلى صديق ليجربه', 'Send the link to a friend to try it', 'B', NULL, NULL, NULL, NULL, 0, 2),
(75, NULL, 'pre_test', '11-14', 'بدأ شخص لا تعرفه يراسلك عبر الإنترنت ويخبرك أنه في نفس عمرك ويطلب معلومات شخصية.', 'Someone you do not know starts messaging you online, says they are your age, and asks for personal information.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أثق به لأنه يقول إنه في نفس عمري', 'Trust them because they say they are my age', 'لا أشارك معلومات شخصية وأبقى حذراً وأخبر شخصاً بالغاً موثوقاً إذا شعرت بالقلق', 'Do not share personal information, stay cautious, and tell a trusted adult if I feel concerned', 'أرسل له صورتي حتى يثق بي', 'Send them my photo so they will trust me', 'B', NULL, NULL, NULL, NULL, 0, 3),
(76, NULL, 'pre_test', '11-14', 'تريد نشر صورة على الإنترنت، والصورة قد تكشف موقعك أو معلومات شخصية عنك.', 'You want to post a photo online, and the photo may reveal your location or personal information.', 'ما التصرف الأكثر أماناً قبل النشر؟', 'What is the safest thing to do before posting?', 'أنشر الصورة فوراً دون مراجعتها', 'Post the photo immediately without reviewing it', 'أراجع الصورة وأزيل أو أخفي أي معلومات تكشف موقعي أو بياناتي الخاصة', 'Review the photo and remove or hide any information that reveals my location or private details', 'أنشر موقعي أيضاً حتى يعرف الناس أين التقطت الصورة', 'Share my location too so people know where the photo was taken', 'B', NULL, NULL, NULL, NULL, 0, 4),
(77, NULL, 'pre_test', '11-14', 'تتلقى رسائل مسيئة أو مهددة بشكل متكرر على الإنترنت وتشعر بالقلق.', 'You repeatedly receive abusive or threatening messages online and feel worried.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أرد برسائل مسيئة أقوى', 'Respond with stronger abusive messages', 'أحفظ الأدلة وأوقف التواصل وأخبر شخصاً بالغاً موثوقاً', 'Keep evidence, stop communicating, and tell a trusted adult', 'أتجاهل المشكلة دائماً ولا أخبر أحداً', 'Always ignore the problem and tell no one', 'B', NULL, NULL, NULL, NULL, 0, 5),
(78, NULL, 'post_test', '11-14', 'وصلك إشعار بمحاولة تسجيل دخول إلى حسابك من جهاز لا تعرفه.', 'You receive an alert about a login attempt to your account from a device you do not recognize.', 'ما أفضل خطوة لحماية الحساب؟', 'What is the best step to protect the account?', 'أتجاهل الإشعار لأنني ما زلت أستطيع استخدام الحساب', 'Ignore the alert because I can still use the account', 'أغيّر كلمة المرور إلى كلمة قوية وفريدة، أراجع الأجهزة المسجلة، وأفعّل التحقق بخطوتين', 'Change the password to a strong unique one, review signed-in devices, and enable two-factor authentication', 'أرسل كلمة المرور إلى صديق ليتحقق من الحساب', 'Send the password to a friend so they can check the account', 'B', NULL, NULL, NULL, NULL, 0, 1),
(79, NULL, 'post_test', '11-14', 'وصلك بريد إلكتروني يبدو رسمياً ويطلب منك الضغط على رابط لتأكيد حسابك، لكن عنوان الموقع في الرابط مختلف قليلاً عن الموقع الحقيقي.', 'You receive an email that looks official and asks you to click a link to verify your account, but the website address in the link is slightly different from the real one.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أضغط على الرابط لأن البريد يبدو رسمياً', 'Click the link because the email looks official', 'لا أضغط على الرابط وأفتح الموقع أو التطبيق الرسمي بنفسي للتحقق', 'Do not click the link and open the official website or app myself to verify', 'أرسل الرابط إلى مجموعة أصدقائي ليساعدوني في تجربته', 'Send the link to my friends group so they can help test it', 'B', NULL, NULL, NULL, NULL, 0, 2),
(80, NULL, 'post_test', '11-14', 'تحدثت مع شخص عبر الإنترنت لفترة، ثم بدأ يطلب منك رقم هاتفك وصوراً شخصية ويطلب إبقاء المحادثة سرية.', 'You have been talking to someone online for a while, then they start asking for your phone number, personal photos, and ask you to keep the conversation secret.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أرسل المعلومات لأننا نتحدث منذ فترة', 'Send the information because we have been talking for a while', 'لا أشارك المعلومات، أوقف التواصل إذا شعرت بالضغط، وأخبر شخصاً بالغاً موثوقاً', 'Do not share the information, stop communicating if I feel pressured, and tell a trusted adult', 'أرسل بعض المعلومات فقط حتى لا يغضب', 'Send only some information so they do not get upset', 'B', NULL, NULL, NULL, NULL, 0, 3),
(81, NULL, 'post_test', '11-14', 'تريد نشر صورة على حساب عام، والصورة تظهر اسم مدرستك وموقع المكان الذي تتواجد فيه.', 'You want to post a photo on a public account, and the photo shows your school name and the location where you are.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أنشر الصورة كما هي لأنني أستطيع حذفها لاحقاً', 'Post the photo as it is because I can delete it later', 'أراجع الصورة وإعدادات الخصوصية وأزيل التفاصيل التي تكشف معلوماتي أو موقعي قبل النشر', 'Review the photo and privacy settings and remove details that reveal my information or location before posting', 'أضيف موقعي المباشر حتى تكون الصورة أوضح', 'Add my live location so the post is clearer', 'B', NULL, NULL, NULL, NULL, 0, 4),
(82, NULL, 'post_test', '11-14', 'هددك شخص على الإنترنت بأنه سينشر محادثة خاصة إذا لم ترسل له ما يطلبه.', 'Someone online threatens to share a private conversation unless you send them what they ask for.', 'ما التصرف الأكثر أماناً؟', 'What is the safest thing to do?', 'أرسل له ما يطلبه حتى يتوقف', 'Send what they ask for so they stop', 'أحفظ الأدلة، لا أستجيب للتهديد، أوقف التواصل، وأخبر شخصاً بالغاً موثوقاً', 'Keep evidence, do not give in to the threat, stop communicating, and tell a trusted adult', 'أهدده بنشر معلومات عنه أيضاً', 'Threaten to share information about them too', 'B', NULL, NULL, NULL, NULL, 0, 5);

SELECT setval(pg_get_serial_sequence('questions', 'id'), (SELECT MAX(id) FROM questions), true);

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
LEFT JOIN progress p
    ON p.user_id = u.id
GROUP BY
    u.id,
    u.nickname,
    u.age_group,
    u.total_points,
    u.current_level;

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
LEFT JOIN attempts a
    ON a.user_id = u.id
GROUP BY
    u.id,
    u.nickname,
    u.age_group;

COMMIT;
